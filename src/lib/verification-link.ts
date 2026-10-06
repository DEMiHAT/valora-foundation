export function parseVerificationLink(value: string, origin: string): string {
  const url = new URL(value, origin);
  if (url.origin !== origin)
    throw Error("Use a secure verification link from this Valora website.");
  const match = url.pathname.match(/^\/verify\/([A-Za-z0-9-]{1,80})$/);
  const token = url.searchParams.get("token");
  if (!match || !token || !/^[a-f0-9]{64}$/.test(token))
    throw Error(
      "Paste the full verification link from the QR, including its secure identifier."
    );
  return url.pathname + "?token=" + token;
}
