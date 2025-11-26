import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { parsePDF } from '../utils/pdfParser';
import { InsuranceCompanyModel } from '../models/InsuranceCompany';
import { CoverageDetailModel } from '../models/CoverageDetail';

const router = express.Router();
router.use(authMiddleware);

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/pdf', upload.single('pdf'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일을 업로드해주세요.' });
    }

    const { companyName, companyType, category } = req.body;

    if (!companyName || !companyType) {
      return res.status(400).json({ error: '보험사명과 보험사 유형을 입력해주세요.' });
    }

    // PDF 파싱 (다중 상품 가능)
    const parsedList = await parsePDF(req.file.path);

    if (!parsedList || parsedList.length === 0) {
      return res.status(400).json({ error: 'PDF에서 보험 상품 정보를 추출하지 못했습니다.' });
    }

    // 보험사 찾기 또는 생성
    const company = await InsuranceCompanyModel.findOrCreate(companyName, companyType as '생명보험' | '손해보험');

    // 보장내역 저장 (여러 상품일 수 있음)
    const coverages = [];
    for (const parsedData of parsedList) {
      const coverage = await CoverageDetailModel.create({
        company_id: company.id,
        title: parsedData.title || req.file.originalname,
        content: parsedData.content,
        keywords: parsedData.keywords.join(','),
        category: category || null,
        pdf_path: req.file.path,
        pdf_filename: req.file.originalname
      });
      coverages.push(coverage);
    }

    res.json({
      message: 'PDF 업로드 및 파싱이 완료되었습니다.',
      count: coverages.length,
      coverages
    });
  } catch (error) {
    console.error('PDF 업로드 오류:', error);
    res.status(500).json({ error: 'PDF 업로드 중 오류가 발생했습니다.' });
  }
});

export default router;

