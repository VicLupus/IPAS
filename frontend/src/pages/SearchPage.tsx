import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { coverageApi } from "../api/coverage";
import NavigationBar from "../components/NavigationBar";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import CoverageList from "../components/CoverageList";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    width: "100%",
    // 네비게이션 바 높이에 맞춰 상단 여백을 조정
    paddingTop: "70px",
  },
  searchSection: {
    width: "100%",
    background: "#f5f5f5",
    transition: "padding-left 0.3s ease",
  },
  searchSectionExpanded: {
    padding: "2rem 2rem 2rem 320px",
  },
  searchSectionCollapsed: {
    padding: "2rem 2rem 2rem 70px",
  },
  mainLayout: {
    width: "100%",
    display: "flex",
    gap: "0",
  },
  filterSidebar: {
    position: "fixed" as const,
    left: 0,
    // NavigationBar 바로 아래부터 시작
    top: "70px",
    // 화면 하단 끝까지 가득 차도록 설정
    bottom: "0px",
    background: "white",
    boxShadow: "2px 0 8px rgba(0, 0, 0, 0.05)",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    zIndex: 100,
    borderRight: "1px solid #e0e0e0",
    transition: "width 0.3s ease",
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
  },
  filterSidebarExpanded: {
    width: "300px",
    padding: "1.5rem",
  },
  filterSidebarCollapsed: {
    width: "50px",
    padding: "1.5rem 0.5rem",
  },
  filterContent: {
    transition: "opacity 0.2s ease, visibility 0.2s ease",
    visibility: "visible" as const,
  },
  filterContentHidden: {
    opacity: 0,
    pointerEvents: "none" as const,
    overflow: "hidden" as const,
    visibility: "hidden" as const,
    height: 0,
  },
  toggleButton: {
    position: "absolute" as const,
    right: "-25px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "40px",
    height: "70px",
    background: "white",
    border: "1px solid #e0e0e0",
    borderLeft: "none",
    borderRadius: "0 12px 12px 0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "3px 0 8px rgba(0, 0, 0, 0.15)",
    zIndex: 101,
    transition: "background 0.2s, box-shadow 0.2s",
  },
  toggleButtonHover: {
    background: "#f8f9ff",
  },
  toggleIcon: {
    fontSize: "1.8rem",
    color: "#667eea",
    fontWeight: 700,
    transition: "transform 0.3s",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textShadow: "0 1px 2px rgba(102, 126, 234, 0.2)",
  },
  contentSection: {
    flex: 1,
    background: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    position: "relative" as const,
    margin: "0 2rem 2rem 0",
    minHeight: "calc(100vh - 200px)",
    transition: "margin-left 0.3s ease",
  },
  loading: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#666",
  },
  selectedInfo: {
    position: "fixed" as const,
    top: "110px",
    right: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 1rem",
    background: "#f8f9ff",
    borderRadius: "8px",
    border: "1px solid #e0e7ff",
    zIndex: 999,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  selectedText: {
    color: "#667eea",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  compareButton: {
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "opacity 0.3s",
  },
  compareButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #f0f0f0",
  },
  paginationInfo: {
    color: "#666",
    fontSize: "0.9rem",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  pageSizeSelect: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.9rem",
    cursor: "pointer",
    background: "white",
  },
  pageButtons: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  pageButton: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#666",
    transition: "all 0.2s",
  },
  pageButtonActive: {
    background: "#667eea",
    color: "white",
    borderColor: "#667eea",
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [filters, setFilters] = useState<{
    companyType?: "생명보험" | "손해보험";
    category?: string;
    categories?: string[];
    keywords?: string[];
    companyId?: number;
    companyIds?: number[];
  }>({});

  useEffect(() => {
    const selected = searchParams.get("selected");
    const compareIds = searchParams.get("compareIds");
    
    if (compareIds) {
      const ids = compareIds.split(",").map(Number).filter(id => !isNaN(id) && id > 0);
      setSelectedProducts(ids);
    } else if (selected) {
      const productId = parseInt(selected);
      if (!isNaN(productId)) {
        setSelectedProducts([productId]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, pageSize]);

  const offset = (currentPage - 1) * pageSize;

  const { data, isLoading } = useQuery({
    queryKey: ["coverage", searchQuery, filters, pageSize, offset],
    queryFn: () =>
      coverageApi.search({
        q: searchQuery,
        ...filters,
        limit: pageSize,
        offset: offset,
      }),
  });

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount > 0 ? offset + 1 : 0;
  const endItem = Math.min(offset + pageSize, totalCount);

  // 선택된 상품이 검색 결과에 없을 경우 처리
  useEffect(() => {
    const selected = searchParams.get("selected");
    if (!selected) return;

    const productId = parseInt(selected);
    if (isNaN(productId)) return;

    // data가 로드되었고 결과가 있을 때만 체크
    if (!data?.results) return;

    const productInResults = data.results.find((p) => p.id === productId);

    if (!productInResults) {
      // 상품 정보를 가져와서 필터 적용
      coverageApi
        .getById(productId)
        .then((product) => {
          if (product) {
            // 해당 상품의 보험사 타입으로 필터 적용
            if (product.company_type) {
              setFilters((prev) => ({
                ...prev,
                companyType: product.company_type as "생명보험" | "손해보험",
              }));
            }
            // 검색 쿼리를 상품 제목으로 설정하여 검색 결과에 포함되도록 함
            setSearchQuery(product.title);
          }
        })
        .catch((err) => {
          console.error("상품 정보 가져오기 실패:", err);
        });
    }
  }, [searchParams, data?.results?.length, data?.count]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedProducts.length >= 2) {
      navigate(`/compare?ids=${selectedProducts.join(",")}`);
    } else {
      alert("비교하려면 최소 2개 이상의 상품을 선택해주세요.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const toggleFilter = () => {
    setIsFilterCollapsed(!isFilterCollapsed);
  };

  return (
    <div style={styles.page}>
      <NavigationBar />

      <div
        style={{
          ...styles.searchSection,
          ...(isFilterCollapsed
            ? styles.searchSectionCollapsed
            : styles.searchSectionExpanded),
        }}
      >
        <SearchBar onSearch={handleSearch} />
      </div>

      <div style={styles.mainLayout}>
        <aside
          className="filter-sidebar"
          style={{
            ...styles.filterSidebar,
            ...(isFilterCollapsed
              ? styles.filterSidebarCollapsed
              : styles.filterSidebarExpanded),
          }}
        >
          <button
            style={styles.toggleButton}
            onClick={toggleFilter}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f9ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
            title={isFilterCollapsed ? "필터 펼치기" : "필터 접기"}
          >
            <span
              style={{
                ...styles.toggleIcon,
                transform: isFilterCollapsed ? "rotate(0deg)" : "rotate(180deg)",
              }}
            >
              ▶
            </span>
          </button>
          <div
            style={{
              ...styles.filterContent,
              ...(isFilterCollapsed ? styles.filterContentHidden : {}),
            }}
          >
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </aside>

        <section
          style={{
            ...styles.contentSection,
            marginLeft: isFilterCollapsed ? "50px" : "300px",
          }}
        >
          {selectedProducts.length > 0 && (
            <div style={styles.selectedInfo}>
              <span style={styles.selectedText}>
                {selectedProducts.length}개 상품 선택됨
              </span>
              <button
                onClick={handleCompare}
                disabled={selectedProducts.length < 2}
                style={{
                  ...styles.compareButton,
                  ...(selectedProducts.length < 2
                    ? styles.compareButtonDisabled
                    : {}),
                }}
                onMouseEnter={(e) => {
                  if (selectedProducts.length >= 2) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProducts.length >= 2) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                비교하기
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={styles.loading}>로딩 중...</div>
          ) : (
            <>
              <CoverageList
                items={data?.results || []}
                searchQuery={searchQuery}
                selectedProducts={selectedProducts}
                onProductSelect={handleProductSelect}
                totalCount={totalCount}
              />

              {totalCount > 0 && (
                <div style={styles.paginationContainer}>
                  <div style={styles.paginationInfo}>
                    {startItem}-{endItem} / 총 {totalCount}개
                  </div>
                  <div style={styles.paginationControls}>
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                      }
                      style={styles.pageSizeSelect}
                    >
                      <option value={20}>20개씩</option>
                      <option value={50}>50개씩</option>
                      <option value={100}>100개씩</option>
                    </select>
                    <div style={styles.pageButtons}>
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === 1
                            ? styles.pageButtonDisabled
                            : {}),
                        }}
                      >
                        처음
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === 1
                            ? styles.pageButtonDisabled
                            : {}),
                        }}
                      >
                        이전
                      </button>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              style={{
                                ...styles.pageButton,
                                ...(currentPage === pageNum
                                  ? styles.pageButtonActive
                                  : {}),
                              }}
                              onMouseEnter={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = "#f5f5f5";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = "white";
                                }
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === totalPages
                            ? styles.pageButtonDisabled
                            : {}),
                        }}
                      >
                        다음
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === totalPages
                            ? styles.pageButtonDisabled
                            : {}),
                        }}
                      >
                        마지막
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default SearchPage;
