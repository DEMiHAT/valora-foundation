/** Vercel provides these hostnames at build time and in server functions. */
export function siteOrigin() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const productionOrigin = process.env.VERCEL_ENV === "production"
    ? "https://www.valorafoundation.in"
    : undefined;
  return new URL(
    process.env.APP_URL ||
      productionOrigin ||
      (host ? `https://${host}` : "http://localhost:3000")
  ).origin;
}
