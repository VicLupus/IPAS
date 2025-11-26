import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculateProductScore, getProductScore } from '../utils/scoreCalculator';
import { CoverageDetailModel } from '../models/CoverageDetail';
import { database } from '../database/db';

const router = express.Router();
router.use(authMiddleware);

const db = database.getDb();

// 상품 점수 계산
router.post('/calculate/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const score = await calculateProductScore(parseInt(id));
    res.json(score);
  } catch (error: any) {
    console.error('점수 계산 오류:', error);
    res.status(500).json({ error: error.message || '점수 계산 중 오류가 발생했습니다.' });
  }
});

// 상품 점수 조회
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const score = await getProductScore(parseInt(id));
    
    if (!score) {
      // 점수가 없으면 계산
      const newScore = await calculateProductScore(parseInt(id));
      res.json(newScore);
    } else {
      res.json(score);
    }
  } catch (error: any) {
    console.error('점수 조회 오류:', error);
    res.status(500).json({ error: error.message || '점수 조회 중 오류가 발생했습니다.' });
  }
});

// 랭킹 조회
router.get('/ranking/list', async (req: AuthRequest, res: Response) => {
  try {
    const { companyType, limit } = req.query;
    
    // companyType 필터 처리 (빈 문자열이나 undefined는 필터링하지 않음)
    const filterCompanyType = companyType && companyType !== '' && companyType !== 'undefined' 
      ? companyType as string 
      : undefined;
    
    console.log(`랭킹 조회 요청: companyType=${filterCompanyType || '전체'}, limit=${limit}`);
    
    let sql = `
      SELECT 
        cd.*,
        ic.name as company_name,
        ic.type as company_type,
        ps.total_score,
        ps.coverage_score,
        ps.premium_score,
        ps.special_condition_score
      FROM coverage_details cd
      JOIN insurance_companies ic ON cd.company_id = ic.id
      LEFT JOIN (
        SELECT 
          ps1.coverage_id,
          ps1.coverage_score,
          ps1.premium_score,
          ps1.special_condition_score,
          ps1.total_score
        FROM product_scores ps1
        INNER JOIN (
          SELECT coverage_id, MAX(calculated_at) as max_calculated_at
          FROM product_scores
          GROUP BY coverage_id
        ) ps2 ON ps1.coverage_id = ps2.coverage_id 
              AND ps1.calculated_at = ps2.max_calculated_at
      ) ps ON cd.id = ps.coverage_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filterCompanyType) {
      sql += ` AND ic.type = ?`;
      params.push(filterCompanyType);
      console.log(`필터 적용: 보험사 유형 = ${filterCompanyType}`);
    }

    db.all(sql, params, async (err, rows: any) => {
      if (err) {
        console.error('랭킹 조회 SQL 오류:', err);
        res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
        return;
      }

      console.log(`랭킹 조회: 총 ${rows.length}개 상품 조회됨`);

      // 점수가 없는 상품에 대해 scoreCalculator.ts의 공식으로 점수 계산
      const productsWithScores = await Promise.all(
        rows.map(async (p: any) => {
          if (p.total_score === null || p.total_score === undefined) {
            try {
              // scoreCalculator.ts의 calculateProductScore 함수 사용
              const calculatedScore = await calculateProductScore(p.id);
              return {
                ...p,
                total_score: calculatedScore.totalScore,
                coverage_score: calculatedScore.coverageScore,
                premium_score: calculatedScore.premiumScore,
                special_condition_score: calculatedScore.specialConditionScore
              };
            } catch (scoreError) {
              console.error(`점수 계산 오류 (상품 ${p.id}):`, scoreError);
              return p; // 계산 실패 시 원본 반환
            }
          }
          return p;
        })
      );

      // 점수 기준으로 정렬 (scoreCalculator.ts의 공식으로 계산된 점수 사용)
      // 점수가 있는 상품과 없는 상품을 분리
      const productsWithScore = productsWithScores.filter(
        (p: any) => p.total_score !== null && p.total_score !== undefined
      );
      const productsWithoutScore = productsWithScores.filter(
        (p: any) => p.total_score === null || p.total_score === undefined
      );

      // 점수가 있는 상품들을 점수 기준으로 정렬
      const sortedProductsWithScore = productsWithScore.sort((a: any, b: any) => {
        // 점수 기준 내림차순 정렬
        const scoreDiff = b.total_score - a.total_score;
        if (Math.abs(scoreDiff) > 0.01) { // 소수점 오차 고려
          return scoreDiff;
        }
        // 점수가 같으면 최신 업데이트 순
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      // 점수가 없는 상품들을 최신 업데이트 순으로 정렬
      const sortedProductsWithoutScore = productsWithoutScore.sort((a: any, b: any) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      // 점수가 있는 상품을 먼저, 그 다음 점수가 없는 상품을 배치
      const sortedProducts = [...sortedProductsWithScore, ...sortedProductsWithoutScore];
      
      // 중복 제거: 같은 ID를 가진 상품 중 첫 번째만 유지
      const uniqueProductsMap = new Map<number, any>();
      sortedProducts.forEach((product: any) => {
        if (!uniqueProductsMap.has(product.id)) {
          uniqueProductsMap.set(product.id, product);
        }
      });
      const uniqueProducts = Array.from(uniqueProductsMap.values());
      
      console.log(`랭킹 정렬 완료: 총 ${sortedProducts.length}개 상품 (중복 제거 후: ${uniqueProducts.length}개, 점수 있음: ${sortedProductsWithScore.length}개, 점수 없음: ${sortedProductsWithoutScore.length}개)`);
      if (sortedProductsWithScore.length > 0) {
        console.log(`상위 5개 상품 점수 - ${sortedProductsWithScore.slice(0, 5).map((p: any) => `${p.title}: ${p.total_score?.toFixed(1)}점`).join(', ')}`);
      }

      // limit 적용
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const finalProducts = limitNum ? uniqueProducts.slice(0, limitNum) : uniqueProducts;

      res.json({
        products: finalProducts,
        count: uniqueProducts.length, // 전체 개수 (중복 제거 후, limit 적용 전)
        displayedCount: finalProducts.length // 실제 반환된 개수 (limit 적용 후)
      });
    });
  } catch (error) {
    console.error('랭킹 조회 오류:', error);
    res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
  }
});

// 중복 데이터 삭제
router.post('/ranking/remove-duplicates', async (req: AuthRequest, res: Response) => {
  try {
    console.log('중복 데이터 삭제 시작...');
    
    // 중복 찾기: 같은 company_id와 title을 가진 상품들
    const duplicates = await new Promise<any[]>((resolve, reject) => {
      db.all(`
        SELECT 
          company_id, 
          title, 
          COUNT(*) as count,
          GROUP_CONCAT(id) as ids
        FROM coverage_details
        GROUP BY company_id, title
        HAVING COUNT(*) > 1
      `, [], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    console.log(`중복 그룹 ${duplicates.length}개 발견`);

    let deletedCount = 0;
    const deletedIds: number[] = [];

    for (const duplicate of duplicates) {
      const ids = duplicate.ids.split(',').map((id: string) => parseInt(id));
      
      // 각 그룹에서 최신 상품만 남기고 나머지 삭제
      const keepId = await new Promise<number>((resolve, reject) => {
        db.get(`
          SELECT id 
          FROM coverage_details 
          WHERE company_id = ? AND title = ?
          ORDER BY updated_at DESC, id DESC
          LIMIT 1
        `, [duplicate.company_id, duplicate.title], (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.id);
          }
        });
      });

      // 나머지 ID들 삭제
      const idsToDelete = ids.filter((id: number) => id !== keepId);
      
      for (const idToDelete of idsToDelete) {
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM coverage_details WHERE id = ?', [idToDelete], (err) => {
            if (err) {
              console.error(`상품 ${idToDelete} 삭제 오류:`, err);
              reject(err);
            } else {
              deletedIds.push(idToDelete);
              deletedCount++;
              resolve();
            }
          });
        });
      }
    }

    console.log(`중복 데이터 삭제 완료: ${deletedCount}개 상품 삭제됨`);

    res.json({
      success: true,
      deletedCount,
      deletedIds,
      duplicateGroups: duplicates.length
    });
  } catch (error: any) {
    console.error('중복 데이터 삭제 오류:', error);
    res.status(500).json({ error: error.message || '중복 데이터 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;

