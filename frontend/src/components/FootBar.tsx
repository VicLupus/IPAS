const styles = {
  wrapper: {
    width: "100%",
    borderTop: "1px solid #e5e7eb",
    background: "#ffffff",
    // 상단 여백을 제거하여 본문/검색필터와 자연스럽게 맞닿도록 조정
    marginTop: "0px",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.8rem",
    color: "#6b7280",
  },
  left: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  right: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end" as const,
    gap: "4px",
    textAlign: "right" as const,
  },
  brand: {
    fontWeight: 600,
    color: "#4b5563",
  },
  linkRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  link: {
    cursor: "pointer",
    textDecoration: "none",
    color: "#6b7280",
  },
};

export default function FootBar() {
  return (
    <footer style={styles.wrapper}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <span style={styles.brand}>IPAS (Insurance Product Analysis System)</span>
          <span>보험설계사 전용 보험상품 비교·분석 도구</span>
        </div>
        <div style={styles.right}>
          <div style={styles.linkRow}>
            <span style={styles.link}>이용약관</span>
            <span>·</span>
            <span style={styles.link}>개인정보처리방침</span>
          </div>
          <span>© {new Date().getFullYear()} IPAS. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}


