/** Backend API root. Override with NEXT_PUBLIC_API_BASE_URL in .env.local */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5207'
    : 'https://dashboard-backend-s3np.onrender.com')
).replace(/\/$/, '');
