import express, { Response } from 'express';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findChangedFiles, scanDirectory } from '../utils/fileWatcher';
import { parsePDF, getFileHash, getFileMtime } from '../utils/pdfParser';
import { InsuranceCompanyModel } from '../models/InsuranceCompany';
import { CoverageDetailModel } from '../models/CoverageDetail';
import { calculateProductScore } from '../utils/scoreCalculator';

const router = express.Router();
router.use(authMiddleware);

// 모든 파일 목록 조회 (보험사별로 그룹화)
router.get('/files', async (req: AuthRequest, res: Response) => {
  try {
    const baseDir = path.join(__dirname, '../../');
    const lifeInsuranceDir = path.join(baseDir, '생명보험');
    const nonLifeInsuranceDir = path.join(baseDir, '손해보험');

    const allFiles = [
      ...await scanDirectory(lifeInsuranceDir, '생명보험'),
      ...await scanDirectory(nonLifeInsuranceDir, '손해보험')
    ];

    // 보험사별로 그룹화
    const filesByCompany: { [key: string]: typeof allFiles } = {};
    allFiles.forEach(file => {
      const key = `${file.companyName}|${file.companyType}`;
      if (!filesByCompany[key]) {
        filesByCompany[key] = [];
      }
      filesByCompany[key].push(file);
    });

    // 보험사별로 정리
    const companies = Object.keys(filesByCompany).map(key => {
      const [companyName, companyType] = key.split('|');
      return {
        companyName,
        companyType: companyType as '생명보험' | '손해보험',
        files: filesByCompany[key].map(f => ({
          filename: f.filename,
          filePath: f.filePath,
          hash: f.hash,
          mtime: f.mtime.toISOString()
        }))
      };
    });

    res.json({
      totalFiles: allFiles.length,
      companies
    });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ error: '파일 목록 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/scan', async (req: AuthRequest, res: Response) => {
  try {
    const baseDir = path.join(__dirname, '../../');
    const lifeInsuranceDir = path.join(baseDir, '생명보험');
    const nonLifeInsuranceDir = path.join(baseDir, '손해보험');

    const changedFiles = [
      ...await findChangedFiles(lifeInsuranceDir, '생명보험'),
      ...await findChangedFiles(nonLifeInsuranceDir, '손해보험')
    ];

    res.json({
      changedFiles: changedFiles.length,
      files: changedFiles.map(f => ({
        filename: f.filename,
        companyName: f.companyName,
        companyType: f.companyType
      }))
    });
  } catch (error) {
    console.error('스캔 오류:', error);
    res.status(500).json({ error: '스캔 중 오류가 발생했습니다.' });
  }
});

// 전체 파일 업데이트
router.post('/update', async (req: AuthRequest, res: Response) => {
  try {
    const baseDir = path.join(__dirname, '../../');
    const lifeInsuranceDir = path.join(baseDir, '생명보험');
    const nonLifeInsuranceDir = path.join(baseDir, '손해보험');

    // 파일 업데이트 버튼을 누르면 모든 파일을 강제로 업데이트
    const allFiles = [
      ...await scanDirectory(lifeInsuranceDir, '생명보험'),
      ...await scanDirectory(nonLifeInsuranceDir, '손해보험')
    ];

    const results = await processFiles(allFiles);

    res.json({
      message: '업데이트 완료',
      ...results
    });
  } catch (error) {
    console.error('업데이트 오류:', error);
    res.status(500).json({ error: '업데이트 중 오류가 발생했습니다.' });
  }
});

// 보험사별 파일 업데이트
router.post('/update/company', async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, companyType } = req.body;

    if (!companyName || !companyType) {
      return res.status(400).json({ error: '보험사명과 유형이 필요합니다.' });
    }

    const baseDir = path.join(__dirname, '../../');
    const targetDir = path.join(
      baseDir,
      companyType === '생명보험' ? '생명보험' : '손해보험'
    );

    const allFiles = await scanDirectory(targetDir, companyType);
    const companyFiles = allFiles.filter(f => f.companyName === companyName);

    if (companyFiles.length === 0) {
      return res.status(404).json({ error: '해당 보험사의 파일을 찾을 수 없습니다.' });
    }

    const results = await processFiles(companyFiles);

    res.json({
      message: '업데이트 완료',
      ...results
    });
  } catch (error) {
    console.error('보험사별 업데이트 오류:', error);
    res.status(500).json({ error: '업데이트 중 오류가 발생했습니다.' });
  }
});

// 파일 처리 공통 함수
async function processFiles(allFiles: any[]) {
  const results = {
    updated: 0,
    created: 0,
    errors: [] as string[]
  };

  console.log(`총 ${allFiles.length}개의 파일을 업데이트합니다.`);

  for (const fileInfo of allFiles) {
    try {
      // PDF 파싱 (다중 상품 가능)
      const parsedList = await parsePDF(fileInfo.filePath);

      if (!parsedList || parsedList.length === 0) {
        console.warn(
          `⚠️ PDF에서 상품 정보를 찾지 못했습니다: ${fileInfo.filename}`
        );
        continue;
      }

      const hash = getFileHash(fileInfo.filePath);
      const mtime = getFileMtime(fileInfo.filePath);

      // 보험사 찾기 또는 생성
      const company = await InsuranceCompanyModel.findOrCreate(
        fileInfo.companyName,
        fileInfo.companyType
      );

      // 기존 상품들 조회 및 삭제 (해당 PDF 기준으로 전체 리프레시)
      const existingList = await CoverageDetailModel.findAllByPdfPath(
        fileInfo.filePath
      );
      if (existingList.length > 0) {
        await CoverageDetailModel.deleteByPdfPath(fileInfo.filePath);
      }

      // 새로 파싱된 각 상품을 개별 레코드로 생성
      for (const parsedData of parsedList) {
        try {
          const newCoverage = await CoverageDetailModel.create({
            company_id: company.id,
            title: parsedData.title,
            content: parsedData.content,
            keywords: parsedData.keywords.join(','),
            category: extractCategory(fileInfo.filename),
            pdf_path: fileInfo.filePath,
            pdf_filename: fileInfo.filename,
            pdf_hash: hash,
            pdf_mtime: mtime,
            premium_amount: parsedData.structuredData.premiumAmount || null,
            coverage_period: parsedData.structuredData.coveragePeriod || null,
            structured_data: parsedData.structuredData
          });

          // 통계 집계 (기존이 있었으면 updated, 없었으면 created)
          if (existingList.length > 0) {
            results.updated++;
          } else {
            results.created++;
          }

          // 점수 자동 계산
          try {
            await calculateProductScore(newCoverage.id);
          } catch (scoreError) {
            console.error(`점수 계산 오류 (${fileInfo.filename}):`, scoreError);
            // 점수 계산 실패는 업데이트 실패로 간주하지 않음
          }
        } catch (productError: any) {
          console.error(
            `상품 생성/업데이트 오류 (${fileInfo.filename} / ${parsedData.title}):`,
            productError
          );
          results.errors.push(
            `${fileInfo.filename} / ${parsedData.title}: ${productError.message}`
          );
        }
      }
    } catch (error: any) {
      console.error(`파일 업데이트 오류 (${fileInfo.filename}):`, error);
      results.errors.push(`${fileInfo.filename}: ${error.message}`);
    }
  }

  return results;
}

function extractCategory(filename: string): string | null {
  const categories: { [key: string]: string } = {
    '사망보험금유동화': '사망보험금유동화',
    '간병치매플랜': '간병/치매',
    '당뇨보험': '당뇨',
    '영업방향': '영업자료',
    '영업이슈': '영업자료',
    '교안': '교육자료',
    '교육자료': '교육자료',
    '상품전략': '상품전략',
    '마케팅팩': '마케팅',
    '판매포인트': '판매자료'
  };

  for (const [key, category] of Object.entries(categories)) {
    if (filename.includes(key)) {
      return category;
    }
  }

  return null;
}

// 등록된 상품 목록 조회 (보험사별로 그룹화)
router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const products = await CoverageDetailModel.getAllGroupedByCompany();
    res.json({
      companies: products,
      totalProducts: products.reduce((sum, company) => sum + company.products.length, 0)
    });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    res.status(500).json({ error: '상품 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 전체 상품 삭제 (더 구체적인 라우트보다 먼저 정의)
router.delete('/products', async (req: AuthRequest, res: Response) => {
  try {
    const db = require('../database/db').database.getDb();
    
    // 전체 상품 개수 확인
    const countResult = await new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM coverage_details', [], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.count || 0);
        }
      });
    });

    if (countResult === 0) {
      return res.json({
        success: true,
        message: '삭제할 상품이 없습니다.',
        deletedCount: 0
      });
    }

    // 전체 상품 삭제 (CASCADE로 관련 데이터도 자동 삭제됨)
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM coverage_details', [], (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    console.log(`전체 상품 삭제 완료: ${countResult}개 상품 삭제됨`);
    
    res.json({
      success: true,
      message: `전체 ${countResult}개 상품이 삭제되었습니다.`,
      deletedCount: countResult
    });
  } catch (error: any) {
    console.error('전체 상품 삭제 오류:', error);
    res.status(500).json({ error: error.message || '전체 상품 삭제 중 오류가 발생했습니다.' });
  }
});

// 개별 상품 삭제 (전체 삭제 라우트보다 나중에 정의)
router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: '유효하지 않은 상품 ID입니다.' });
    }

    // 상품 존재 확인
    const product = await CoverageDetailModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    // 상품 삭제
    await CoverageDetailModel.delete(productId);
    
    console.log(`상품 삭제 완료: ID ${productId} - ${product.title}`);
    
    res.json({
      success: true,
      message: '상품이 삭제되었습니다.',
      deletedId: productId
    });
  } catch (error: any) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({ error: error.message || '상품 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;

