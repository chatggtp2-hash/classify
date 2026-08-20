import type { ReactElement } from "react";

export type Page = "dashboard" | "documents" | "upload" | "details" | "policies" | "audit";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: ReactElement }[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.5" y="1.5" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="9.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    page: "documents",
    label: "Documents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 2h6l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    page: "upload",
    label: "Upload",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 11V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M4.5 5.5L8 2l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    page: "policies",
    label: "Classification Policies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5l5 2v4c0 3.5-2.2 5.9-5 7-2.8-1.1-5-3.5-5-7v-4l5-2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    page: "audit",
    label: "Audit History",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-60 shrink-0 flex flex-col border-r"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5l5 2v4c0 3.5-2.2 5.9-5 7-2.8-1.1-5-3.5-5-7v-4l5-2z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              SENTINEL
            </div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-faint)" }}>
              Data Classification
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                background: active ? "var(--surface-raised)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <span style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div
        className="px-4 py-3 border-t text-[11px] leading-relaxed"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
      >
        Rule-based classification engine.
        <br />
        No AI. Fully deterministic.
      </div>
    </aside>
  );
}
