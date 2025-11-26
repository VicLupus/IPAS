import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { updateApi, CompanyFiles, CompanyProducts } from "../api/update";
import NavigationBar from "../components/NavigationBar";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    paddingTop: "90px",
  },
  container: {
    width: "100%",
    margin: "0 auto",
    padding: "2rem 2rem",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  headerTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: 0,
    marginBottom: "0.5rem",
  },
  headerSubtitle: {
    fontSize: "1rem",
    opacity: 0.9,
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap" as const,
  },
  button: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "opacity 0.2s",
  },
  buttonSecondary: {
    padding: "0.75rem 1.5rem",
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  content: {
    background: "white",
    borderRadius: "8px",
    padding: "2rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  tabs: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "0.5rem",
  },
  tabButton: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "20px",
    backgroundColor: "#f3f4ff",
    color: "#4f46e5",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  tabButtonActive: {
    backgroundColor: "#4f46e5",
    color: "white",
    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
  },
  summary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid #f0f0f0",
  },
  summaryText: {
    fontSize: "1.1rem",
    color: "#333",
    fontWeight: 600,
  },
  companyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  companyItem: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden" as const,
    background: "white",
  },
  companyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    background: "#f8f9fa",
    borderBottom: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  companyHeaderHover: {
    background: "#f0f0f0",
  },
  companyName: {
    fontSize: "0.95rem",
    color: "#555",
    fontWeight: 600,
    margin: 0,
  },
  companyToggle: {
    background: "none",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  companyContent: {
    padding: "1.5rem",
  },
  companyInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #f0f0f0",
  },
  companyType: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  companyTypeLife: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  companyTypeNonlife: {
    backgroundColor: "#f3e5f5",
    color: "#7b1fa2",
  },
  fileCount: {
    fontSize: "0.9rem",
    color: "#666",
  },
  fileList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    background: "#f8f9fa",
    borderRadius: "4px",
    fontSize: "0.85rem",
    color: "#555",
  },
  fileName: {
    flex: 1,
    fontFamily: "monospace",
  },
  fileDate: {
    color: "#999",
    fontSize: "0.8rem",
    marginLeft: "1rem",
  },
  companyActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
  },
  companyButton: {
    padding: "0.5rem 1rem",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "opacity 0.2s",
  },
  loading: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#666",
  },
  error: {
    background: "#fee",
    color: "#c33",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  success: {
    background: "#efe",
    color: "#3c3",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  loadingOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingSpinner: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1.5rem",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "6px solid rgba(255, 255, 255, 0.3)",
    borderTop: "6px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "white",
    fontSize: "1.2rem",
    fontWeight: 600,
  },
};

function UpdatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"files" | "products">("files");
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [updatingCompany, setUpdatingCompany] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["update-files"],
    queryFn: () => updateApi.getFiles(),
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["update-products"],
    queryFn: () => updateApi.getProducts(),
    enabled: activeTab === "products",
  });

  const updateAllMutation = useMutation({
    mutationFn: () => updateApi.update(),
    onSuccess: (data) => {
      setUpdateMessage({
        type: "success",
        message: `전체 업데이트 완료: 수정 ${data.updated}개, 신규 ${
          data.created
        }개${data.errors.length > 0 ? `, 오류 ${data.errors.length}개` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["update-files"] });
      queryClient.invalidateQueries({ queryKey: ["update-products"] });
      // 랭킹 쿼리도 무효화하여 자동 갱신
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      setTimeout(() => {
        navigate("/search");
      }, 2000);
    },
    onError: (error: any) => {
      setUpdateMessage({
        type: "error",
        message: `업데이트 실패: ${
          error.response?.data?.error || error.message
        }`,
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({
      companyName,
      companyType,
    }: {
      companyName: string;
      companyType: "생명보험" | "손해보험";
    }) => updateApi.updateCompany(companyName, companyType),
    onSuccess: (data, variables) => {
      setUpdateMessage({
        type: "success",
        message: `${variables.companyName} 업데이트 완료: 수정 ${
          data.updated
        }개, 신규 ${data.created}개${
          data.errors.length > 0 ? `, 오류 ${data.errors.length}개` : ""
        }`,
      });
      setUpdatingCompany(null);
      queryClient.invalidateQueries({ queryKey: ["update-files"] });
      queryClient.invalidateQueries({ queryKey: ["update-products"] });
      // 랭킹 쿼리도 무효화하여 자동 갱신
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onError: (error: any, variables) => {
      setUpdateMessage({
        type: "error",
        message: `${variables.companyName} 업데이트 실패: ${
          error.response?.data?.error || error.message
        }`,
      });
      setUpdatingCompany(null);
    },
  });

  const toggleCompany = (key: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleUpdateAll = () => {
    if (confirm("모든 보험사의 파일을 OpenAI API로 업데이트하시겠습니까?")) {
      setUpdateMessage(null);
      updateAllMutation.mutate();
    }
  };

  const handleUpdateCompany = (
    companyName: string,
    companyType: "생명보험" | "손해보험"
  ) => {
    if (confirm(`${companyName}의 파일을 OpenAI API로 업데이트하시겠습니까?`)) {
      setUpdateMessage(null);
      setUpdatingCompany(`${companyName}|${companyType}`);
      updateCompanyMutation.mutate({ companyName, companyType });
    }
  };

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => updateApi.deleteProduct(productId),
    onSuccess: () => {
      setUpdateMessage({
        type: "success",
        message: "상품이 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["update-products"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["coverage"] });
    },
    onError: (error: any) => {
      setUpdateMessage({
        type: "error",
        message: `삭제 실패: ${error.response?.data?.error || error.message}`,
      });
    },
  });

  const deleteAllProductsMutation = useMutation({
    mutationFn: () => updateApi.deleteAllProducts(),
    onSuccess: (data) => {
      setUpdateMessage({
        type: "success",
        message: data.message || "전체 상품이 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["update-products"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["coverage"] });
    },
    onError: (error: any) => {
      setUpdateMessage({
        type: "error",
        message: `전체 삭제 실패: ${
          error.response?.data?.error || error.message
        }`,
      });
    },
  });

  const handleDeleteProduct = (productId: number, productTitle: string) => {
    if (
      confirm(
        `"${productTitle}" 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      deleteProductMutation.mutate(productId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLoading = activeTab === "files" ? filesLoading : productsLoading;
  const error = activeTab === "files" ? filesError : productsError;

  const isUpdating =
    updateAllMutation.isPending || updateCompanyMutation.isPending;

  return (
    <div style={styles.page}>
      <NavigationBar />
      {isUpdating && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>
              {updateAllMutation.isPending
                ? "전체 보험상품 업데이트 중..."
                : "보험상품 업데이트 중..."}
            </div>
          </div>
        </div>
      )}
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>보험상품 업데이트</h1>
          <p style={styles.headerSubtitle}>
            생명보험 및 손해보험 폴더에 등록된 PDF 파일을 조회하고 OpenAI API로
            분석하여 업데이트합니다.
          </p>
        </div>

        {updateMessage && (
          <div
            style={
              updateMessage.type === "success" ? styles.success : styles.error
            }
          >
            {updateMessage.message}
          </div>
        )}

        <div style={styles.actions}>
          <button
            style={{
              ...styles.button,
              ...(updateAllMutation.isPending ? styles.buttonDisabled : {}),
            }}
            onClick={handleUpdateAll}
            disabled={updateAllMutation.isPending}
            onMouseEnter={(e) => {
              if (!updateAllMutation.isPending) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {updateAllMutation.isPending ? "업데이트 중..." : "전체 업데이트"}
          </button>
          <button
            style={styles.buttonSecondary}
            onClick={() =>
              activeTab === "files" ? refetchFiles() : refetchProducts()
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f9ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            목록 새로고침
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "files" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab("files")}
              onMouseEnter={(e) => {
                if (activeTab !== "files") {
                  e.currentTarget.style.backgroundColor = "#e5e7ff";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "files") {
                  e.currentTarget.style.backgroundColor = "#f3f4ff";
                }
              }}
            >
              PDF 파일 기준 업데이트
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "products" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab("products")}
              onMouseEnter={(e) => {
                if (activeTab !== "products") {
                  e.currentTarget.style.backgroundColor = "#e5e7ff";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "products") {
                  e.currentTarget.style.backgroundColor = "#f3f4ff";
                }
              }}
            >
              등록 상품 관리
            </button>
          </div>

          {isLoading ? (
            <div style={styles.loading}>
              {activeTab === "files"
                ? "파일 목록을 불러오는 중..."
                : "상품 목록을 불러오는 중..."}
            </div>
          ) : error ? (
            <div style={styles.error}>
              {activeTab === "files" ? "파일" : "상품"} 목록을 불러오는 중
              오류가 발생했습니다:{" "}
              {error instanceof Error ? error.message : "알 수 없는 오류"}
            </div>
          ) : activeTab === "files" ? (
            <>
              <div style={styles.summary}>
                <span style={styles.summaryText}>
                  총 {filesData?.totalFiles || 0}개 파일,{" "}
                  {filesData?.companies.length || 0}개 보험사
                </span>
              </div>
              <div style={styles.companyList}>
                {filesData?.companies.map((company: CompanyFiles) => {
                  const key = `${company.companyName}|${company.companyType}`;
                  const isExpanded = expandedCompanies.has(key);
                  const isUpdating = updatingCompany === key;

                  return (
                    <div key={key} style={styles.companyItem}>
                      <div
                        style={styles.companyHeader}
                        onClick={() => toggleCompany(key)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            styles.companyHeaderHover.background;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                        }}
                      >
                        <h3 style={styles.companyName}>
                          {company.companyName}
                        </h3>
                        <button
                          style={styles.companyToggle}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompany(key);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(102, 126, 234, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          {isExpanded ? "접기 ▲" : "펼치기 ▼"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={styles.companyContent}>
                          <div style={styles.companyInfo}>
                            <span
                              style={{
                                ...styles.companyType,
                                ...(company.companyType === "생명보험"
                                  ? styles.companyTypeLife
                                  : styles.companyTypeNonlife),
                              }}
                            >
                              {company.companyType}
                            </span>
                            <span style={styles.fileCount}>
                              {company.files.length}개 파일
                            </span>
                          </div>

                          <div style={styles.fileList}>
                            {company.files.map((file, idx) => (
                              <div key={idx} style={styles.fileItem}>
                                <span style={styles.fileName}>
                                  {file.filename}
                                </span>
                                <span style={styles.fileDate}>
                                  {formatDate(file.mtime)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div style={styles.companyActions}>
                            <button
                              style={{
                                ...styles.companyButton,
                                ...(isUpdating ? styles.buttonDisabled : {}),
                              }}
                              onClick={() =>
                                handleUpdateCompany(
                                  company.companyName,
                                  company.companyType
                                )
                              }
                              disabled={isUpdating}
                              onMouseEnter={(e) => {
                                if (!isUpdating) {
                                  e.currentTarget.style.opacity = "0.9";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                              }}
                            >
                              {isUpdating
                                ? "업데이트 중..."
                                : "이 보험사 업데이트"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === "products" ? (
            <>
              <div style={styles.summary}>
                <span style={styles.summaryText}>
                  총 {productsData?.totalProducts || 0}개 상품,{" "}
                  {productsData?.companies.length || 0}개 보험사
                </span>
                <button
                  style={{
                    ...styles.button,
                    background: "#ef4444",
                    ...(deleteAllProductsMutation.isPending
                      ? styles.buttonDisabled
                      : {}),
                  }}
                  disabled={deleteAllProductsMutation.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        "정말 전체 보험상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다."
                      )
                    ) {
                      setUpdateMessage(null);
                      deleteAllProductsMutation.mutate();
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!deleteAllProductsMutation.isPending) {
                      e.currentTarget.style.opacity = "0.9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {deleteAllProductsMutation.isPending
                    ? "전체 삭제 중..."
                    : "전체 상품 삭제"}
                </button>
              </div>
              <div style={styles.companyList}>
                {productsData?.companies.map((company: CompanyProducts) => {
                  const key = `${company.companyName}|${company.companyType}`;
                  const isExpanded = expandedCompanies.has(key);

                  return (
                    <div key={key} style={styles.companyItem}>
                      <div
                        style={styles.companyHeader}
                        onClick={() => toggleCompany(key)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            styles.companyHeaderHover.background;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                        }}
                      >
                        <h3 style={styles.companyName}>
                          {company.companyName}
                        </h3>
                        <button
                          style={styles.companyToggle}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompany(key);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(102, 126, 234, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          {isExpanded ? "접기 ▲" : "펼치기 ▼"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={styles.companyContent}>
                          <div style={styles.companyInfo}>
                            <span
                              style={{
                                ...styles.companyType,
                                ...(company.companyType === "생명보험"
                                  ? styles.companyTypeLife
                                  : styles.companyTypeNonlife),
                              }}
                            >
                              {company.companyType}
                            </span>
                            <span style={styles.fileCount}>
                              {company.products.length}개 상품
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                            }}
                          >
                            {company.products.map((product) => (
                              <div
                                key={product.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1rem",
                                  background: "#f8f9fa",
                                  borderRadius: "4px",
                                  fontSize: "0.85rem",
                                  color: "#555",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.25rem",
                                    flex: 1,
                                    marginRight: "1rem",
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>
                                    {product.title}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#888",
                                    }}
                                  >
                                    {product.pdf_filename}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#999",
                                    }}
                                  >
                                    등록일:{" "}
                                    {formatDate(product.created_at)} / 수정일:{" "}
                                    {formatDate(product.updated_at)}
                                  </span>
                                </div>
                                <button
                                  style={{
                                    ...styles.companyButton,
                                    background: "#e53935",
                                  }}
                                  onClick={() =>
                                    handleDeleteProduct(
                                      product.id,
                                      product.title
                                    )
                                  }
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.9";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                  }}
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default UpdatePage;
