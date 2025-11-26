import express, { Request, Response } from 'express';
import { CoverageDetailModel } from '../models/CoverageDetail';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 보장내역 검색
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, companyType, companyId, companyIds, category, categories, keywords, limit, offset } = req.query;

    const filters: any = {};
    if (companyType) {
      filters.companyType = companyType as '생명보험' | '손해보험';
    }
    if (companyIds) {
      filters.companyIds = Array.isArray(companyIds) 
        ? companyIds.map(id => parseInt(id as string))
        : [parseInt(companyIds as string)];
    } else if (companyId) {
      filters.companyId = parseInt(companyId as string);
    }
    if (categories) {
      filters.categories = Array.isArray(categories) ? categories : [categories];
    } else if (category) {
      filters.category = category as string;
    }
    if (keywords) {
      filters.keywords = Array.isArray(keywords) ? keywords : [keywords];
    }

    const allResults = await CoverageDetailModel.search(q as string || '', filters);
    const totalCount = allResults.length;
    
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : undefined;
    
    let results = allResults;
    if (limitNum !== undefined) {
      const start = offsetNum || 0;
      results = allResults.slice(start, start + limitNum);
    }

    res.json({
      results,
      count: totalCount,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  }
});

// 모든 보장내역 조회
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const results = await CoverageDetailModel.findAll(limit, offset);

    res.json({
      results,
      count: results.length
    });
  } catch (error) {
    console.error('조회 오류:', error);
    res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
  }
});

// 카테고리 목록 조회
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await CoverageDetailModel.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    res.status(500).json({ error: '카테고리 조회 중 오류가 발생했습니다.' });
  }
});

// 키워드 목록 조회
router.get('/keywords', async (req: AuthRequest, res: Response) => {
  try {
    const keywords = await CoverageDetailModel.getKeywords();
    res.json({ keywords });
  } catch (error) {
    console.error('키워드 조회 오류:', error);
    res.status(500).json({ error: '키워드 조회 중 오류가 발생했습니다.' });
  }
});

// PDF 파일 다운로드
router.get('/download/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coverage = await CoverageDetailModel.findById(parseInt(id));

    if (!coverage) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    let filePath = coverage.pdf_path;
    
    // 파일이 존재하지 않으면 대체 경로 시도
    if (!fs.existsSync(filePath)) {
      console.log(`파일이 존재하지 않음: ${filePath}`);
      
      // 대체 경로 시도: baseDir + companyType + filename
      const baseDir = path.join(__dirname, '../../');
      const filename = coverage.pdf_filename || path.basename(filePath);
      
      // coverage 객체에서 company_type 정보 확인 (CoverageDetailWithCompany 타입)
      const coverageWithCompany = coverage as any;
      const companyType = coverageWithCompany.company_type;
      
      // 가능한 경로 목록 생성
      const possiblePaths: string[] = [];
      
      if (companyType) {
        // 보험사 유형에 따른 경로
        possiblePaths.push(path.join(baseDir, companyType, filename));
      }
      
      // 일반적인 경로들
      possiblePaths.push(
        path.join(baseDir, '생명보험', filename),
        path.join(baseDir, '손해보험', filename),
        path.join(baseDir, 'uploads', filename),
        path.join(baseDir, filename)
      );
      
      // 파일명만으로도 시도
      if (filename !== path.basename(filePath)) {
        possiblePaths.push(filePath);
      }
      
      let found = false;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          found = true;
          console.log(`대체 경로에서 파일 발견: ${filePath}`);
          
          // 데이터베이스 경로 업데이트 (선택적)
          try {
            await CoverageDetailModel.update({
              id: parseInt(id),
              // pdf_path는 업데이트하지 않음 (원본 경로 유지)
            });
          } catch (updateError) {
            console.error('경로 업데이트 실패 (무시):', updateError);
          }
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ 
          error: '파일이 존재하지 않습니다.',
          originalPath: coverage.pdf_path,
          filename: filename,
          searchedPaths: possiblePaths,
          message: '파일이 이동되었거나 삭제되었을 수 있습니다. 파일 경로를 확인해주세요.'
        });
      }
    }

    const filename = coverage.pdf_filename || path.basename(filePath);
    
    // UTF-8 인코딩 처리: RFC 5987 표준에 따라 filename* 파라미터 사용
    const encodedFilename = encodeURIComponent(filename);
    const utf8Filename = Buffer.from(filename, 'utf-8').toString('base64');
    
    // 브라우저 호환성을 위해 두 가지 형식 모두 제공
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('다운로드 오류:', error);
    res.status(500).json({ error: '다운로드 중 오류가 발생했습니다.' });
  }
});

// 상세 정보 조회 (마지막에 배치하여 다른 라우트와 충돌 방지)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coverage = await CoverageDetailModel.findById(parseInt(id));

    if (!coverage) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    // 보장 금액 및 특약 사항 가져오기
    const amounts = await CoverageDetailModel.getCoverageAmounts(coverage.id);
    const conditions = await CoverageDetailModel.getSpecialConditions(coverage.id);
    let structuredData = null;
    
    if (coverage.structured_data) {
      try {
        structuredData = JSON.parse(coverage.structured_data);
      } catch (parseError) {
        console.error(`상품 ${coverage.id}의 structured_data 파싱 실패:`, parseError);
      }
    }

    res.json({
      ...coverage,
      coverageAmounts: amounts || [],
      specialConditions: conditions || [],
      structuredData
    });
  } catch (error) {
    console.error('상세 정보 조회 오류:', error);
    res.status(500).json({ error: '상세 정보 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
