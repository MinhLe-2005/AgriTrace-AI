/**
 * Tiện ích khởi tạo URL Mã QR Thật (Real Scannable QR Code) cho toàn hệ thống AgriTrace AI.
 * - Tự động thay thế `localhost` bằng địa chỉ IPv4 LAN của máy tính khi có sẵn để Điện thoại quét được ngay.
 * - Nhúng kèm thông tin tóm tắt của lô nông sản vào query params để trang `/qr/[code]` hiển thị tức thì.
 * - Giải mã linh hoạt mọi định dạng mã QR khi quét bằng Camera hoặc tải ảnh PNG lên.
 */

export interface QrProductSnapshot {
  code: string;
  name?: string;
  farm?: string;
  location?: string;
  harvestDate?: string;
  expiryDate?: string;
  cert?: string;
  qty?: string;
  unit?: string;
  temp?: string;
  status?: string;
}

export function resolveProductImageByCodeOrName(code?: string, name?: string): string {
  const c = (code || "").toUpperCase();
  const n = (name || "").toLowerCase();

  if (c.includes("DT") || n.includes("dâu")) return "/images/products/dau-tay.jpg";
  if (c.includes("KL") || n.includes("kale") || n.includes("cải xoăn")) return "/images/products/cai-kale.jpg";
  if (c.includes("CS") || n.includes("cam")) return "/images/products/cam-sanh.jpg";
  if (c.includes("BO") || n.includes("bơ")) return "/images/products/bo-sap.jpg";
  if (c.includes("CC") || n.includes("cà chua")) return "/images/products/ca-chua.jpg";
  if (c.includes("CR") || n.includes("cà rốt")) return "/images/products/ca-rot.jpg";
  if (c.includes("NDG") || n.includes("nấm")) return "/images/products/nam-dui-ga.jpg";
  if (c.includes("XC") || c.includes("MC") || n.includes("xoài") || n.includes("mận")) {
    return "/images/categories/cat-trai-cay.jpg";
  }
  return "/images/products/xa-lach.jpg";
}

let cachedLanIp: string | null = null;
let cachedPublicUrl: string | null = null;

export async function fetchServerLanIp(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const r = await fetch("/api/lan-ip", { cache: "no-store" });
    const data: { lanIp?: string | null; publicUrl?: string | null } = await r.json();
    if (data?.publicUrl) {
      cachedPublicUrl = data.publicUrl;
    }
    if (data?.lanIp) {
      cachedLanIp = data.lanIp;
    }
    return cachedPublicUrl || cachedLanIp;
  } catch {
    return cachedPublicUrl || cachedLanIp;
  }
}

export function getScannableBaseOrigin(lanIpOrPublicUrl?: string | null): string {
  if (lanIpOrPublicUrl && (lanIpOrPublicUrl.startsWith("http://") || lanIpOrPublicUrl.startsWith("https://"))) {
    return lanIpOrPublicUrl.replace(/\/+$/, "");
  }
  if (cachedPublicUrl) {
    return cachedPublicUrl.replace(/\/+$/, "");
  }
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }
  const { protocol, hostname, port } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const effectiveHost = isLocal && (lanIpOrPublicUrl || cachedLanIp) ? (lanIpOrPublicUrl || cachedLanIp)! : hostname;
  return `${protocol}//${effectiveHost}${port ? `:${port}` : ""}`;
}

/**
 * Tạo đường dẫn trang HTML đơn giản `/qr/[code]` để mã hóa vào QR Code.
 * Giữ URL thật ngắn gọn (chỉ `/qr/CODE`) để mật độ điểm ảnh QR thưa, to, rõ nét,
 * giúp camera điện thoại & Zalo quét nhạy trong 0.5 giây!
 */
export function buildScannableQrLandingUrl(
  snapshot: QrProductSnapshot,
  lanIp?: string | null
): string {
  const base = getScannableBaseOrigin(lanIp);
  const cleanCode = (snapshot.code || "XL-2026-08").trim().toUpperCase();
  return `${base}/qr/${encodeURIComponent(cleanCode)}`;
}

/**
 * Sinh URL ảnh QR Code thực tế từ URL trang đích `/qr/[code]`
 */
export function buildRealQrImageUrl(
  snapshot: QrProductSnapshot,
  size = 260,
  lanIp?: string | null
): string {
  const targetUrl = buildScannableQrLandingUrl(snapshot, lanIp);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=L&margin=6&data=${encodeURIComponent(
    targetUrl
  )}`;
}

/**
 * Trích xuất mã lô chuẩn từ bất kỳ chuỗi dữ liệu QR nào (URL `/qr/CODE`, `/traceability?batch=CODE`, hoặc `AGRITRACE-CODE`).
 */
export function extractBatchCodeFromQrPayload(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "XL-2026-08";

  // 1. Nếu là đường dẫn chứa /qr/{code} hoặc /trace/{code}
  const qrPathMatch = trimmed.match(/\/(?:qr|trace)\/([^/?#&]+)/i);
  if (qrPathMatch && qrPathMatch[1]) {
    return decodeURIComponent(qrPathMatch[1]).trim().toUpperCase();
  }

  // 2. Nếu có query batch= hoặc lot=
  if (trimmed.includes("batch=")) {
    return decodeURIComponent(trimmed.split("batch=")[1].split("&")[0]).trim().toUpperCase();
  }
  if (trimmed.includes("lot=")) {
    return decodeURIComponent(trimmed.split("lot=")[1].split("&")[0]).trim().toUpperCase();
  }

  // 3. Nếu có tiền tố AGRITRACE-
  if (trimmed.toUpperCase().startsWith("AGRITRACE-")) {
    return trimmed.substring("AGRITRACE-".length).trim().toUpperCase();
  }

  return trimmed.toUpperCase();
}
