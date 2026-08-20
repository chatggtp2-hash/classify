import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", padded = true, style }: CardProps) {
  return (
    <div
      className={`rounded-lg border ${padded ? "p-5" : ""} ${className}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)", ...style }}
    >
      {children}
    </div>
  );
}
