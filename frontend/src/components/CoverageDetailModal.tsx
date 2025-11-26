import { useEffect } from 'react';
import { CoverageDetail } from '../api/coverage';

interface CoverageDetailModalProps {
  item: CoverageDetail | null;
  searchQuery: string;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  headerContent: {
    flex: 1
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    marginBottom: '0.5rem'
  },
  headerBadges: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const
  },
  badgeLife: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white'
  },
  badgeNonlife: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white'
  },
  badgeCategory: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    borderRadius: '6px',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 600,
    transition: 'background 0.2s'
  },
  body: {
    padding: '2rem',
    overflowY: 'auto' as const,
    flex: 1
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #667eea'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: '#666'
  },
  companyName: {
    fontWeight: 500,
    color: '#555'
  },
  updatedDate: {
    color: '#999'
  },
  keywords: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '1.5rem'
  },
  keywordTag: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#666'
  },
  content: {
    color: '#555',
    lineHeight: 1.8,
    fontSize: '0.95rem',
    whiteSpace: 'pre-wrap' as const
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  infoItem: {
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  infoLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.5rem',
    fontWeight: 500
  },
  infoValue: {
    fontSize: '1rem',
    color: '#333',
    fontWeight: 600
  },
  planSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  planChip: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: '#f8f9ff',
    border: '1px solid #e0e7ff',
    fontSize: '0.9rem',
    color: '#374151'
  },
  planChipLabel: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
    fontWeight: 500
  },
  planChipValue: {
    fontWeight: 600,
    color: '#111827'
  },
  planNote: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginTop: '0.35rem',
    lineHeight: 1.4
  },
  coverageTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '1.5rem'
  },
  coverageTableHeader: {
    background: '#f8f9fa',
    padding: '0.75rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#333',
    borderBottom: '2px solid #e0e0e0'
  },
  coverageTableCell: {
    padding: '0.75rem',
    borderBottom: '1px solid #f0f0f0',
    color: '#555'
  },
  conditionList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: 0
  },
  conditionItem: {
    padding: '0.75rem',
    marginBottom: '0.5rem',
    background: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '3px solid #667eea'
  },
  conditionName: {
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.25rem'
  },
  conditionDetail: {
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: 1.6
  },
  footer: {
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pdfLink: {
    fontFamily: 'monospace',
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  mark: {
    backgroundColor: '#fff3cd',
    padding: '0 2px',
    borderRadius: '2px'
  }
};

function CoverageDetailModal({ item, searchQuery, onClose }: CoverageDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

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

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/coverage/download/${item.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '다운로드 실패' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // blob이 비어있거나 JSON 오류 메시지인지 확인
      if (blob.type === 'application/json') {
        const errorData = await blob.text().then(text => JSON.parse(text));
        throw new Error(errorData.error || '다운로드 실패');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.pdf_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('다운로드 오류:', error);
      alert(`다운로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const structured = item.structuredData || (item as any).structured_data || null;

  const getWaiverText = () => {
    if (!structured) return '없음 / 정보 없음';
    if (structured.hasWaiver === true) {
      if (structured.waiverDescription) {
        return `있음 - ${structured.waiverDescription}`;
      }
      return '있음';
    }
    if (structured.waiverDescription) {
      return `조건부 - ${structured.waiverDescription}`;
    }
    return '없음 / 정보 없음';
  };

  const getRenewalText = () => {
    if (!structured || !structured.renewalType) return '정보 없음';
    return structured.renewalType as string;
  };

  const getPaymentPeriodText = () => {
    if (!structured || !structured.paymentPeriod) return '정보 없음';
    return structured.paymentPeriod as string;
  };

  const getCoveragePeriodText = () => {
    if (item.coverage_period) return item.coverage_period;
    if (structured && structured.coveragePeriod) return structured.coveragePeriod as string;
    return '정보 없음';
  };

  const getMainContractText = () => {
    if (!structured || !structured.mainContractType) return '정보 없음';
    return structured.mainContractType as string;
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h2 style={styles.title}>{highlightText(item.title, searchQuery)}</h2>
            <div style={styles.headerBadges}>
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
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.section}>
            <div style={styles.meta}>
              <span style={styles.companyName}>{item.company_name}</span>
              <span style={styles.updatedDate}>
                {new Date(item.updated_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {item.keywords && (
              <div style={styles.keywords}>
                {item.keywords.split(',').map((keyword, i) => (
                  <span key={i} style={styles.keywordTag}>
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(item.premium_amount ||
            item.coverage_period ||
            structured) && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>설계 요약</h3>
              <div style={styles.planSummary}>
                <div style={styles.planChip}>
                  <span style={styles.planChipLabel}>상품 형태 (갱신형 여부)</span>
                  <span style={styles.planChipValue}>{getRenewalText()}</span>
                  <div style={styles.planNote}>
                    예: 갱신형 / 비갱신형 / 준갱신형 등
                  </div>
                </div>
                <div style={styles.planChip}>
                  <span style={styles.planChipLabel}>납입기간 / 보장기간</span>
                  <span style={styles.planChipValue}>
                    {getPaymentPeriodText()} / {getCoveragePeriodText()}
                  </span>
                  <div style={styles.planNote}>
                    고객에게 "몇 년/몇 세까지 납입, 몇 세까지 보장"인지 설명할 때 사용
                  </div>
                </div>
                <div style={styles.planChip}>
                  <span style={styles.planChipLabel}>납입면제</span>
                  <span style={styles.planChipValue}>{getWaiverText()}</span>
                  <div style={styles.planNote}>
                    암·질병·장해 등 특정 상황에서 보험료 납입이 면제되는지 확인
                  </div>
                </div>
                <div style={styles.planChip}>
                  <span style={styles.planChipLabel}>구조 (주계약 / 특약)</span>
                  <span style={styles.planChipValue}>{getMainContractText()}</span>
                  <div style={styles.planNote}>
                    주계약·특약 구성 및 어떤 부분이 핵심 보장인지 파악
                  </div>
                </div>
              </div>

              <h3 style={styles.sectionTitle}>기본 금액 정보</h3>
              <div style={styles.infoGrid}>
                {item.premium_amount && (
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>대표 월 보험료</div>
                    <div style={styles.infoValue}>{formatAmount(item.premium_amount)}</div>
                  </div>
                )}
                {structured && structured.premiumAmount && !item.premium_amount && (
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>대표 월 보험료</div>
                    <div style={styles.infoValue}>{formatAmount(structured.premiumAmount)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.coverageAmounts && item.coverageAmounts.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>보장 금액</h3>
              <table style={styles.coverageTable}>
                <thead>
                  <tr>
                    <th style={styles.coverageTableHeader}>보장 항목</th>
                    <th style={styles.coverageTableHeader}>보장 금액</th>
                    <th style={styles.coverageTableHeader}>조건</th>
                  </tr>
                </thead>
                <tbody>
                  {item.coverageAmounts.map((ca, idx) => (
                    <tr key={idx}>
                      <td style={styles.coverageTableCell}>{ca.category}</td>
                      <td style={styles.coverageTableCell}>{formatAmount(ca.amount)}</td>
                      <td style={styles.coverageTableCell}>{ca.condition_text || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {item.specialConditions && item.specialConditions.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>특약 사항</h3>
              <ul style={styles.conditionList}>
                {item.specialConditions.map((sc, idx) => (
                  <li key={idx} style={styles.conditionItem}>
                    <div style={styles.conditionName}>{sc.condition_name}</div>
                    {sc.condition_detail && (
                      <div style={styles.conditionDetail}>{sc.condition_detail}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>상세 내용</h3>
            <div style={styles.content}>
              {highlightText(item.content, searchQuery)}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <a
            href="#"
            style={styles.pdfLink}
            onClick={handleDownload}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#764ba2';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#667eea';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            📄 {item.pdf_filename}
          </a>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'opacity 0.2s'
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CoverageDetailModal;

