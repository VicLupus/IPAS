import { useState } from 'react';
import { CompareProduct } from '../api/compare';

interface CompareViewProps {
  products: CompareProduct[];
  onRemoveProduct?: (productId: number) => void;
}

const styles = {
  view: {
    background: 'transparent',
    borderRadius: '12px',
    padding: '0',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  productCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '2px solid #f0f0f0',
    transition: 'all 0.3s',
    position: 'relative' as const,
  },
  productCardHighlight: {
    border: '2px solid #667eea',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f0f0f0',
  },
  productHeaderLeft: {
    flex: 1,
  },
  productName: {
    fontWeight: 700,
    color: '#333',
    fontSize: '1.1rem',
    marginBottom: '0.25rem',
  },
  productTitle: {
    fontSize: '0.85rem',
    color: '#666',
    lineHeight: 1.4,
    marginTop: '0.5rem',
  },
  productBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: '0.5rem',
  },
  productBadgeLife: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  productBadgeNonlife: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'all 0.2s',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  highlightBadge: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: '#4caf50',
    color: 'white',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  summarySection: {
    marginBottom: '1.5rem',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f5f5f5',
  },
  summaryItemLast: {
    borderBottom: 'none',
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: '1rem',
    color: '#333',
    fontWeight: 600,
  },
  summaryValueBest: {
    color: '#4caf50',
  },
  summaryValueBestPremium: {
    color: '#2196f3',
  },
  scoreRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '0.15rem',
  },
  scoreLabelRow: {
    fontSize: '0.78rem',
    color: '#777',
  },
  scoreDetailRow: {
    fontSize: '0.78rem',
    color: '#555',
  },
  scoreTotalHighlight: {
    fontSize: '1.05rem',
    color: '#667eea',
    fontWeight: 700,
  },
  expandSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f0f0f0',
  },
  expandButton: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0.5rem 0',
    fontWeight: 500,
    width: '100%',
    textAlign: 'left' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  coverageList: {
    listStyle: 'none',
    padding: 0,
    margin: '0.5rem 0 0 0',
  },
  coverageItem: {
    padding: '0.5rem 0',
    fontSize: '0.85rem',
    color: '#555',
    lineHeight: 1.5,
    display: 'flex',
    justifyContent: 'space-between',
  },
  coverageCategory: {
    color: '#666',
  },
  coverageAmount: {
    fontWeight: 600,
    color: '#333',
  },
  coverageAmountBest: {
    color: '#4caf50',
  },
  conditionsList: {
    listStyle: 'none',
    padding: 0,
    margin: '0.5rem 0 0 0',
  },
  conditionItem: {
    padding: '0.4rem 0',
    fontSize: '0.85rem',
    color: '#555',
    lineHeight: 1.5,
    paddingLeft: '1rem',
    position: 'relative' as const,
  },
  conditionItemBullet: {
    position: 'absolute' as const,
    left: 0,
    color: '#667eea',
  },
  footer: {
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: '#6b7280',
    gap: '0.5rem',
  },
  pdfLink: {
    fontFamily: 'monospace',
    color: '#667eea',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#999',
    background: 'white',
    borderRadius: '8px',
  },
};

function CompareView({ products, onRemoveProduct }: CompareViewProps) {
  const [expandedProducts, setExpandedProducts] = useState<{ [key: number]: boolean }>({});

  if (products.length === 0) {
    return <div style={styles.empty}>비교할 상품을 선택해주세요.</div>;
  }

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  // 최고값 찾기
  const findBestPremium = () => {
    const validPremiums = products
      .map(p => p.premium_amount)
      .filter((p): p is number => p !== null && p !== undefined && p > 0);
    if (validPremiums.length === 0) return null;
    return Math.min(...validPremiums);
  };

  const findBestTotalScore = () => {
    const scores = products
      .map((p) => p.total_score)
      .filter(
        (s): s is number => s !== null && s !== undefined && !isNaN(s)
      );
    if (scores.length === 0) return null;
    return Math.max(...scores);
  };

  const findBestCoverage = (category: string) => {
    const amounts = products.map(product => {
      const coverage = product.coverageAmounts?.find(ca => ca && ca.category === category);
      return coverage?.amount || 0;
    }).filter(amount => amount > 0);
    if (amounts.length === 0) return null;
    return Math.max(...amounts);
  };

  const bestPremium = findBestPremium();
  const bestTotalScore = findBestTotalScore();

  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined || isNaN(score)) return "N/A";
    return score.toFixed(1);
  };

  const toggleExpand = (productId: number) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // 주요 카테고리만 추출 (상위 5개)
  const getMainCategories = (product: CompareProduct) => {
    if (!product.coverageAmounts || !Array.isArray(product.coverageAmounts)) return [];
    return product.coverageAmounts
      .filter(ca => ca && ca.amount > 0)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5);
  };

  const handleDownload = async (product: CompareProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/coverage/download/${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '다운로드 실패' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.type === 'application/json') {
        const errorData = await blob.text().then((text) => JSON.parse(text));
        throw new Error(errorData.error || '다운로드 실패');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = product.pdf_filename || `product-${product.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('다운로드 오류:', error);
      alert(`다운로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  return (
    <div style={styles.view}>
      <div style={styles.productsGrid}>
        {products.map((product) => {
          const isBestPremium =
            bestPremium !== null && product.premium_amount === bestPremium;
          const isBestTotalScore =
            bestTotalScore !== null &&
            product.total_score !== null &&
            product.total_score !== undefined &&
            product.total_score === bestTotalScore;
          const isExpanded = expandedProducts[product.id];
          const mainCategories = getMainCategories(product);
          const allCategories = product.coverageAmounts?.filter(ca => ca && ca.amount > 0) || [];
          const conditions = product.specialConditions && Array.isArray(product.specialConditions) 
            ? product.specialConditions 
            : [];

          return (
            <div
              key={product.id}
              style={{
                ...styles.productCard,
                ...((isBestTotalScore || isBestPremium)
                  ? styles.productCardHighlight
                  : {})
              }}
            >
              {isBestTotalScore && (
                <span style={styles.highlightBadge}>종합 1위</span>
              )}
              
              <div style={styles.productHeader}>
                <div style={styles.productHeaderLeft}>
                  <div style={styles.productName}>{product.company_name}</div>
                  <div style={styles.productTitle}>{product.title}</div>
                  <div style={{
                    ...styles.productBadge,
                    ...(product.company_type === '생명보험' ? styles.productBadgeLife : styles.productBadgeNonlife)
                  }}>
                    {product.company_type}
                  </div>
                  {product.category && (
                    <div
                      style={{
                        ...styles.productBadge,
                        marginTop: '0.25rem',
                        backgroundColor: '#fff3e0',
                        color: '#e65100',
                      }}
                    >
                      {product.category}
                    </div>
                  )}
                </div>
                {onRemoveProduct && products.length > 2 && (
                  <button
                    style={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProduct(product.id);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee';
                      e.currentTarget.style.color = '#d32f2f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#999';
                    }}
                    title="제거"
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={styles.summarySection}>
                {/* 설계사용 핵심 설계 정보 */}
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>상품 형태</span>
                  <span style={styles.summaryValue}>
                    {product.structuredData?.renewalType || "정보 없음"}
                  </span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>납입 / 보장기간</span>
                  <span style={styles.summaryValue}>
                    {product.structuredData?.paymentPeriod || "납입기간 정보 없음"}
                    {" / "}
                    {product.coverage_period ||
                      product.structuredData?.coveragePeriod ||
                      "보장기간 정보 없음"}
                  </span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>납입면제</span>
                  <span style={styles.summaryValue}>
                    {product.structuredData?.hasWaiver
                      ? "있음"
                      : product.structuredData?.waiverDescription
                      ? "조건부"
                      : "없음/정보 없음"}
                  </span>
                </div>

                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>종합점수</span>
                  <span
                    style={{
                      ...styles.summaryValue,
                      ...(isBestTotalScore ? styles.scoreTotalHighlight : {}),
                    }}
                  >
                    {formatScore(product.total_score)}
                  </span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>세부점수</span>
                  <div style={styles.scoreRow}>
                    <div style={styles.scoreLabelRow}>
                      보장 / 보험료 / 특약
                    </div>
                    <div style={styles.scoreDetailRow}>
                      {formatScore(product.coverage_score)} /{' '}
                      {formatScore(product.premium_score)} /{' '}
                      {formatScore(product.special_condition_score)}
                    </div>
                  </div>
                </div>
                <div style={{ ...styles.summaryItem, ...styles.summaryItemLast }}>
                  <span style={styles.summaryLabel}>보험료</span>
                  <span style={{
                    ...styles.summaryValue,
                    ...(isBestPremium ? styles.summaryValueBestPremium : {})
                  }}>
                    {product.premium_amount ? formatAmount(product.premium_amount) : '정보 없음'}
                  </span>
                </div>
                {product.coverage_period && (
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>보장기간</span>
                    <span style={styles.summaryValue}>{product.coverage_period}</span>
                  </div>
                )}
                {mainCategories.length > 0 && (
                  <div style={{ ...styles.summaryItem, ...styles.summaryItemLast }}>
                    <span style={styles.summaryLabel}>주요 보장</span>
                    <span style={styles.summaryValue}>{mainCategories.length}개 항목</span>
                  </div>
                )}
              </div>

              {mainCategories.length > 0 && (
                <div style={styles.expandSection}>
                  <ul style={styles.coverageList}>
                    {mainCategories.map((coverage, idx) => {
                      const bestAmount = findBestCoverage(coverage.category);
                      const isBest = bestAmount !== null && coverage.amount === bestAmount;
                      return (
                        <li key={idx} style={styles.coverageItem}>
                          <span style={styles.coverageCategory}>{coverage.category}</span>
                          <span style={{
                            ...styles.coverageAmount,
                            ...(isBest ? styles.coverageAmountBest : {})
                          }}>
                            {formatAmount(coverage.amount)}
                            {isBest && ' ✓'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {allCategories.length > 5 && (
                    <button
                      style={styles.expandButton}
                      onClick={() => toggleExpand(product.id)}
                    >
                      {isExpanded ? '▲ 간략히' : `▼ 전체 보장 보기 (${allCategories.length - 5}개 더)`}
                    </button>
                  )}
                </div>
              )}

              {isExpanded && allCategories.length > 5 && (
                <div style={styles.expandSection}>
                  <ul style={styles.coverageList}>
                    {allCategories.slice(5).map((coverage, idx) => {
                      const bestAmount = findBestCoverage(coverage.category);
                      const isBest = bestAmount !== null && coverage.amount === bestAmount;
                      return (
                        <li key={idx + 5} style={styles.coverageItem}>
                          <span style={styles.coverageCategory}>{coverage.category}</span>
                          <span style={{
                            ...styles.coverageAmount,
                            ...(isBest ? styles.coverageAmountBest : {})
                          }}>
                            {formatAmount(coverage.amount)}
                            {isBest && ' ✓'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {conditions.length > 0 && (
                <div style={styles.expandSection}>
                  <div style={styles.summaryLabel}>특약사항 ({conditions.length}개)</div>
                  <ul style={styles.conditionsList}>
                    {conditions.slice(0, isExpanded ? conditions.length : 3).map((sc, idx) => {
                      const text =
                        typeof sc === 'string'
                          ? sc
                          : sc && typeof sc === 'object'
                          ? sc.condition_name || sc.condition_detail || ''
                          : '';
                      return (
                        <li key={idx} style={styles.conditionItem}>
                          <span style={styles.conditionItemBullet}>•</span>
                          {text}
                        </li>
                      );
                    })}
                  </ul>
                  {conditions.length > 3 && (
                    <button
                      style={styles.expandButton}
                      onClick={() => toggleExpand(product.id)}
                    >
                      {isExpanded ? '▲ 간략히' : `▼ 전체 특약 보기 (${conditions.length - 3}개 더)`}
                    </button>
                  )}
                </div>
              )}

              <div style={styles.footer}>
                <span>원본 PDF:</span>
                <a
                  href="#"
                  style={styles.pdfLink}
                  onClick={(e) => handleDownload(product, e)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#764ba2';
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#667eea';
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                  }}
                >
                  {product.pdf_filename || '다운로드'}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CompareView;
