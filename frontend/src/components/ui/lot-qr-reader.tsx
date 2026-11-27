"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { AlertCircle, Camera, ImageUp, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function readLotCode(raw: string) {
  let code = raw.trim();
  if (/^https?:\/\//i.test(code) || code.startsWith("/")) {
    try {
      const url = new URL(code, "https://agritrace.invalid");
      code = url.searchParams.get("batch") || url.searchParams.get("lot") || "";
    } catch {
      return "";
    }
  }
  code = code.replace(/^AGRITRACE-/i, "").trim();
  return /^[\p{L}\p{N}_-][\p{L}\p{N}._ -]{0,127}$/u.test(code) ? code : "";
}

function decode(
  source: HTMLVideoElement | ImageBitmap,
  width: number,
  height: number,
  canvas: HTMLCanvasElement
) {
  if (!width || !height) return "";
  const scale = Math.min(1, 1280 / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(frame.data, frame.width, frame.height)?.data ?? "";
}

export function LotQrReader({
  onCode,
  disabled = false,
}: {
  onCode: (code: string) => void;
  disabled?: boolean;
}) {
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const callback = useRef(onCode);
  useEffect(() => {
    callback.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!camera || disabled) return;
    let stopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const canvas = document.createElement("canvas");
    async function openCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped || !video.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        const read = () => {
          const element = video.current;
          if (stopped || !element) return;
          const raw =
            element.readyState >= 2 &&
            decode(element, element.videoWidth, element.videoHeight, canvas);
          if (raw) {
            const code = readLotCode(raw);
            setCamera(false);
            if (code) callback.current(code);
            else setError("Tem không chứa mã lô hợp lệ.");
            return;
          }
          timer = setTimeout(read, 180);
        };
        read();
      } catch {
        if (!stopped) {
          setCamera(false);
          setError(
            "Không mở được camera. Hãy cấp quyền, chọn ảnh tem hoặc nhập mã lô."
          );
        }
      }
    }
    void openCamera();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [camera, disabled]);

  async function readImage(imageFile?: File) {
    if (!imageFile) return;
    setError("");
    setCamera(false);
    try {
      const bitmap = await createImageBitmap(imageFile);
      try {
        const code = readLotCode(
          decode(
            bitmap,
            bitmap.width,
            bitmap.height,
            document.createElement("canvas")
          )
        );
        if (code) callback.current(code);
        else
          setError("Không tìm được mã lô trên ảnh. Hãy chọn ảnh tem rõ hơn.");
      } finally {
        bitmap.close();
      }
    } catch {
      setError("Không đọc được ảnh tem.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={camera ? "danger" : "secondary"}
          disabled={disabled}
          className="rounded-xl"
          onClick={() => {
            setError("");
            setCamera(!camera);
          }}
        >
          {camera ? (
            <>
              <X size={15} aria-hidden="true" />
              Đóng camera
            </>
          ) : (
            <>
              <Camera size={15} aria-hidden="true" />
              Quét tem QR
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          className="rounded-xl"
          onClick={() => file.current?.click()}
        >
          <ImageUp size={15} aria-hidden="true" />
          Chọn ảnh tem
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const image = e.target.files?.[0];
            e.target.value = "";
            void readImage(image);
          }}
        />
      </div>
      {camera && (
        <div className="relative inline-block overflow-hidden rounded-2xl border-2 border-emerald-500/70 bg-slate-950 shadow-md">
          <video
            ref={video}
            muted
            playsInline
            className="max-h-64 w-full max-w-sm object-cover"
            aria-label="Camera quét tem lô"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-36 w-36 rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]">
              <ScanLine
                size={20}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse text-emerald-300"
              />
            </div>
          </div>
          <p className="bg-slate-950/90 px-3 py-1.5 text-center text-xs text-emerald-200">
            Đưa mã QR trên tem vào khung trung tâm…
          </p>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
        >
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
