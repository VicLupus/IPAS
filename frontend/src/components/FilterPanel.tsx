import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { coverageApi } from "../api/coverage";
import { companiesApi } from "../api/companies";

interface FilterPanelProps {
  filters: {
    companyType?: "생명보험" | "손해보험";
    category?: string;
    keywords?: string[];
    companyId?: number;
    companyIds?: number[];
    categories?: string[];
  };
  onFilterChange: (filters: FilterPanelProps["filters"]) => void;
}

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
    paddingTop: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  headerTitle: {
    fontSize: "1.2rem",
    color: "#333",
    margin: 0,
  },
  clearButton: {
    padding: "0.4rem 0.8rem",
    background: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#666",
    transition: "background 0.3s",
  },
  clearButtonHover: {
    background: "#e0e0e0",
  },
  section: {
    borderTop: "1px solid #eee",
    paddingTop: "1rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
    cursor: "pointer",
  },
  sectionTitle: {
    fontSize: "0.95rem",
    color: "#555",
    fontWeight: 600,
    margin: 0,
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  toggleButtonHover: {
    background: "#f0f0ff",
  },
  options: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#666",
  },
  checkboxList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    maxHeight: "300px",
    overflowY: "auto" as const,
    paddingRight: "0.5rem",
  },
  checkboxListScrollbar: {
    scrollbarWidth: "thin" as const,
    scrollbarColor: "#cbd5e0 #f7fafc",
  },
  checkboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#666",
    padding: "0.25rem 0",
    transition: "color 0.2s",
  },
  checkboxItemHover: {
    color: "#667eea",
  },
  selectedCount: {
    fontSize: "0.75rem",
    color: "#667eea",
    fontWeight: 600,
    marginLeft: "0.5rem",
  },
};

// 스크롤바 스타일을 위한 CSS (인라인 스타일로는 제한적이므로 전역 스타일 필요)
const scrollbarStyles = `
  .filter-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .filter-scrollbar::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 4px;
  }
  .filter-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }
  .filter-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

// 스타일 주입
if (typeof document !== "undefined") {
  const styleId = "filter-scrollbar-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = scrollbarStyles;
    document.head.appendChild(style);
  }
}

function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => coverageApi.getCategories(),
  });

  const { data: keywordsData } = useQuery({
    queryKey: ["keywords"],
    queryFn: () => coverageApi.getKeywords(),
  });

  const { data: companiesData } = useQuery({
    queryKey: ["companies", filters.companyType],
    queryFn: () => companiesApi.getAll(filters.companyType),
  });

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    filters.keywords || []
  );
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>(
    filters.companyIds || (filters.companyId ? [filters.companyId] : [])
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.categories || (filters.category ? [filters.category] : [])
  );

  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

  useEffect(() => {
    if (filters.keywords) {
      setSelectedKeywords(filters.keywords);
    }
    if (filters.companyIds) {
      setSelectedCompanies(filters.companyIds);
    } else if (filters.companyId) {
      setSelectedCompanies([filters.companyId]);
    }
    if (filters.categories) {
      setSelectedCategories(filters.categories);
    } else if (filters.category) {
      setSelectedCategories([filters.category]);
    }
  }, [
    filters.companyId,
    filters.companyIds,
    filters.category,
    filters.categories,
  ]);

  useEffect(() => {
    const newFilters = {
      ...filters,
      keywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
      companyIds: selectedCompanies.length > 0 ? selectedCompanies : undefined,
      companyId:
        selectedCompanies.length === 1 ? selectedCompanies[0] : undefined,
      categories:
        selectedCategories.length > 0 ? selectedCategories : undefined,
      category:
        selectedCategories.length === 1 ? selectedCategories[0] : undefined,
    };
    onFilterChange(newFilters);
  }, [selectedKeywords, selectedCompanies, selectedCategories]);

  const handleCompanyTypeChange = (type: "생명보험" | "손해보험" | "") => {
    onFilterChange({
      ...filters,
      companyType: type || undefined,
      companyId: undefined,
      companyIds: undefined,
    });
    setSelectedCompanies([]);
  };

  const toggleCompany = (companyId: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const clearFilters = () => {
    onFilterChange({});
    setSelectedKeywords([]);
    setSelectedCompanies([]);
    setSelectedCategories([]);
  };

  const allCategoriesAndKeywords = [
    ...(categoriesData?.categories.map((cat) => ({
      type: "category" as const,
      value: cat,
    })) || []),
    ...(keywordsData?.keywords.map((kw) => ({
      type: "keyword" as const,
      value: kw,
    })) || []),
  ].sort((a, b) => a.value.localeCompare(b.value));

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>검색필터</h2>
        <button
          onClick={clearFilters}
          style={styles.clearButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              styles.clearButtonHover.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = styles.clearButton.background;
          }}
        >
          초기화
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>보험사 유형</h3>
        <div style={styles.options}>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name="companyType"
              value=""
              checked={!filters.companyType}
              onChange={() => handleCompanyTypeChange("")}
            />
            전체
          </label>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name="companyType"
              value="생명보험"
              checked={filters.companyType === "생명보험"}
              onChange={() => handleCompanyTypeChange("생명보험")}
            />
            생명보험
          </label>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name="companyType"
              value="손해보험"
              checked={filters.companyType === "손해보험"}
              onChange={() => handleCompanyTypeChange("손해보험")}
            />
            손해보험
          </label>
        </div>
      </div>

      {companiesData && companiesData.companies.length > 0 && (
        <div style={styles.section}>
          <div
            style={styles.sectionHeader}
            onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
          >
            <h3 style={styles.sectionTitle}>
              보험사
              {selectedCompanies.length > 0 && (
                <span style={styles.selectedCount}>
                  ({selectedCompanies.length})
                </span>
              )}
            </h3>
            <button
              style={styles.toggleButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  styles.toggleButtonHover.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {isCompaniesExpanded ? "접기 ▲" : "펼치기 ▼"}
            </button>
          </div>
          {isCompaniesExpanded && (
            <div
              className="filter-scrollbar"
              style={{
                ...styles.checkboxList,
                ...styles.checkboxListScrollbar,
              }}
            >
              {companiesData.companies.map((company) => (
                <label
                  key={company.id}
                  style={styles.checkboxItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color =
                      styles.checkboxItemHover.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = styles.checkboxItem.color;
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company.id)}
                    onChange={() => toggleCompany(company.id)}
                  />
                  <span>{company.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {allCategoriesAndKeywords.length > 0 && (
        <div style={styles.section}>
          <div
            style={styles.sectionHeader}
            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          >
            <h3 style={styles.sectionTitle}>
              카테고리
              {(selectedCategories.length > 0 ||
                selectedKeywords.length > 0) && (
                <span style={styles.selectedCount}>
                  ({selectedCategories.length + selectedKeywords.length})
                </span>
              )}
            </h3>
            <button
              style={styles.toggleButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  styles.toggleButtonHover.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {isCategoriesExpanded ? "접기 ▲" : "펼치기 ▼"}
            </button>
          </div>
          {isCategoriesExpanded && (
            <div
              className="filter-scrollbar"
              style={{
                ...styles.checkboxList,
                ...styles.checkboxListScrollbar,
              }}
            >
              {allCategoriesAndKeywords.map((item, index) => {
                const isSelected =
                  item.type === "category"
                    ? selectedCategories.includes(item.value)
                    : selectedKeywords.includes(item.value);

                return (
                  <label
                    key={`${item.type}-${index}`}
                    style={styles.checkboxItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        styles.checkboxItemHover.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = styles.checkboxItem.color;
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (item.type === "category") {
                          toggleCategory(item.value);
                        } else {
                          toggleKeyword(item.value);
                        }
                      }}
                    />
                    <span>{item.value}</span>
                    {item.type === "category" && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#999",
                          marginLeft: "0.25rem",
                        }}
                      >
                        [카테고리]
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
