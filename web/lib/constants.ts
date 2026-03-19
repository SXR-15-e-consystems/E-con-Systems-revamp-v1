export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
export const REVALIDATE_SECONDS = Number(process.env.REVALIDATE_SECONDS ?? '60');
