import express, { Response } from 'express';
import { InsuranceCompanyModel } from '../models/InsuranceCompany';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 모든 보험사 조회
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;

    let companies;
    if (type) {
      companies = await InsuranceCompanyModel.findByType(type as '생명보험' | '손해보험');
    } else {
      companies = await InsuranceCompanyModel.findAll();
    }

    res.json({ companies });
  } catch (error) {
    console.error('보험사 조회 오류:', error);
    res.status(500).json({ error: '보험사 조회 중 오류가 발생했습니다.' });
  }
});

export default router;

