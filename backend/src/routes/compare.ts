import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CoverageDetailModel } from '../models/CoverageDetail';
import { database } from '../database/db';
import {
  calculateProductScore,
  getProductScore,
} from '../utils/scoreCalculator';

const router = express.Router();
router.use(authMiddleware);

const db = database.getDb();

// 여러 상품 비교
router.post('/products', async (req: AuthRequest, res: Response) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: '최소 2개 이상의 상품을 선택해주세요.' });
    }

    const products = await Promise.all(
      productIds.map((id) => CoverageDetailModel.findById(id))
    );

    const validProducts = products.filter(p => p !== null);

    if (validProducts.length < 2) {
      return res.status(400).json({ error: '유효한 상품을 찾을 수 없습니다.' });
    }

    // 각 상품의 상세 정보 가져오기
    const comparisonData = await Promise.all(
      validProducts.map(async (product) => {
        try {
          const amounts = await CoverageDetailModel.getCoverageAmounts(
            product!.id
          );
          const conditions = await CoverageDetailModel.getSpecialConditions(
            product!.id
          );
          let structuredData = null;

          if (product!.structured_data) {
            try {
              structuredData = JSON.parse(product!.structured_data);
            } catch (parseError) {
              console.error(
                `상품 ${product!.id}의 structured_data 파싱 실패:`,
                parseError
              );
            }
          }

          // 점수 정보 가져오기 (없으면 계산)
          let score = await getProductScore(product!.id);
          if (!score) {
            try {
              score = await calculateProductScore(product!.id);
            } catch (scoreError) {
              console.error(`상품 ${product!.id} 점수 계산 실패:`, scoreError);
            }
          }

          return {
            ...product,
            coverageAmounts: amounts || [],
            specialConditions: conditions || [],
            structuredData,
            total_score: score ? score.totalScore : null,
            coverage_score: score ? score.coverageScore : null,
            premium_score: score ? score.premiumScore : null,
            special_condition_score: score ? score.specialConditionScore : null,
          };
        } catch (error) {
          console.error(`상품 ${product!.id} 정보 가져오기 실패:`, error);
          return {
            ...product,
            coverageAmounts: [],
            specialConditions: [],
            structuredData: null,
            total_score: null,
            coverage_score: null,
            premium_score: null,
            special_condition_score: null,
          };
        }
      })
    );

    res.json({
      products: comparisonData,
      count: comparisonData.length
    });
  } catch (error) {
    console.error('비교 오류:', error);
    res.status(500).json({ error: '비교 중 오류가 발생했습니다.' });
  }
});

// 카테고리별 비교
router.get('/category/:category', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const { companyType } = req.query;

    let sql = `
      SELECT 
        cd.*,
        ic.name as company_name,
        ic.type as company_type,
        ca.amount,
        ca.condition_text
      FROM coverage_details cd
      JOIN insurance_companies ic ON cd.company_id = ic.id
      JOIN coverage_amounts ca ON cd.id = ca.coverage_id
      WHERE ca.category = ?
    `;

    const params: any[] = [category];

    if (companyType) {
      sql += ` AND ic.type = ?`;
      params.push(companyType);
    }

    sql += ` ORDER BY ca.amount DESC`;

    db.all(sql, params, (err, rows: any) => {
      if (err) {
        res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
      } else {
        res.json({
          category,
          products: rows,
          count: rows.length
        });
      }
    });
  } catch (error) {
    console.error('카테고리 비교 오류:', error);
    res.status(500).json({ error: '카테고리 비교 중 오류가 발생했습니다.' });
  }
});

export default router;

