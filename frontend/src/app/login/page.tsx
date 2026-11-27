import { AuthForm } from "@/features/auth/auth-form";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Đăng nhập | AgriTrace AI" };

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Left panel — illustration */}
      <div
        className="hidden lg:flex"
        style={{
          width: "45%",
          background: "linear-gradient(160deg, #1a5c2e 0%, #1a7a3a 50%, #25a050 100%)",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: 100, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>AgriTrace AI</span>
        </Link>

        <div style={{ zIndex: 1 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <Image
              src="/images/hero-farm.png"
              alt="Nông trại rau sạch"
              width={500}
              height={320}
              style={{ width: "100%", height: "220px", objectFit: "cover" }}
            />
          </div>
          <blockquote style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>
            &ldquo;Minh bạch từ gốc, an toàn đến tay&rdquo;
          </blockquote>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>
            Hệ thống quản lý chuỗi cung ứng nông sản sạch — từ trang trại đến người tiêu dùng với công nghệ QR và AI.
          </p>
        </div>

        <div style={{ display: "flex", gap: 20, zIndex: 1 }}>
          {[
            { num: "5+", label: "Vai trò" },
            { num: "QR", label: "Nguồn gốc" },
            { num: "AI", label: "Thông minh" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "#fff",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={{ fontWeight: 700, color: "#1a7a3a" }}>AgriTrace AI</span>
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
            Chào mừng trở lại!
          </h1>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
            Đăng nhập để tiếp tục quản lý hệ thống nông sản.
          </p>

          <AuthForm mode="login" />

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#888" }}>
            Chưa có tài khoản?{" "}
            <Link href="/register" style={{ color: "#1a7a3a", fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
