"use client";

import {
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Leaf,
  MessageCircle,
  Package,
  QrCode,
  ShieldCheck,
  Star,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";



/* ─── Hero ─── */
function Hero() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #f0f7f2 0%, #fff 45%, #fafdf9 100%)",
        padding: "64px 0 80px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 60,
          flexWrap: "wrap",
        }}
      >
        {/* Left */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#e8f5e9",
              color: "#1a7a3a",
              padding: "5px 13px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 22,
            }}
          >
            <Leaf size={13} />
            Nền tảng nông sản sạch Việt Nam
          </span>

          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 46px)",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#1a1a1a",
              marginBottom: 18,
            }}
          >
            Quản lý chuỗi cung ứng
            <br />
            <span style={{ color: "#1a7a3a" }}>nông sản sạch</span> thông minh
          </h1>

          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
            AgriTrace AI giúp theo dõi hành trình nông sản từ trang trại đến bàn ăn. Truy xuất nguồn gốc bằng QR Code, quản lý kho hàng, đơn hàng và phân tích thông minh từ AI.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 26px",
                background: "#1a7a3a",
                color: "#fff",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Dùng thử miễn phí <ChevronRight size={16} />
            </Link>
            <Link
              href="#gioi-thieu"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 26px",
                background: "#fff",
                color: "#333",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                border: "1px solid #ddd",
              }}
            >
              Tìm hiểu thêm
            </Link>
          </div>

          {/* Trust bar */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { num: "5+", label: "Vai trò người dùng" },
              { num: "QR", label: "Truy xuất nguồn gốc" },
              { num: "24/7", label: "Hỗ trợ trực tuyến" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1a7a3a" }}>{s.num}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image */}
        <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
            <Image
              src="/images/hero-farm.png"
              alt="Nông trại rau sạch Việt Nam"
              width={600}
              height={400}
              style={{ width: "100%", height: "auto", display: "block" }}
              priority
            />
          </div>
          {/* Floating badge */}
          <div
            style={{
              position: "absolute",
              bottom: -18,
              left: -18,
              background: "#fff",
              borderRadius: 14,
              padding: "14px 18px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#e8f5e9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={20} color="#1a7a3a" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Truy xuất nguồn gốc</div>
              <div style={{ fontSize: 11, color: "#999" }}>100% minh bạch từ gốc</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function About() {
  return (
    <section id="gioi-thieu" style={{ padding: "80px 0", background: "#fff" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: 64,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 300, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <Image
            src="/images/qr-scan.png"
            alt="Quét mã QR truy xuất nguồn gốc"
            width={560}
            height={380}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Về AgriTrace AI
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 14px", color: "#1a1a1a", lineHeight: 1.3 }}>
            Minh bạch chuỗi cung ứng, bảo vệ sức khỏe người tiêu dùng
          </h2>
          <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
            AgriTrace AI là hệ thống quản lý toàn diện cho chuỗi cung ứng nông sản sạch. Mỗi lô hàng được gắn mã QR riêng — khi quét, người tiêu dùng thấy ngay thông tin nông trại, ngày thu hoạch, lịch sử vận chuyển và chứng nhận chất lượng.
          </p>
          <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>
            Ngoài ra, hệ thống tích hợp AI chatbot giải đáp thắc mắc về sản phẩm, phân tích xu hướng tiêu thụ và cảnh báo bất thường để người quản lý ra quyết định nhanh và chính xác.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Truy xuất nguồn gốc bằng QR Code",
              "AI chatbot hỗ trợ khách hàng 24/7",
              "Quản lý nông trại, kho, vận chuyển tập trung",
              "Chương trình tích điểm & thăng hạng thành viên",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={16} color="#1a7a3a" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#444" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
const features = [
  { icon: QrCode,       title: "Truy xuất nguồn gốc",    desc: "Quét mã QR để xem thông tin nông trại, ngày thu hoạch, lịch sử vận chuyển và chứng nhận chất lượng của từng lô nông sản.", color: "#1a7a3a" },
  { icon: Bot,          title: "AI Chatbot thông minh",   desc: "Chatbot hỗ trợ giải đáp thắc mắc sản phẩm, gợi ý mua hàng và phân tích xu hướng tiêu thụ dựa trên dữ liệu thực tế.",      color: "#0d6efd" },
  { icon: Leaf,         title: "Quản lý nông trại",       desc: "Quản lý thông tin trang trại, lô sản xuất, mùa vụ, chứng nhận và lịch sử thu hoạch. Hỗ trợ theo dõi trái cây theo mùa.",   color: "#25a050" },
  { icon: Warehouse,    title: "Quản lý kho hàng",        desc: "Kiểm soát nhập kho, xuất kho, tồn kho và bảo quản. Hệ thống cảnh báo khi hàng sắp hết hoặc gần hết hạn.",                   color: "#f59e0b" },
  { icon: Truck,        title: "Theo dõi vận chuyển",     desc: "Cập nhật trạng thái giao hàng theo thời gian thực. Nhà phân phối cập nhật hành trình từ kho đến tay khách hàng.",            color: "#6366f1" },
  { icon: Package,      title: "Đặt hàng & Thanh toán",  desc: "Giỏ hàng, áp voucher, thanh toán trực tuyến. Theo dõi đơn hàng và đánh giá sản phẩm sau khi nhận.",                          color: "#ec4899" },
  { icon: MessageCircle,title: "Chat trực tuyến",         desc: "Khách hàng chat trực tiếp với nông dân và nhân viên hỗ trợ qua WebSocket. Hỗ trợ tư vấn sản phẩm ngay trong lúc mua.",      color: "#0891b2" },
  { icon: Star,         title: "Tích điểm & Thành viên", desc: "Tích điểm sau mỗi đơn hàng. Thăng hạng thành viên Đồng → Bạc → Vàng → Kim Cương. Đổi điểm lấy voucher.",                    color: "#d97706" },
  { icon: BarChart3,    title: "Dashboard báo cáo",       desc: "Biểu đồ thống kê doanh thu, tồn kho, xu hướng tiêu thụ. AI dự đoán nhu cầu giúp lập kế hoạch nhập hàng.",                   color: "#7c3aed" },
];

function Features() {
  return (
    <section id="tinh-nang" style={{ padding: "80px 0", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tính năng
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 12px", color: "#1a1a1a" }}>
            Tất cả công cụ bạn cần trong một nền tảng
          </h2>
          <p style={{ color: "#777", maxWidth: 520, margin: "0 auto", fontSize: 15 }}>
            Quản lý toàn bộ chuỗi cung ứng từ nông trại đến người tiêu dùng, tích hợp AI và QR Code.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 18,
          }}
        >
          {features.map((f) => {
            const IconComp = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: "26px 24px",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: `${f.color}12`,
                    marginBottom: 14,
                  }}
                >
                  <IconComp size={22} color={f.color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
function HowItWorks() {
  const steps = [
    { num: 1, title: "Đăng ký tài khoản",      desc: "Tạo tài khoản với vai trò phù hợp. Hệ thống phân quyền tự động theo từng vai trò.",                                         icon: ShieldCheck },
    { num: 2, title: "Quản lý sản phẩm",        desc: "Nông dân thêm nông trại, tạo lô thu hoạch, gắn chứng nhận chất lượng và sinh mã QR.",                                       icon: Leaf },
    { num: 3, title: "Nhập kho & vận chuyển",   desc: "Nhân viên kho nhập hàng và kiểm tra. Nhà phân phối cập nhật tiến trình giao hàng.",                                          icon: Warehouse },
    { num: 4, title: "Mua hàng & tích điểm",    desc: "Khách hàng đặt hàng, áp voucher, thanh toán. Nhận hàng xong tự động tích điểm và xét thăng hạng.",                          icon: Star },
  ];

  return (
    <section id="quy-trinh" style={{ padding: "80px 0", background: "#fff" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Quy trình
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0", color: "#1a1a1a" }}>
            Vận hành đơn giản, hiệu quả cao
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {steps.map((s, i) => {
            const IconComp = s.icon;
            return (
              <div key={s.num} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {/* Icon circle */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: i === 0 ? "#1a7a3a" : "#f0f7f0",
                    border: i === 0 ? "none" : "1px solid #d4edda",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={22} color={i === 0 ? "#fff" : "#1a7a3a"} strokeWidth={1.8} />
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    background: "#fafbfa",
                    borderRadius: 12,
                    padding: "20px 24px",
                    border: "1px solid #eee",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#1a7a3a", fontWeight: 600, marginBottom: 4 }}>Bước {s.num}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Roles ─── */
const roles = [
  { name: "Admin",           desc: "Quản trị viên",    icon: ShieldCheck, color: "#dc3545", items: ["Quản lý toàn hệ thống", "Phân quyền tài khoản", "Tạo voucher hệ thống", "Báo cáo tổng hợp"] },
  { name: "Farmer",          desc: "Nông dân",          icon: Leaf,        color: "#1a7a3a", items: ["Quản lý nông trại & lô hàng", "Gắn chứng nhận chất lượng", "Trả lời chat khách hàng", "Tạo voucher riêng"] },
  { name: "Warehouse Staff", desc: "Nhân viên kho",     icon: Warehouse,   color: "#0d6efd", items: ["Nhập kho & xuất kho", "Kiểm soát tồn kho", "Cảnh báo hàng hết", "Hỗ trợ chat khách hàng"] },
  { name: "Distributor",     desc: "Nhà phân phối",     icon: Truck,       color: "#f59e0b", items: ["Tiếp nhận hàng hóa", "Cập nhật trạng thái giao", "Theo dõi đơn hàng", "Xác nhận hoàn thành"] },
  { name: "Customer",        desc: "Khách hàng",        icon: Users,       color: "#8b5cf6", items: ["Tìm kiếm & đặt hàng", "Quét QR nguồn gốc", "Tích điểm & thăng hạng", "Chat tư vấn sản phẩm"] },
];

function Roles() {
  return (
    <section id="doi-tuong" style={{ padding: "80px 0", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Đối tượng sử dụng
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 12px", color: "#1a1a1a" }}>
            5 vai trò — 1 hệ thống thống nhất
          </h2>
          <p style={{ color: "#777", maxWidth: 480, margin: "0 auto", fontSize: 15 }}>
            Mỗi vai trò có bộ quyền riêng biệt, phối hợp chặt chẽ trong chuỗi cung ứng.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
          {roles.map((r) => {
            const IconComp = r.icon;
            return (
              <div
                key={r.name}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: "22px 18px",
                  borderTop: `3px solid ${r.color}`,
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    background: `${r.color}12`,
                    marginBottom: 14,
                  }}
                >
                  <IconComp size={20} color={r.color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>{r.name}</h3>
                <p style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>{r.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  {r.items.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#555" }}>
                      <CheckCircle size={13} color={r.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Product highlight ─── */
function ProductHighlight() {
  return (
    <section style={{ padding: "80px 0", background: "#fff" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: 64,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 300 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Nông sản sạch
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 14px", color: "#1a1a1a", lineHeight: 1.3 }}>
            Sản phẩm theo mùa vụ, tươi ngon mỗi ngày
          </h2>
          <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
            Hệ thống tự động gắn nhãn mùa vụ cho nông sản: đang vào mùa, cuối mùa hoặc hết mùa. Sản phẩm được quản lý theo vùng trồng, sản lượng dự kiến và lịch thu hoạch chi tiết.
          </p>
          <p style={{ color: "#666", lineHeight: 1.8, fontSize: 15 }}>
            Người tiêu dùng tìm kiếm sản phẩm theo danh mục, mùa vụ và khu vực — đảm bảo mua được nông sản tươi nhất với giá hợp lý.
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 36px rgba(0,0,0,0.06)" }}>
            <Image
              src="/images/fresh-produce.png"
              alt="Rau củ quả tươi sạch"
              width={560}
              height={400}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Home Blog Preview ─── */
function HomeBlogPreview() {
  const blogs = [
    {
      title: "Ứng Dụng AI Trong Dự Báo Nhu Cầu & Quản Trị Chuỗi Nông Sản 2026",
      tag: "Công nghệ AI",
      date: "14/10/2026",
      desc: "Cách mô hình AI Demand Forecasting giúp giảm 35% hao hụt nông sản và tối ưu kế hoạch thu hoạch.",
    },
    {
      title: "Cẩm Nang Quét Mã QR Truy Xuất Nguồn Gốc Thực Phẩm Cho Mọi Gia Đình",
      tag: "Cẩm nang",
      date: "12/10/2026",
      desc: "Hướng dẫn nhận biết chứng chỉ VietGAP, số hiệu lô hàng và nhật ký vận chuyển qua mã QR.",
    },
    {
      title: "Lịch Trái Cây Mùa Vụ Quý 4: Thời Điểm Vàng Thưởng Thức Cam Sành & Bơ Sáp",
      tag: "Nông sản mùa vụ",
      date: "10/10/2026",
      desc: "Bảng tổng hợp thời điểm thu hoạch rộ của các loại trái cây đặc sản miền Tây và Tây Nguyên.",
    },
  ];

  return (
    <section style={{ padding: "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Tin tức & Kiến thức
            </span>
            <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 0", color: "#1a1a1a" }}>
              Bản Tin Nông Nghiệp & Công Nghệ
            </h2>
          </div>
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#1a7a3a",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Xem tất cả bài viết <ChevronRight size={16} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {blogs.map((b) => (
            <Link
              key={b.title}
              href="/blog"
              style={{
                display: "block",
                background: "#fafbfa",
                border: "1px solid #eee",
                borderRadius: 14,
                padding: "24px 22px",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#e8f5e9", color: "#1a7a3a", padding: "3px 10px", borderRadius: 20 }}>
                  {b.tag}
                </span>
                <span style={{ fontSize: 12, color: "#999" }}>{b.date}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 8, lineHeight: 1.4 }}>
                {b.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.6, margin: 0 }}>
                {b.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Home FAQ ─── */
function HomeFAQ() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const faqs = [
    {
      id: "faq-1",
      q: "Làm thế nào để quét mã QR truy xuất nguồn gốc nông sản?",
      a: "Bạn chỉ cần mở camera điện thoại hoặc truy cập tính năng 'Truy Xuất QR' trên hệ thống, hướng ống kính vào tem QR dán trên sản phẩm để xem ngay nông trại, ngày thu hoạch và chứng chỉ VietGAP.",
    },
    {
      id: "faq-2",
      q: "Trí tuệ nhân tạo (AI) giúp ích gì trong chuỗi cung ứng nông sản?",
      a: "AgriTrace AI tích hợp 3 tính năng AI then chốt: Trợ lý AI chatbot giải đáp thông tin 24/7, AI dự báo nhu cầu thị trường 7 ngày tới, và AI cảnh báo rủi ro tồn kho quá hạn theo chuẩn FEFO.",
    },
    {
      id: "faq-3",
      q: "Chương trình Voucher và Tích điểm thành viên hoạt động thế nào?",
      a: "Mỗi 10,000 VNĐ mua sắm bạn được cộng 1 điểm thưởng để thăng hạng (Đồng, Bạc, Vàng, Kim Cương). Hạng thành viên càng cao, bạn nhận được càng nhiều mã giảm giá và ưu đãi độc quyền.",
    },
    {
      id: "faq-4",
      q: "Nông dân và Hợp tác xã làm thế nào để tham gia bán hàng?",
      a: "Nông dân có thể đăng ký tài khoản với vai trò Farmer, tải lên chứng nhận VietGAP/GlobalGAP để Admin phê duyệt, sau đó bắt đầu tạo lô thu hoạch và in mã QR cho nông sản.",
    },
  ];

  return (
    <section style={{ padding: "80px 24px", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a7a3a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Giải đáp thắc mắc
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 700, margin: "10px 0 12px", color: "#1a1a1a" }}>
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <p style={{ color: "#777", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
            Những câu hỏi phổ biến nhất về cách vận hành hệ thống, công nghệ AI và quy trình truy xuất nguồn gốc.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => {
            const isOpen = openId === f.id;
            return (
              <div
                key={f.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{f.q}</span>
                  <ChevronDown
                    size={18}
                    color={isOpen ? "#1a7a3a" : "#999"}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "0 22px 18px",
                      fontSize: 14,
                      color: "#555",
                      lineHeight: 1.7,
                      borderTop: "1px solid #f3f4f6",
                      paddingTop: 14,
                    }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href="/faq"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#1a7a3a",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Xem tất cả câu hỏi thường gặp <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section style={{ padding: "80px 24px", background: "#1a7a3a" }}>
      <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: "#fff", marginBottom: 14 }}>
          Bắt đầu quản lý nông sản thông minh
        </h2>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.75, marginBottom: 32 }}>
          Đăng ký tài khoản miễn phí và trải nghiệm hệ thống quản lý chuỗi cung ứng nông sản sạch tích hợp AI ngay hôm nay.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              background: "#fff",
              color: "#1a7a3a",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Đăng ký miễn phí <ChevronRight size={16} />
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              background: "transparent",
              color: "#fff",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function HomePage() {
  return (
    <div>
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <ProductHighlight />
      <Roles />
      <HomeBlogPreview />
      <HomeFAQ />
      <CTA />
    </div>
  );
}

