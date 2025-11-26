import axios from 'axios';

// 배포 환경에서는 VITE_API_BASE_URL 환경변수로 백엔드 주소를 지정
// 예: https://my-backend.example.com/api
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // 로컬 개발 시에는 Vite dev 서버의 프록시(/api -> http://localhost:3001)를 사용

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터: 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 오류 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 오류:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 로그인 페이지에서는 리다이렉트하지 않음
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

