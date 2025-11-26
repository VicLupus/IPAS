import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type NavItem = { path: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { path: "/search", label: "보험상품검색" },
  { path: "/compare", label: "보험상품비교" },
  { path: "/ranking", label: "보험상품순위" },
];

const CSS = `
:root{
  --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-solid: #ffffff;
  --text: #333333;
  --text-white: #ffffff;
  --muted: #666666;
  --muted-light: rgba(255, 255, 255, 0.9);
  --primary: #667eea;
  --primary-dark: #764ba2;
  --danger: #ef4444;

  --shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  --focus: 0 0 0 4px rgba(102, 126, 234, 0.18);

  --r12: 12px;
  --r14: 14px;
}

/* ===== Header (simple) ===== */
.ipas-header{
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: var(--bg);
  box-shadow: var(--shadow);
  color: var(--text-white);
}

.ipas-inner{
  width: 100%;
  /* 헤더 높이를 현재보다 약 1/3 수준으로 줄이기 위해 패딩/간격 축소 */
  padding: 6px 18px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

/* ===== Brand ===== */
.ipas-brand{
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;

  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 280px;

  cursor: pointer;
  user-select: none;
  padding: 8px 8px;
  border-radius: var(--r14);
}
.ipas-brand:focus-visible{
  outline: none;
  box-shadow: var(--focus);
}

/* mark */
.ipas-mark{
  width: 28px;
  height: 28px;
  border-radius: 12px;
  flex: 0 0 auto;
  position: relative;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 6px 12px rgba(15,23,42,.10);
}
.ipas-mark::before{
  content:"";
  position:absolute;
  inset:-40%;
  background:
    radial-gradient(circle at 22% 28%, rgba(79,70,229,.95), transparent 55%),
    radial-gradient(circle at 82% 18%, rgba(168,85,247,.85), transparent 55%),
    radial-gradient(circle at 70% 85%, rgba(59,130,246,.72), transparent 60%);
  filter: blur(11px) saturate(1.1);
  opacity: .92;
  animation: ipasAurora 7.2s ease-in-out infinite;
}
.ipas-mark::after{
  content:"";
  position:absolute;
  inset: 12px;
  border-radius: 999px;
  background: rgba(255,255,255,.80);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.65);
}
@keyframes ipasAurora{
  0%   { transform: translate3d(-6%, -4%, 0) rotate(0deg) scale(1.06); }
  40%  { transform: translate3d(10%, -2%, 0) rotate(20deg) scale(1.10); }
  75%  { transform: translate3d(6%, 10%, 0) rotate(40deg) scale(1.08); }
  100% { transform: translate3d(-6%, -4%, 0) rotate(0deg) scale(1.06); }
}
@media (prefers-reduced-motion: reduce){
  .ipas-mark::before{ animation: none; }
}

.ipas-brandText{ display:flex; flex-direction:column; gap: 4px; }
.ipas-title{ display:flex; align-items:baseline; gap: 10px; line-height: 1.1; }

.ipas-ko{
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-white);
}
.ipas-en{
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--muted-light);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 서브텍스트도 크게 */
.ipas-sub{
  display:flex;
  align-items:center;
  gap: 6px;

  color: var(--muted-light);
  font-size: 0.78rem;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 0.04em;
}
.ipas-sub .dot{ color: rgba(255, 255, 255, 0.5); }

/* ===== Nav (underline only) ===== */
.ipas-navWrap{
  display:flex;
  justify-content:center;
  min-width: 0;
}

.ipas-rail{
  position: relative;
  display:flex;
  align-items:center;
  gap: 18px;

  padding: 8px 6px;
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.ipas-rail::-webkit-scrollbar{ display:none; }

.ipas-tab{
  appearance:none;
  border:0;
  background:transparent;
  color: rgba(255, 255, 255, 0.9);

  padding: 0.5rem 1rem;
  border-radius: 6px;

  font-size: 0.9rem;
  font-weight: 600;
  cursor:pointer;
  white-space:nowrap;

  transition: background 0.3s, color 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
}
.ipas-tab:hover{
  background: rgba(255, 255, 255, 0.3);
  color: var(--text-white);
}
.ipas-tab:focus-visible{
  outline:none;
  box-shadow: var(--focus);
}
.ipas-tab.is-active{
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  color: var(--text-white);
  font-weight: 600;
}

/* indicator = thin underline */
.ipas-indicator{
  position:absolute;
  left:0;
  bottom: 6px;
  height: 3px;
  border-radius: 999px;
  background: var(--text-white);
  pointer-events:none;
  transition: transform 180ms ease, width 180ms ease;
}

/* ===== Actions (bigger) ===== */
.ipas-actions{
  display:flex;
  justify-content:flex-end;
  gap: 12px;
  min-width: 280px;
}

.ipas-btn{
  appearance:none;
  border:0;
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-white);

  padding: 0.5rem 1rem;
  border-radius: 6px;

  font-size: 0.9rem;
  font-weight: 600;
  cursor:pointer;

  transition: background 0.3s, color 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.ipas-btn:hover{
  background: rgba(255, 255, 255, 0.3);
  color: var(--text-white);
}
.ipas-btn:focus-visible{
  outline:none;
  box-shadow: var(--focus);
}

.ipas-btn.primary{
  background: rgba(255, 255, 255, 0.3);
  color: var(--text-white);
  border-color: rgba(255, 255, 255, 0.5);
}
.ipas-btn.primary:hover{
  background: rgba(255, 255, 255, 0.4);
}

.ipas-btn.ghost{
  background: transparent;
  color: var(--muted-light);
}
.ipas-btn.ghost:hover{
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-white);
}

.ipas-btn.danger{
  background: transparent;
  color: var(--muted-light);
}
.ipas-btn.danger:hover{
  background: rgba(239, 68, 68, 0.2);
  color: var(--text-white);
}

/* ===== Responsive ===== */
@media (max-width: 980px){
  .ipas-inner{
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .ipas-actions{
    justify-content: space-between;
    min-width: 0;
  }
  .ipas-brand{ min-width: 0; }
  .ipas-tab{ font-size: 16px; }
}

/* fixed header offset helper */
.ipas-page-offset{ padding-top: 98px; }
`;

function StyleTagOnce() {
  React.useEffect(() => {
    const id = "ipas-navbar-large-text-v1";
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }, []);
  return null;
}

export default function NavigationBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = location.pathname === "/" ? "/search" : location.pathname;

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const rafRef = React.useRef<number | null>(null);

  const [indicator, setIndicator] = React.useState({
    left: 0,
    width: 0,
    show: false,
  });

  const scheduleUpdate = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rail = railRef.current;
      const el = tabRefs.current[activePath];
      if (!rail || !el) return;

      try {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      } catch {
        /* ignore */
      }

      const railRect = rail.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      const left = Math.round(elRect.left - railRect.left + rail.scrollLeft);
      const width = Math.round(elRect.width);

      setIndicator({ left, width, show: width > 0 });
    });
  }, [activePath]);

  React.useEffect(() => {
    scheduleUpdate();

    const onResize = () => scheduleUpdate();
    window.addEventListener("resize", onResize);

    let ro: ResizeObserver | null = null;
    if (railRef.current && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => scheduleUpdate());
      ro.observe(railRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  return (
    <>
      <StyleTagOnce />

      <header className="ipas-header">
        <div className="ipas-inner">
          {/* Brand */}
          <button
            type="button"
            className="ipas-brand"
            onClick={() => navigate("/search")}
            aria-label="IPAS 홈으로 이동"
          >
            <span className="ipas-mark" aria-hidden />
            <span className="ipas-brandText">
              <span className="ipas-title">
                <span className="ipas-ko">아이-패스</span>
                <span className="ipas-en">IPAS</span>
              </span>
              <span
                className="ipas-sub"
                title="Insurance Product Analysis System"
              >
                <span>보험 상품 비교·분석 시스템</span>
                <span className="dot">•</span>
                <span>Insurance Product Analysis System</span>
              </span>
            </span>
          </button>

          {/* Nav */}
          <nav className="ipas-navWrap" aria-label="메인 메뉴">
            <div className="ipas-rail" ref={railRef}>
              {indicator.show && (
                <span
                  className="ipas-indicator"
                  style={{
                    transform: `translateX(${indicator.left}px)`,
                    width: indicator.width,
                  }}
                  aria-hidden
                />
              )}

              {NAV_ITEMS.map((it) => {
                const isActive = activePath === it.path;
                return (
                  <button
                    key={it.path}
                    ref={(el) => {
                      tabRefs.current[it.path] = el;
                    }}
                    type="button"
                    className={`ipas-tab ${isActive ? "is-active" : ""}`}
                    onClick={() => navigate(it.path)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {it.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Actions */}
          <div className="ipas-actions">
            <button
              type="button"
              className="ipas-btn primary"
              onClick={() => navigate("/update")}
            >
              설정
            </button>

            <button type="button" className="ipas-btn danger" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
