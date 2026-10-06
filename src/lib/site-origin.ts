/** Vercel provides these hostnames at build time and in server functions. */
export function siteOrigin() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return new URL(process.env.APP_URL || (host ? `https://${host}` : "http://localhost:3000")).origin;
}
