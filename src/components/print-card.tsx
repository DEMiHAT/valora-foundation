"use client";
import { Printer, Download } from "lucide-react";
export function PrintCard({ token }: { token: string }) {
  return (
    <div className="credential-actions">
      <button className="button button-primary" onClick={() => window.print()}>
        <Printer size={17} /> Print E-ID
      </button>
      <a
        className="button button-outline"
        href={`/api/ecard/${token}`}
        download
      >
        <Download size={17} />
        Save E-card
      </a>
    </div>
  );
}
