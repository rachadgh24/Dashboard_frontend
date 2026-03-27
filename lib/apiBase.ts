/** Backend API root. Override with NEXT_PUBLIC_API_BASE_URL in .env.local */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://dashboard-backend-s3np.onrender.com'
).replace(/\/$/, '');
