import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const styles = {
  form: {
    display: 'flex',
    gap: '1rem',
    background: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.3s'
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#667eea'
  },
  button: {
    padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.3s'
  },
  buttonHover: {
    opacity: 0.9
  }
};

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        placeholder="키워드를 입력하세요 (예: 암 보장, 교통사고, 골절, 입원...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
        onFocus={(e) => {
          Object.assign(e.target.style, styles.inputFocus);
        }}
        onBlur={(e) => {
          e.target.style.outline = '';
          e.target.style.borderColor = '#ddd';
        }}
      />
      <button
        type="submit"
        style={styles.button}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        검색
      </button>
    </form>
  );
}

export default SearchBar;
