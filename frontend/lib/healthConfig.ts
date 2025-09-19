// frontend/lib/healthConfig.ts

// Pages to check (HEAD with GET fallback)
export const PAGE_CHECKS: string[] = [
  "/",
  "/how-it-works",
  "/modules",
  "/start",
  "/survey",
  "/contact",
  "/investors",
  "/admin/health",
];

// APIs to check (GET)
export const API_CHECKS: string[] = [
  "/api/health",
  "/api/ping/backend",
  "/api/survey/questions?role=retailer&country=India",
  "/api/admin/chunks/summary",
];
