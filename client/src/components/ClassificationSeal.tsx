import { Classification } from "../types";

const COLOR_VAR: Record<Classification, string> = {
  PUBLIC: "var(--c-public)",
  INTERNAL: "var(--c-internal)",
  CONFIDENTIAL: "var(--c-confidential)",
  RESTRICTED: "var(--c-restricted)",
};

interface ClassificationSealProps {
  classification: Classification;
  size?: "sm" | "lg";
}

export function ClassificationSeal({ classification, size = "sm" }: ClassificationSealProps) {
  const color = COLOR_VAR[classification];
  return (
    <span
      className={`class-seal ${size === "lg" ? "class-seal-lg" : "class-seal-sm"}`}
      style={{ color }}
    >
      <span
        aria-hidden
        style={{
          width: size === "lg" ? 8 : 6,
          height: size === "lg" ? 8 : 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      {classification}
    </span>
  );
}
