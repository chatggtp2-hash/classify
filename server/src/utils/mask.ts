// Masking helpers. None of these ever return the full raw sensitive value.

export function maskDigitsKeepLast(value: string, keepLast = 4): string {
  const digitsOnly = value.replace(/\D/g, "");
  const last = digitsOnly.slice(-keepLast);
  const groups = value.match(/\d+|\D+/g) ?? [value];
  let digitsSeen = 0;
  const totalDigits = digitsOnly.length;
  return groups
    .map((g) => {
      if (!/\d/.test(g)) return g;
      return g
        .split("")
        .map((ch) => {
          digitsSeen++;
          const posFromEnd = totalDigits - digitsSeen;
          return posFromEnd < keepLast ? ch : "X";
        })
        .join("");
    })
    .join("");
}

export function maskPan(value: string): string {
  // ABCDE1234F -> XXXXX1234X (keep middle 4 digits, mask letters)
  if (value.length !== 10) return "X".repeat(Math.max(value.length - 2, 0)) + value.slice(-2);
  return "XXXXX" + value.slice(5, 9) + "X";
}

export function maskEmail(value: string): string {
  const [user, domain] = value.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(user.length - 1, 1))}@${domain}`;
}

export function maskGeneric(value: string, keepLast = 3): string {
  if (value.length <= keepLast) return "X".repeat(value.length);
  return "X".repeat(value.length - keepLast) + value.slice(-keepLast);
}

export function maskSecretAssignment(value: string): string {
  // For key=value style secrets, never reveal any part of the value.
  const idx = value.indexOf("=");
  if (idx === -1) return "***";
  return `${value.slice(0, idx + 1)}****`;
}
