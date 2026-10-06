import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
// Bundle fonts so E-cards render consistently on Vercel and local machines.
process.env.FONTCONFIG_FILE = path.join(
  process.cwd(),
  "vendor/fonts/fonts.conf"
);
import type { PublicCredential } from "./models";
import QRCode from "../../vendor/qrcode/lib/core/qrcode";
import Svg from "../../vendor/qrcode/lib/renderer/svg-tag";
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        char
      ]!)
  );
}
export function qrSvg(text: string): string {
  return Svg.render(QRCode.create(text, { errorCorrectionLevel: "M" }), {
    margin: 4,
    width: 280,
    color: { dark: "#071d3d", light: "#ffffff" },
  });
}
function splitLines(text: string, max = 30): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text
    .split(/\s+/)
    .flatMap((word) =>
      Array.from(
        word.matchAll(new RegExp(".{1," + max + "}", "gu")),
        (m) => m[0]
      )
    )) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}
function textLines(
  lines: string[],
  x: number,
  y: number,
  size: number,
  color: string,
  weight = "400"
) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${
          y + i * (size + 10)
        }" font-family="DejaVu Sans,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeHtml(
          line
        )}</text>`
    )
    .join("");
}
export function ecardSvg(
  credential: PublicCredential,
  verifyUrl: string,
  crestBase64: string
): string {
  const nameLines = splitLines(credential.participant, 29),
    eventLines = splitLines(credential.event, 39),
    portfolioLines = splitLines(credential.portfolio, 33);
  const qr = Buffer.from(qrSvg(verifyUrl)).toString("base64");
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(credential.validUntil));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1120" viewBox="0 0 900 1120">
 <rect width="900" height="1120" rx="26" fill="#f8f7f2"/><rect width="900" height="232" rx="26" fill="#650b25"/><rect y="200" width="900" height="32" fill="#650b25"/>
 <image href="data:image/png;base64,${crestBase64}" x="61" y="38" width="137" height="130"/>
 <text x="225" y="89" font-family="DejaVu Serif,Georgia,serif" font-size="42" letter-spacing="4" fill="#f8f7f2">VALORA</text>
 <text x="226" y="123" font-family="DejaVu Sans,Arial,sans-serif" font-size="15" letter-spacing="6" fill="#dbbd77">FOUNDATION</text>
 <text x="226" y="167" font-family="DejaVu Sans,Arial,sans-serif" font-size="13" letter-spacing="2" fill="#e4ccd3">KNOWLEDGE. GROWTH. EMPATHY.</text>
 <text x="62" y="293" font-family="DejaVu Sans,Arial,sans-serif" font-size="13" letter-spacing="3" fill="#650b25">OFFICIAL DELEGATE E-CARD</text>
 ${textLines(
   nameLines,
   60,
   353,
   nameLines.length > 2 ? 29 : 36,
   "#202220",
   "600"
 )}
 ${textLines(eventLines, 62, 470, 21, "#650b25")}
 <path d="M62 533H838" stroke="#dad5c4"/>
 <text x="62" y="575" font-family="DejaVu Sans,Arial,sans-serif" font-size="12" letter-spacing="2" fill="#77776d">COMMITTEE / CATEGORY</text>
 ${textLines(
   splitLines(credential.committee, 29).slice(0, 2),
   62,
   615,
   28,
   "#202220"
 )}
 <text x="62" y="678" font-family="DejaVu Sans,Arial,sans-serif" font-size="12" letter-spacing="2" fill="#77776d">PORTFOLIO</text>
 ${textLines(
   portfolioLines,
   62,
   718,
   portfolioLines.length > 2 ? 19 : 23,
   "#202220"
 )}
 <text x="62" y="842" font-family="DejaVu Sans,Arial,sans-serif" font-size="12" letter-spacing="2" fill="#77776d">VALORA E-ID</text>
 <text x="62" y="885" font-family="DejaVu Sans,Arial,sans-serif" font-size="29" font-weight="600" fill="#650b25">${escapeHtml(
   credential.credential_id
 )}</text>
 <text x="62" y="948" font-family="DejaVu Sans,Arial,sans-serif" font-size="12" letter-spacing="2" fill="#77776d">EVENT VALIDITY</text>
 <text x="62" y="980" font-family="DejaVu Sans,Arial,sans-serif" font-size="18" fill="#202220">${escapeHtml(
   date
 )} · IST</text>
 <image href="data:image/svg+xml;base64,${qr}" x="558" y="727" width="280" height="280"/>
 <text x="698" y="1031" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="11" letter-spacing="1" fill="#77776d">SCAN TO VERIFY</text>
 <path d="M62 1060H838" stroke="#dad5c4"/>
 <text x="62" y="1090" font-family="DejaVu Sans,Arial,sans-serif" font-size="11" fill="#77776d">Bring your E-card to the event. Validity is confirmed by the secure QR.</text>
 </svg>`;
}
export async function renderEcard(
  credential: PublicCredential,
  verifyUrl: string
): Promise<Buffer> {
  const crest = await readFile(
    path.join(process.cwd(), "public/brand/crest.png")
  );
  return sharp(
    Buffer.from(ecardSvg(credential, verifyUrl, crest.toString("base64")))
  )
    .png()
    .toBuffer();
}
