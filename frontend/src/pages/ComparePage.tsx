import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareApi } from "../api/compare";
import NavigationBar from "../components/NavigationBar";
import CompareView from "../components/CompareView";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    paddingTop: "90px",
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
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
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
  promptWrapper: {
    width: "100%",
    margin: "0 auto",
    padding: "2rem 2rem",
  },
  prompt: {
    background: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    textAlign: "center" as const,
  },
  promptTitle: {
    fontSize: "1.5rem",
    color: "#333",
    marginBottom: "1rem",
  },
  promptText: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "1.5rem",
  },
  backButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "opacity 0.3s",
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    padding: "0",
  },
  actionButton: {
    padding: "0.6rem 1.2rem",
    background: "white",
    color: "#667eea",
    border: "1px solid #667eea",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  actionButtonPrimary: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
  },
  actionButtonDanger: {
    background: "white",
    color: "#d32f2f",
    border: "1px solid #d32f2f",
  },
  loading: {
    width: "100%",
    margin: "0 auto",
    padding: "2rem 2rem",
    textAlign: "center" as const,
    color: "#666",
  },
  content: {
    width: "100%",
    margin: "0 auto",
    padding: "2rem 2rem",
  },
};

function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<number[]>(() => {
    const ids = searchParams.get("ids");
    return ids ? ids.split(",").map(Number) : [];
  });

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (ids) {
      const parsedIds = ids
        .split(",")
        .map(Number)
        .filter((id) => !isNaN(id) && id > 0);
      console.log("URL에서 상품 ID 파싱:", parsedIds);
      setSelectedProducts(parsedIds);
    } else {
      console.log("URL에 상품 ID가 없습니다.");
      setSelectedProducts([]);
    }
  }, [searchParams]);

  const {
    data: compareData,
    isLoading: compareLoading,
    error: compareError,
  } = useQuery({
    queryKey: ["compare", selectedProducts],
    queryFn: async () => {
      try {
        const result = await compareApi.compareProducts(selectedProducts);
        console.log("비교 데이터:", result);
        return result;
      } catch (error) {
        console.error("비교 API 오류:", error);
        throw error;
      }
    },
    enabled: selectedProducts.length >= 2,
  });

  const handleRemoveProduct = (productId: number) => {
    const newProducts = selectedProducts.filter((id) => id !== productId);
    if (newProducts.length >= 2) {
      setSelectedProducts(newProducts);
      navigate(`/compare?ids=${newProducts.join(",")}`, { replace: true });
    } else {
      navigate("/search");
    }
  };

  const handleAddMore = () => {
    navigate(`/search?compareIds=${selectedProducts.join(",")}`);
  };

  const handleClearAll = () => {
    navigate("/search");
  };

  return (
    <div style={styles.page}>
      <NavigationBar />

      {selectedProducts.length < 2 ? (
        <div style={styles.promptWrapper}>
          <div style={styles.prompt}>
            <h2 style={styles.promptTitle}>상품 비교</h2>
            <p style={styles.promptText}>
              비교하려면 최소 2개 이상의 상품을 선택해주세요.
            </p>
            <button
              style={styles.backButton}
              onClick={() => navigate("/search")}
            >
              검색으로 돌아가기
            </button>
          </div>
        </div>
      ) : compareLoading ? (
        <div style={styles.loading}>비교 중...</div>
      ) : compareError ? (
        <div style={styles.promptWrapper}>
          <div style={styles.prompt}>
            <h2 style={styles.promptTitle}>오류 발생</h2>
            <p style={styles.promptText}>
              {compareError instanceof Error
                ? compareError.message
                : "비교 중 오류가 발생했습니다."}
            </p>
            <button
              style={styles.backButton}
              onClick={() => navigate("/search")}
            >
              검색으로 돌아가기
            </button>
          </div>
        </div>
      ) : compareData &&
        compareData.products &&
        compareData.products.length > 0 ? (
        <div style={styles.content}>
          <div style={styles.actionBar}>
            <button
              style={styles.actionButton}
              onClick={handleAddMore}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8f9ff";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0, 0, 0, 0.05)";
              }}
            >
              + 상품 추가
            </button>
            {selectedProducts.length > 2 && (
              <button
                style={{ ...styles.actionButton, ...styles.actionButtonDanger }}
                onClick={handleClearAll}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff5f5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0, 0, 0, 0.05)";
                }}
              >
                모두 제거
              </button>
            )}
            <button
              style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
              onClick={() => navigate("/search")}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0, 0, 0, 0.05)";
              }}
            >
              검색으로 돌아가기
            </button>
          </div>
          <CompareView
            products={compareData.products}
            onRemoveProduct={handleRemoveProduct}
          />
        </div>
      ) : (
        <div style={styles.promptWrapper}>
          <div style={styles.prompt}>
            <h2 style={styles.promptTitle}>비교할 상품이 없습니다</h2>
            <p style={styles.promptText}>선택한 상품을 찾을 수 없습니다.</p>
            <button
              style={styles.backButton}
              onClick={() => navigate("/search")}
            >
              검색으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComparePage;
