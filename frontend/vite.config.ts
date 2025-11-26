import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages: https://VicLupus.github.io/IPAS 로 배포할 것이므로
  // 리포지토리 이름인 /IPAS/ 를 base 경로로 설정
  base: '/IPAS/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});

