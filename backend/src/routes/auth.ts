import express, { Request, Response } from 'express';
import { UserModel } from '../models/User';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('로그인 요청 받음:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('사용자명 또는 비밀번호 누락');
      return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    console.log('사용자 조회 중:', username);
    const user = await UserModel.findByUsername(username);

    if (!user) {
      console.log('사용자를 찾을 수 없음:', username);
      return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
    }

    console.log('비밀번호 확인 중');
    const isValidPassword = await UserModel.verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.log('비밀번호 불일치');
      return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
    }

    console.log('로그인 성공:', username);

    const secret = process.env.JWT_SECRET || 'your-secret-key-here';
    const token = jwt.sign(
      { id: user.id, username: user.username },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;

