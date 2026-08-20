"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LARGE_VOLUME_PII_THRESHOLD = exports.SCORE_THRESHOLDS = exports.FORCE_RESTRICTED_TYPES = exports.MAX_COUNTED_OCCURRENCES = exports.POINTS_PER_OCCURRENCE = void 0;
// Points awarded PER OCCURRENCE, capped per-type by maxCountedOccurrences to avoid
// a single huge document blowing the score to infinity while still reflecting
// "large volumes of PII" as higher risk than a single instance.
exports.POINTS_PER_OCCURRENCE = {
    EMAIL: 5,
    PHONE: 5,
    BANK_ACCOUNT: 30,
    CREDIT_CARD: 40,
    PAN: 40,
    AADHAAR: 50,
    PASSWORD: 60,
    API_KEY: 70,
    ACCESS_TOKEN: 70,
};
// Cap how many occurrences of a single type count toward the score, so 500 emails
// doesn't literally mean 2500 points -- but still lets volume push the score up.
exports.MAX_COUNTED_OCCURRENCES = {
    EMAIL: 10,
    PHONE: 10,
    BANK_ACCOUNT: 5,
    CREDIT_CARD: 5,
    PAN: 5,
    AADHAAR: 5,
    PASSWORD: 3,
    API_KEY: 3,
    ACCESS_TOKEN: 3,
};
// Findings of these types force RESTRICTED regardless of numeric score.
exports.FORCE_RESTRICTED_TYPES = ["API_KEY", "PASSWORD", "ACCESS_TOKEN"];
// Score band -> classification (used only when nothing forces RESTRICTED).
exports.SCORE_THRESHOLDS = {
    internalMax: 9, // 0-9 -> INTERNAL
    confidentialMax: 39, // 10-39 -> CONFIDENTIAL
    // 40+ -> RESTRICTED
};
// "Large volume of PII" rule: if total (uncapped) count of CONFIDENTIAL-tier
// findings (email/phone) exceeds this, bump toward RESTRICTED per spec examples.
exports.LARGE_VOLUME_PII_THRESHOLD = 40;
