import "server-only";
import QRCode from "../../vendor/qrcode/lib/core/qrcode";
import Svg from "../../vendor/qrcode/lib/renderer/svg-tag";
export function qrDataUrl(text: string): string {
  const svg = Svg.render(QRCode.create(text, { errorCorrectionLevel: "M" }), {
    margin: 4,
    width: 240,
    color: { dark: "#071d3d", light: "#ffffff" },
  });
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
