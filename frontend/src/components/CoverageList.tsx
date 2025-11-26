import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CoverageDetail, coverageApi } from '../api/coverage';
import CoverageDetailModal from './CoverageDetailModal';

interface CoverageListProps {
  items: CoverageDetail[];
  searchQuery: string;
  selectedProducts?: number[];
  onProductSelect?: (productId: number) => void;
  totalCount?: number;
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  listHeader: {
    marginBottom: '1rem'
  },
  listHeaderTitle: {
    fontSize: '1.3rem',
    color: '#333',
    margin: 0
  },
  listItems: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  item: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    transition: 'box-shadow 0.3s, transform 0.2s',
    background: 'white',
    position: 'relative' as const,
    display: 'flex',
    gap: '1rem'
  },
  itemSelected: {
    borderColor: '#667eea',
    background: '#f8f9ff'
  },
  itemHover: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)'
  },
  checkbox: {
    flexShrink: 0,
    paddingTop: '0.25rem'
  },
  checkboxInput: {
    width: '1.25rem',
    height: '1.25rem',
    cursor: 'pointer'
  },
  contentWrapper: {
    flex: 1
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    gap: '1rem'
  },
  itemTitle: {
    fontSize: '1.1rem',
    color: '#333',
    fontWeight: 600,
    flex: 1,
    margin: 0
  },
  itemBadges: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const
  },
  badgeLife: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2'
  },
  badgeNonlife: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2'
  },
  badgeCategory: {
    backgroundColor: '#fff3e0',
    color: '#e65100'
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    fontSize: '0.85rem',
    color: '#666'
  },
  companyName: {
    fontWeight: 500,
    color: '#555'
  },
  updatedDate: {
    color: '#999'
  },
  itemKeywords: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  keywordTag: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#666'
  },
  itemContent: {
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '0.75rem',
    fontSize: '0.9rem'
  },
  itemFooter: {
    paddingTop: '0.75rem',
    borderTop: '1px solid #f0f0f0',
    fontSize: '0.8rem',
    color: '#999'
  },
  pdfFilename: {
    fontFamily: 'monospace',
    color: '#667eea',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  pdfFilenameHover: {
    color: '#764ba2',
    textDecoration: 'underline'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#999'
  },
  emptyStateText: {
    fontSize: '1.1rem'
  },
  mark: {
    backgroundColor: '#fff3cd',
    padding: '0 2px',
    borderRadius: '2px'
  }
};

function CoverageList({ items, searchQuery, selectedProducts = [], onProductSelect, totalCount }: CoverageListProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const { data: detailData } = useQuery({
    queryKey: ['coverage-detail', selectedItemId],
    queryFn: () => coverageApi.getById(selectedItemId!),
    enabled: selectedItemId !== null
  });

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={styles.mark}>{part}</mark>
      ) : (
        part
      )
    );
  };

  const handleItemClick = (itemId: number, e: React.MouseEvent) => {
    // 체크박스나 PDF 링크 클릭 시에는 모달을 열지 않음
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'A' || target.closest('a')) {
      return;
    }
    setSelectedItemId(itemId);
  };

  const handleCloseModal = () => {
    setSelectedItemId(null);
  };

  if (items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyStateText}>검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.list}>
        <div style={styles.listHeader}>
          <h2 style={styles.listHeaderTitle}>
            검색 결과 {totalCount !== undefined ? `(${totalCount}개)` : `(${items.length}개)`}
          </h2>
        </div>
        <div style={styles.listItems}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.item,
                ...(selectedProducts.includes(item.id) ? styles.itemSelected : {}),
                cursor: 'pointer'
              }}
              onClick={(e) => handleItemClick(item.id, e)}
              onMouseEnter={(e) => {
                if (!selectedProducts.includes(item.id)) {
                  Object.assign(e.currentTarget.style, styles.itemHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedProducts.includes(item.id)) {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.transform = '';
                }
              }}
            >
            {onProductSelect && (
              <div style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(item.id)}
                  onChange={() => onProductSelect(item.id)}
                  style={styles.checkboxInput}
                />
              </div>
            )}
            <div style={styles.contentWrapper}>
              <div style={styles.itemHeader}>
                <h3 style={styles.itemTitle}>
                  {highlightText(item.title, searchQuery)}
                </h3>
                <div style={styles.itemBadges}>
                  <span style={{
                    ...styles.badge,
                    ...(item.company_type === '생명보험' ? styles.badgeLife : styles.badgeNonlife)
                  }}>
                    {item.company_type}
                  </span>
                  {item.category && (
                    <span style={{ ...styles.badge, ...styles.badgeCategory }}>
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.itemMeta}>
                <span style={styles.companyName}>{item.company_name}</span>
                <span style={styles.updatedDate}>
                  {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {item.keywords && (
                <div style={styles.itemKeywords}>
                  {item.keywords.split(',').map((keyword, i) => (
                    <span key={i} style={styles.keywordTag}>
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.itemContent}>
                {highlightText(item.content.substring(0, 200), searchQuery)}
                {item.content.length > 200 && '...'}
              </div>
              <div style={styles.itemFooter}>
                <a
                  href={`/api/coverage/download/${item.id}`}
                  style={styles.pdfFilename}
                  download={item.pdf_filename}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, styles.pdfFilenameHover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = styles.pdfFilename.color;
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`/api/coverage/download/${item.id}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = item.pdf_filename;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error('다운로드 오류:', error);
                      alert('다운로드 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  {item.pdf_filename}
                </a>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
      {selectedItemId && detailData && (
        <CoverageDetailModal
          item={detailData}
          searchQuery={searchQuery}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

export default CoverageList;
