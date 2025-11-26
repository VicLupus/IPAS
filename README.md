# 보험 상품 비교 분석 시스템

10개 이상의 보험사 매달 보험 보장내역 업데이트와 새로운 상품이 나왔을 시 핵심 키워드별로 정리되어 리스트업할 수 있는 웹사이트입니다.

## 주요 기능

- **로그인 시스템**: 지정된 5개 계정만 사용 가능 (회원가입 불필요)
- **PDF 파싱**: 보험사 PDF 파일에서 보장내역 자동 추출
- **검색 기능**: 키워드 검색 시 관련 제목부터 상위 노출
- **필터 기능**: 보험사 유형(생명보험/손해보험), 카테고리, 키워드별 필터링
- **키워드 관리**: 교통사고, 골절, 입원, 보장내용 등 키워드별 정리

## 기술 스택

### Backend

- Node.js + Express + TypeScript
- SQLite (데이터베이스)
- JWT (인증)
- pdf-parse (PDF 파싱)

### Frontend

- React + TypeScript
- Vite
- React Query
- React Router

## 설치 및 실행

### Backend 설정

```bash
cd backend
npm install
npm run dev
```

백엔드 서버는 `http://localhost:3001`에서 실행됩니다.

### Frontend 설정

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 초기 데이터 설정

기존 PDF 파일들을 파싱하여 데이터베이스에 저장하려면:

```bash
cd backend
npm run parse-pdfs
```

## 로그인 정보

기본 계정 5개:

- 사용자명: `admin1`, `admin2`, `admin3`, `admin4`, `admin5`
- 비밀번호: `admin123!`

## API 엔드포인트

### 인증

- `POST /api/auth/login` - 로그인

### 보장내역

- `GET /api/coverage/search` - 검색 (쿼리 파라미터: q, companyType, category, keywords)
- `GET /api/coverage` - 전체 조회
- `GET /api/coverage/categories` - 카테고리 목록
- `GET /api/coverage/keywords` - 키워드 목록

### 보험사

- `GET /api/companies` - 보험사 목록

### 업로드

- `POST /api/upload/pdf` - PDF 파일 업로드 및 파싱

## 프로젝트 구조

```
BaoAD/
├── backend/
│   ├── src/
│   │   ├── database/     # 데이터베이스 설정
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   ├── middleware/    # 미들웨어
│   │   ├── utils/         # 유틸리티 함수
│   │   └── scripts/       # 스크립트
│   ├── 생명보험/          # 생명보험 PDF 파일들
│   └── 손해보험/          # 손해보험 PDF 파일들
└── frontend/
    └── src/
        ├── pages/         # 페이지 컴포넌트
        ├── components/    # 재사용 컴포넌트
        ├── api/           # API 클라이언트
        └── hooks/         # 커스텀 훅
```

## 사용 방법

1. 로그인 페이지에서 지정된 계정으로 로그인
2. 검색창에 키워드 입력 (예: "암 보장", "교통사고", "골절", "입원")
3. 필터 패널에서 보험사 유형, 카테고리, 키워드로 필터링
4. 검색 결과에서 관련 보장내역 확인

## 주의사항

- PDF 파일은 `backend/uploads/` 디렉토리에 저장됩니다
- 데이터베이스 파일(`insurance.db`)은 `backend/` 디렉토리에 생성됩니다
- 환경 변수 설정이 필요한 경우 `backend/.env` 파일을 생성하세요
