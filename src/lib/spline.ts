/** Only published Spline embeds are accepted; arbitrary iframe URLs are excluded. */
export function publishedSplineUrl(value?: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname === "my.spline.design") return url.toString();
  } catch {}
}
