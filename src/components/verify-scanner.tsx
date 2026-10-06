"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ShieldCheck, ArrowRight } from "lucide-react";
import { parseVerificationLink } from "@/lib/verification-link";
type Detector = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
export function VerifyScanner() {
  const router = useRouter(),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState(""),
    [error, setError] = useState(""),
    [scanning, setScanning] = useState(false);
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setScanning(false);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );
  function verify(raw: string) {
    try {
      const path = parseVerificationLink(raw.trim(), window.location.origin);
      stop();
      router.push(path);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function scan() {
    setError("");
    const Constructor = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => Detector;
      }
    ).BarcodeDetector;
    if (!Constructor) {
      setError(
        "Camera QR scanning is not supported in this browser. Use your phone’s camera to open the QR, or paste its verification link below."
      );
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      stream.current = media;
      setScanning(true);
      const detector = new Constructor({ formats: ["qr_code"] });
      const poll = async () => {
        if (!stream.current) return;
        if (video.current) {
          if (video.current.srcObject !== media) {
            video.current.srcObject = media;
            await video.current.play();
          }
          try {
            const results = await detector.detect(video.current);
            if (results[0]) {
              verify(results[0].rawValue);
              stop();
              return;
            }
          } catch {}
        }
        timer.current = setTimeout(poll, 250);
      };
      timer.current = setTimeout(poll, 200);
    } catch {
      stop();
      setError(
        "The camera could not be opened. Allow camera access or paste the secure link below."
      );
    }
  }
  return (
    <div className="scanner-panel">
      <ShieldCheck size={36} />
      <h2>Check a delegate E-ID.</h2>
      <p>
        An E-ID number alone isn’t enough. The secure identifier in the current
        QR prevents credentials from being guessed.
      </p>
      {scanning ? (
        <div className="scanner-camera">
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            aria-label="QR scanner camera"
          />
          <button className="button button-outline" onClick={stop}>
            Stop camera
          </button>
        </div>
      ) : (
        <button className="button button-primary" onClick={scan}>
          <Camera size={18} />
          Scan a QR code
        </button>
      )}
      <div className="scanner-separator">OR PASTE THE VERIFICATION LINK</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(value);
        }}
      >
        <label htmlFor="verification-link">Secure QR link</label>
        <div className="scanner-input-row">
          <input
            id="verification-link"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://…/verify/VM26-00001?token=…"
            required
            maxLength={600}
          />
          <button className="button button-primary" type="submit">
            Verify <ArrowRight size={16} />
          </button>
        </div>
      </form>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
