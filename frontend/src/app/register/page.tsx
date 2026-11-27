import { AuthForm } from "@/features/auth/auth-form";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Đăng ký | AgriTrace AI" };

export default function RegisterPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Right panel — form (swap order for register) */}
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
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={{ fontWeight: 700, color: "#1a7a3a" }}>AgriTrace AI</span>
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
            Tạo tài khoản mới
          </h1>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
            Đăng ký để bắt đầu quản lý chuỗi cung ứng nông sản sạch.
          </p>

          {/* Role hint */}
          <div
            style={{
              background: "#f0f7f0",
              border: "1px solid #c8e6c9",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <p style={{ fontSize: 12, color: "#388e3c", lineHeight: 1.6 }}>
              Mặc định tài khoản sẽ là vai trò <strong>Khách hàng</strong>. Admin sẽ phân quyền thêm nếu bạn là Nông dân, Nhân viên kho hoặc Nhà phân phối.
            </p>
          </div>

          <AuthForm mode="register" />

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#888" }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "#1a7a3a", fontWeight: 600 }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {/* Left panel — illustration */}
      <div
        className="hidden lg:flex"
        style={{
          width: "45%",
          background: "linear-gradient(160deg, #1a5c2e 0%, #1a7a3a 60%, #25a050 100%)",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>AgriTrace AI</span>
        </Link>

        <div style={{ zIndex: 1 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <Image
              src="/images/fresh-produce.png"
              alt="Nông sản sạch"
              width={500}
              height={320}
              style={{ width: "100%", height: "220px", objectFit: "cover" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { emoji: "🌱", text: "Quản lý toàn bộ chuỗi cung ứng nông sản" },
              { emoji: "📱", text: "Truy xuất nguồn gốc bằng mã QR" },
              { emoji: "🤖", text: "AI hỗ trợ phân tích và tư vấn" },
              { emoji: "⭐", text: "Tích điểm & ưu đãi thành viên" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", zIndex: 1 }}>
          © 2026 AgriTrace AI. Minh bạch từ gốc.
        </p>
      </div>
    </div>
  );
}
