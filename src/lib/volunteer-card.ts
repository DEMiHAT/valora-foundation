import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PublicVolunteerCredential } from "./models";
import { escapeHtml, qrSvg } from "./ecard";

process.env.FONTCONFIG_FILE = path.join(process.cwd(), "vendor/fonts/fonts.conf");

function lines(value: string, max: number) {
  const result: string[] = [];
  let current = "";
  for (const word of value.trim().split(/\s+/)) {
    if (current && `${current} ${word}`.length > max) {
      result.push(current);
      current = word;
    } else current = `${current} ${word}`.trim();
  }
  if (current) result.push(current);
  return result.slice(0, 3);
}

function svgLines(values: string[], x: number, y: number, size: number, gap: number, color: string, weight = 400) {
  return values.map((value, index) =>
    `<text x="${x}" y="${y + index * gap}" font-family="DejaVu Sans,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeHtml(value)}</text>`
  ).join("");
}

export function volunteerCardSvg(
  credential: PublicVolunteerCredential,
  verifyUrl: string,
  crestBase64: string
) {
  const qr = Buffer.from(qrSvg(verifyUrl)).toString("base64");
  const contributionLines = lines(credential.contributions.join(" · "), 45);
  const validity = credential.validUntil
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(credential.validUntil))
    : "Ongoing community membership";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1120" viewBox="0 0 900 1120">
  <rect width="900" height="1120" rx="34" fill="#102f55"/>
  <rect x="54" y="54" width="116" height="116" rx="24" fill="#f0ca4f"/>
  <image href="data:image/png;base64,${crestBase64}" x="72" y="71" width="80" height="80"/>
  <text x="202" y="102" font-family="DejaVu Sans,Arial,sans-serif" font-size="38" font-weight="700" fill="#ffffff">VALORA FOUNDATION</text>
  <text x="202" y="149" font-family="DejaVu Sans,Arial,sans-serif" font-size="24" letter-spacing="2" fill="#d9e2ec">${escapeHtml(credential.cardTitle.toUpperCase())}</text>
  <path d="M54 224H846" stroke="#7790aa" stroke-width="2"/>
  <text x="54" y="300" font-family="DejaVu Sans,Arial,sans-serif" font-size="23" letter-spacing="2" fill="#f0ca4f">THIS CARD BELONGS TO</text>
  ${svgLines(lines(credential.name, 28), 54, 376, 48, 58, "#ffffff", 700)}
  <text x="54" y="518" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" fill="#cbd7e4">VOLUNTEER ID</text>
  <text x="54" y="565" font-family="DejaVu Sans,Arial,sans-serif" font-size="35" font-weight="700" fill="#ffffff">${escapeHtml(credential.volunteer_id)}</text>
  <text x="54" y="642" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" fill="#cbd7e4">PROGRAMME / EVENT</text>
  ${svgLines(lines(credential.program, 35), 54, 689, 29, 40, "#ffffff", 600)}
  <text x="54" y="797" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" fill="#cbd7e4">CONTRIBUTING TO</text>
  ${svgLines(contributionLines, 54, 841, 21, 33, "#ffffff", 400)}
  <rect x="618" y="646" width="228" height="228" rx="24" fill="#ffffff"/>
  <image href="data:image/svg+xml;base64,${qr}" x="630" y="658" width="204" height="204"/>
  <text x="732" y="905" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="13" letter-spacing="2" fill="#cbd7e4">SCAN TO VERIFY</text>
  <path d="M54 958H846" stroke="#7790aa" stroke-width="2"/>
  <text x="54" y="1008" font-family="DejaVu Sans,Arial,sans-serif" font-size="18" fill="#cbd7e4">${escapeHtml(validity)}</text>
  <text x="54" y="1065" font-family="DejaVu Sans,Arial,sans-serif" font-size="28" fill="#f0ca4f">Learn. Lead. Make an impact.</text>
  </svg>`;
}

export async function renderVolunteerCard(
  credential: PublicVolunteerCredential,
  verifyUrl: string
) {
  const crest = await readFile(path.join(process.cwd(), "public/brand/crest.png"));
  return sharp(Buffer.from(volunteerCardSvg(credential, verifyUrl, crest.toString("base64"))))
    .png()
    .toBuffer();
}
