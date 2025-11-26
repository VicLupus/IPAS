import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  box: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
    color: '#333',
    fontSize: '1.8rem',
    fontWeight: 700,
    margin: '0 0 1rem 0',
    letterSpacing: '-0.02em'
  },
  titleSubtitle: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    color: '#666',
    fontSize: '0.9rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    fontStyle: 'italic' as const,
    opacity: 0.8
  },
  ipasBadge: {
    display: 'inline-block',
    marginLeft: '0.75rem',
    padding: '0.25rem 0.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.1em'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box' as const
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#667eea'
  },
  errorMessage: {
    color: '#e74c3c',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: '#fee',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  loginButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.3s'
  },
  loginButtonHover: {
    opacity: 0.9
  },
  loginButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  loginInfo: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #eee',
    textAlign: 'center' as const,
    fontSize: '0.85rem',
    color: '#666'
  },
  loginInfoText: {
    margin: '0.25rem 0'
  }
};

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('로그인 시도:', username);
      const response = await authApi.login({ username, password });
      console.log('로그인 성공:', response);
      login(response.token, response.user);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err: any) {
      console.error('로그인 오류:', err);
      const errorMessage = err.response?.data?.error 
        || err.message 
        || (err.code === 'ECONNREFUSED' ? '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.' : '로그인에 실패했습니다.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>
          보험 상품 비교 분석 시스템
          <span style={styles.ipasBadge}>IPAS</span>
        </h1>
        <div style={styles.titleSubtitle}>
          Insurance Product Analysis System
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>사용자명</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={styles.input}
              onFocus={(e) => {
                Object.assign(e.target.style, styles.inputFocus);
              }}
              onBlur={(e) => {
                e.target.style.outline = '';
                e.target.style.borderColor = '#ddd';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                Object.assign(e.target.style, styles.inputFocus);
              }}
              onBlur={(e) => {
                e.target.style.outline = '';
                e.target.style.borderColor = '#ddd';
              }}
            />
          </div>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              ...(loading ? styles.loginButtonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
