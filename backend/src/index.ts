import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { database } from './database/db';

// 라우터
import authRoutes from './routes/auth';
import coverageRoutes from './routes/coverage';
import companiesRoutes from './routes/companies';
import uploadRoutes from './routes/upload';
import updateRoutes from './routes/update';
import compareRoutes from './routes/compare';
import scoresRoutes from './routes/scores';
import chatRoutes from './routes/chat';

dotenv.config();
// OPENAI_API_KEY 디버그용 로그
console.log(
  '[ENV CHECK] OPENAI_API_KEY 존재 여부:',
  !!process.env.OPENAI_API_KEY,
  '/ prefix:',
  (process.env.OPENAI_API_KEY || '').slice(0, 8)
);
const app = express();
const PORT = process.env.PORT || 3001;

// 데이터베이스 초기화 대기 후 서버 시작
async function startServer() {
  try {
    await database.waitForInit();
    
    // 미들웨어
    app.use(cors());
    // 기본 JSON/URL-encoded 파서 사용 (Express 기본값이 UTF-8)
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 모든 JSON 응답에 UTF-8 charset 헤더 추가
    app.use((req, res, next) => {
      res.charset = 'utf-8';
      if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      next();
    });

    // 라우트
    app.use('/api/auth', authRoutes);
    app.use('/api/coverage', coverageRoutes);
    app.use('/api/companies', companiesRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/update', updateRoutes);
    app.use('/api/compare', compareRoutes);
    app.use('/api/scores', scoresRoutes);
    app.use('/api/chat', chatRoutes);

    // 건강 체크
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
}

startServer();

// 프로세스 종료 시 데이터베이스 연결 종료
process.on('SIGINT', () => {
  database.close();
  process.exit(0);
});

