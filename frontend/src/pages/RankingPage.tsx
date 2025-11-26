import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import { scoresApi } from "../api/scores";
import CoverageDetailModal from "../components/CoverageDetailModal";
import { coverageApi } from "../api/coverage";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    // 네비게이션 바 높이보다 약간 더 여유를 두어 상단 요소가 가려지지 않도록 함
    paddingTop: "110px",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "2rem 0",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    marginBottom: "2rem",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  headerContent: {
    width: "100%",
    margin: "0 auto",
    padding: "0 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative" as const,
    zIndex: 1,
  },
  titleSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  headerTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  headerSubtitle: {
    fontSize: "0.95rem",
    fontWeight: 400,
    opacity: 0.9,
    letterSpacing: "0.05em",
    fontStyle: "italic" as const,
    marginTop: "0.25rem",
  },
  ipasBadge: {
    display: "inline-block",
    marginLeft: "0.75rem",
    padding: "0.25rem 0.75rem",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  filters: {
    display: "flex",
    gap: "0.5rem",
  },
  filterBtn: {
    padding: "0.5rem 1rem",
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "2px solid transparent",
  },
  nav: {
    display: "flex",
    gap: "0.5rem",
  },
  navButton: {
    padding: "0.5rem 1rem",
    background: "rgba(255, 255, 255, 0.2)",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.3s",
  },
  tableWrapper: {
    width: "100%",
    margin: "0 auto",
    padding: "0 2rem 2rem 2rem",
  },
  tableContainer: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    minWidth: "800px",
  },
  th: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    textAlign: "center" as const,
    fontWeight: 600,
    color: "#333",
    borderBottom: "2px solid #e0e0e0",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.2s",
  },
  rowHover: {
    backgroundColor: "#f8f9ff",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #f0f0f0",
    color: "#555",
  },
  rank: {
    fontWeight: 600,
    color: "#667eea",
    textAlign: "center" as const,
    width: "60px",
  },
  company: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  companyName: {
    fontWeight: 500,
  },
  title: {
    fontWeight: 500,
    maxWidth: "300px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  score: {
    textAlign: "center" as const,
    fontWeight: 500,
  },
  scoreTotal: {
    fontWeight: 600,
    color: "#667eea",
    fontSize: "1.1rem",
  },
  badge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  badgeLife: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  badgeNonlife: {
    backgroundColor: "#f3e5f5",
    color: "#7b1fa2",
  },
  loading: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#666",
  },
};

function RankingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [companyType, setCompanyType] = useState<"생명보험" | "손해보험" | "">(
    ""
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [duplicateRemovalDone, setDuplicateRemovalDone] = useState(false);

  // 중복 제거 mutation
  const removeDuplicatesMutation = useMutation({
    mutationFn: () => scoresApi.removeDuplicates(),
    onSuccess: (data) => {
      console.log(`중복 데이터 삭제 완료: ${data.deletedCount}개 상품 삭제됨`);
      // 랭킹 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      setDuplicateRemovalDone(true);
    },
    onError: (error: any) => {
      console.error("중복 데이터 삭제 오류:", error);
    },
  });

  // URL에서 compareIds 읽기
  useEffect(() => {
    const compareIds = searchParams.get("compareIds");
    if (compareIds) {
      const ids = compareIds
        .split(",")
        .map(Number)
        .filter((id) => !isNaN(id) && id > 0);
      setSelectedProducts(ids);
    }
  }, [searchParams]);

  // 페이지 로드 시 중복 제거 실행 (한 번만)
  useEffect(() => {
    if (!duplicateRemovalDone && !removeDuplicatesMutation.isPending) {
      removeDuplicatesMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ranking", companyType],
    queryFn: async () => {
      const result = await scoresApi.getRanking(
        companyType === "" ? undefined : companyType,
        undefined, // limit 제거 - 전체 상품 표시
        false
      );
      console.log("랭킹 데이터:", result);
      return result;
    },
    retry: 1,
  });

  const { data: productDetail } = useQuery({
    queryKey: ["coverage", selectedProductId],
    queryFn: () => coverageApi.getById(selectedProductId!),
    enabled: selectedProductId !== null,
    retry: 1,
  });

  const handleProductClick = (productId: number, e?: React.MouseEvent) => {
    // 정보 아이콘 클릭 시에는 이동하지 않음
    if (
      e &&
      (e.target as HTMLElement).tagName === "SPAN" &&
      (e.target as HTMLElement).textContent === "ⓘ"
    ) {
      return;
    }
    setSelectedProductId(productId);
  };

  const handleCloseModal = () => {
    setSelectedProductId(null);
  };

  const handleCompanyTypeChange = (type: "생명보험" | "손해보험" | "") => {
    setCompanyType(type);
  };

  const formatScore = (score: number | null) => {
    if (score === null) return "N/A";
    return score.toFixed(1);
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
    }
  };

  return (
    <div style={styles.page}>
      <NavigationBar />
      {selectedProductId && productDetail && (
        <CoverageDetailModal
          item={productDetail}
          searchQuery=""
          onClose={handleCloseModal}
        />
      )}

      <div
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "2rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: "1rem",
        }}
      >
        <div style={styles.filters}>
          <button
            style={
              companyType === ""
                ? { ...styles.filterBtn, ...styles.filterBtnActive }
                : styles.filterBtn
            }
            onClick={() => handleCompanyTypeChange("")}
            onMouseEnter={(e) => {
              if (companyType !== "") {
                e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (companyType !== "") {
                e.currentTarget.style.background = "white";
              }
            }}
          >
            전체
          </button>
          <button
            style={
              companyType === "생명보험"
                ? { ...styles.filterBtn, ...styles.filterBtnActive }
                : styles.filterBtn
            }
            onClick={() => handleCompanyTypeChange("생명보험")}
            onMouseEnter={(e) => {
              if (companyType !== "생명보험") {
                e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (companyType !== "생명보험") {
                e.currentTarget.style.background = "white";
              }
            }}
          >
            생명보험
          </button>
          <button
            style={
              companyType === "손해보험"
                ? { ...styles.filterBtn, ...styles.filterBtnActive }
                : styles.filterBtn
            }
            onClick={() => handleCompanyTypeChange("손해보험")}
            onMouseEnter={(e) => {
              if (companyType !== "손해보험") {
                e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (companyType !== "손해보험") {
                e.currentTarget.style.background = "white";
              }
            }}
          >
            손해보험
          </button>
        </div>
        {selectedProducts.length > 0 && (
          <div
            style={{
              position: "fixed",
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
            }}
          >
            <span
              style={{
                color: "#667eea",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {selectedProducts.length}개 상품 선택됨
            </span>
            <button
              onClick={handleCompare}
              disabled={selectedProducts.length < 2}
              style={{
                padding: "0.5rem 1rem",
                background:
                  selectedProducts.length >= 2
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor:
                  selectedProducts.length >= 2 ? "pointer" : "not-allowed",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "opacity 0.3s",
                opacity: selectedProducts.length >= 2 ? 1 : 0.5,
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
      </div>

      {isLoading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : error ? (
        <div style={{ ...styles.loading, color: "#c33" }}>
          랭킹을 불러오는 중 오류가 발생했습니다:{" "}
          {error instanceof Error ? error.message : "알 수 없는 오류"}
        </div>
      ) : !data || !data.products || data.products.length === 0 ? (
        <div style={styles.loading}>
          <div style={{ marginBottom: "1rem" }}>
            {companyType
              ? `${companyType} 상품의 점수가 없습니다.`
              : "랭킹 데이터가 없습니다."}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "#666",
              textAlign: "left",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            <strong>점수 계산 기준:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>상품 업데이트 시 자동으로 점수가 계산됩니다</li>
              <li>
                점수 계산을 위해서는 다음 데이터가 필요합니다:
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  <li>보장금액 정보 (coverageAmounts)</li>
                  <li>보험료 정보 (premiumAmount)</li>
                  <li>특약사항 정보 (specialConditions)</li>
                </ul>
              </li>
              <li>
                점수 구성: 보장범위(40점) + 보험료 대비 보장금액(40점) +
                특약사항(20점) = 총 100점
              </li>
            </ul>
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <strong>해결 방법:</strong>
              <ol style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                <li>보험상품 업데이트 페이지에서 상품을 업데이트하세요</li>
                <li>
                  업데이트 시 OpenAI API가 PDF를 분석하여 필요한 데이터를
                  추출합니다
                </li>
                <li>
                  데이터 추출이 성공하면 자동으로 점수가 계산되어 랭킹에
                  표시됩니다
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <div style={styles.tableContainer}>
            <div
              style={{
                padding: "1rem",
                borderBottom: "1px solid #e0e0e0",
                background: "#f8f9fa",
              }}
            >
              {(() => {
                const totalCount = data.count || 0; // 전체 상품 개수
                const displayedCount = data.products.length; // 실제 표시되는 개수

                return (
                  <span style={{ fontSize: "0.9rem", color: "#666" }}>
                    표시: {displayedCount}개 / 전체: {totalCount}개 상품
                    (종합점수 기준 내림차순 정렬)
                    <span
                      title="정렬 기준:&#10;1. 종합점수(total_score) 기준 내림차순&#10;2. 점수가 같으면 최신 업데이트 순&#10;3. 점수가 없는 상품은 최신 업데이트 순으로 하단에 배치"
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        color: "#999",
                        cursor: "help",
                        fontSize: "0.85rem",
                      }}
                    >
                      ⓘ
                    </span>
                  </span>
                );
              })()}
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.th,
                      width: "50px",
                      textAlign: "center" as const,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        data.products.length > 0 &&
                        data.products.every((p) =>
                          selectedProducts.includes(p.id)
                        )
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(data.products.map((p) => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                  </th>
                  <th style={styles.th}>순위</th>
                  <th style={styles.th}>보험사</th>
                  <th style={styles.th}>상품명</th>
                  <th style={styles.th}>
                    종합점수
                    <span
                      title="총 100점 만점&#10;&#10;• 보장범위 점수: 최대 40점&#10;• 보험료 대비 보장금액 점수: 최대 40점&#10;• 특약사항 점수: 최대 20점&#10;&#10;세 가지 점수를 합산하여 종합 평가합니다."
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        color: "#999",
                        cursor: "help",
                        fontSize: "0.85rem",
                      }}
                    >
                      ⓘ
                    </span>
                  </th>
                  <th style={styles.th}>
                    보장점수
                    <span
                      title="최대 40점&#10;&#10;【카테고리별 보장 점수】최대 25점&#10;• 카테고리 가중치: 암/사망(5점), 치매/뇌혈관/심장/장애(4점), 입원/수술/간병(3점), 기타(1-2점)&#10;• 보장금액 구간: 2억원 이상(3.0×가중치), 1억원 이상(2.5×가중치), 5천만원 이상(2.0×가중치), 3천만원 이상(1.5×가중치), 1천만원 이상(1.0×가중치)&#10;• 카테고리 다양성 보너스: 10개 이상(5점), 8개(4점), 6개(3점), 4개(2점), 2개(1점)&#10;&#10;【보장금액 총합 점수】최대 15점&#10;• 10억원 이상: 15점, 7억원: 14점, 5억원: 13점, 4억원: 12점, 3억원: 11점, 2.5억원: 10점, 2억원: 9점, 1.5억원: 8점, 1억원: 7점, 8천만원: 6점, 5천만원: 5점, 3천만원: 4점, 2천만원: 3점, 1천만원: 2점"
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        color: "#999",
                        cursor: "help",
                        fontSize: "0.85rem",
                      }}
                    >
                      ⓘ
                    </span>
                  </th>
                  <th style={styles.th}>
                    보험료점수
                    <span
                      title="최대 40점&#10;&#10;【보장금액/보험료 비율 점수】최대 25점&#10;• 3000배 이상: 25점, 2500배: 24점, 2000배: 23점, 1800배: 22점, 1500배: 21점, 1200배: 20점, 1000배: 19점, 900배: 18점, 800배: 17점, 700배: 16점, 600배: 15점, 500배: 14점, 400배: 12점, 300배: 10점, 200배: 8점, 150배: 6점, 100배: 4점, 80배: 3점, 50배: 2점, 30배: 1점&#10;&#10;【보험료 적정성 점수】최대 10점&#10;• 3만원 이하: 10점, 5만원: 9.5점, 7만원: 9점, 10만원: 8점, 12만원: 7점, 15만원: 6점, 18만원: 5점, 20만원: 4점, 25만원: 3점, 30만원: 2점, 40만원: 1점&#10;&#10;【보장기간 점수】최대 5점&#10;• 평생/종신/100세: 5점, 95세/90세: 4.5점, 85세/88세: 4점, 80세/82세: 3.5점, 75세/77세: 3점, 70세/72세: 2.5점, 65세/67세: 2점, 60세/62세: 1.5점, 40년 이상: 4점, 30년: 3.5점, 25년: 3점, 20년: 2.5점, 15년: 2점, 10년: 1.5점"
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        color: "#999",
                        cursor: "help",
                        fontSize: "0.85rem",
                      }}
                    >
                      ⓘ
                    </span>
                  </th>
                  <th style={styles.th}>
                    특약점수
                    <span
                      title="최대 20점&#10;&#10;【특약사항 개수 점수】최대 8점&#10;• 10개 이상: 8점, 8개: 7점, 6개: 6점, 4개: 5점, 3개: 4점, 2개: 3점, 1개: 2점&#10;&#10;【품질 키워드 점수】최대 12점&#10;• 고가치 특약: 면제(3점), 무해지(3점), 자동갱신(2점), 환급(2점), 적립(2점)&#10;• 추가 보장: 추가보장(2점), 특약(1.5점), 확대보장(1.5점)&#10;• 편의성: 간병(1.5점), 치매(1.5점), 재활(1점), 통원(1점), 내원(1점)&#10;• 혜택: 할인(0.5점), 보너스(0.5점), 프리미엄(0.5점), 리워드(0.5점)&#10;&#10;각 키워드는 중복되지 않도록 한 번만 적용됩니다."
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        color: "#999",
                        cursor: "help",
                        fontSize: "0.85rem",
                      }}
                    >
                      ⓘ
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product, index) => (
                  <tr
                    key={product.id}
                    style={{
                      ...styles.row,
                      ...(selectedProducts.includes(product.id)
                        ? { backgroundColor: "#f8f9ff" }
                        : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedProducts.includes(product.id)) {
                        e.currentTarget.style.backgroundColor =
                          styles.rowHover.backgroundColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedProducts.includes(product.id)) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                    onClick={(e) => {
                      // 체크박스 클릭 시에는 상세 모달 열지 않음
                      if (
                        (e.target as HTMLElement).tagName === "INPUT" ||
                        (e.target as HTMLElement).tagName === "SPAN" ||
                        (e.target as HTMLElement).textContent === "ⓘ"
                      ) {
                        return;
                      }
                      handleProductClick(product.id, e);
                    }}
                  >
                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center" as const,
                        width: "50px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                    <td style={{ ...styles.td, ...styles.rank }}>
                      {index + 1}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.company}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(product.company_type === "생명보험"
                              ? styles.badgeLife
                              : styles.badgeNonlife),
                          }}
                        >
                          {product.company_type}
                        </span>
                        <span style={styles.companyName}>
                          {product.company_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, ...styles.title }}>
                      {product.title}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        ...styles.score,
                        ...styles.scoreTotal,
                      }}
                    >
                      {formatScore(product.total_score)}
                    </td>
                    <td style={{ ...styles.td, ...styles.score }}>
                      {formatScore(product.coverage_score)}
                    </td>
                    <td style={{ ...styles.td, ...styles.score }}>
                      {formatScore(product.premium_score)}
                    </td>
                    <td style={{ ...styles.td, ...styles.score }}>
                      {formatScore(product.special_condition_score)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankingPage;
