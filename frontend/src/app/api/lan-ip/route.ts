import fs from "fs";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";

/**
 * Trả về Public HTTPS Tunnel URL (để điện thoại dùng 4G / khác Wi-Fi vẫn quét được QR)
 * kèm theo địa chỉ IPv4 mạng LAN thực tế của máy chủ dev.
 */
export async function GET() {
  let publicUrl: string | null = process.env.NEXT_PUBLIC_TUNNEL_URL || null;
  try {
    const filePath = path.join(process.cwd(), ".public-url");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8").trim();
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        publicUrl = raw.replace(/\/+$/, "");
      }
    }
  } catch {
    // ignore
  }

  const interfaces = os.networkInterfaces();
  const candidates: { name: string; address: string; score: number }[] = [];

  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    const lowerName = name.toLowerCase();
    // Bỏ qua các card mạng ảo (VirtualBox 192.168.56.1, VMware, WSL, Hyper-V, VPN)
    const isVirtual =
      lowerName.includes("virtual") ||
      lowerName.includes("vbox") ||
      lowerName.includes("vmware") ||
      lowerName.includes("vethernet") ||
      lowerName.includes("wsl") ||
      lowerName.includes("vpn") ||
      lowerName.includes("loopback") ||
      lowerName.includes("bluetooth");

    for (const iface of list) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (iface.address === "192.168.56.1" || isVirtual) continue;
        let score = 10;
        if (lowerName.includes("wi-fi") || lowerName.includes("wlan") || lowerName.includes("wireless")) {
          score += 50;
        } else if (lowerName.includes("ethernet")) {
          score += 30;
        }
        if (iface.address.startsWith("192.168.")) score += 20;
        candidates.push({ name, address: iface.address, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const lanIp = candidates[0]?.address || null;

  return NextResponse.json({ lanIp, publicUrl });
}
