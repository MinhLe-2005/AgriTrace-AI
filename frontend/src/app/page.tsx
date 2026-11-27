"use client";

import {
  ArrowRight,
  Award,
  Clock,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/stores/toast-store";

/* ── Static Data ── */

const ticker = [
  "🌿 Lô Xà Lách 500kg vừa thu hoạch sáng nay lúc 05:30 tại Nông Trại Xanh Đà Lạt",
  "🍓 CHÍNH VỤ: Dâu tây Mộc Châu đạt chuẩn GlobalGAP đã cập bến kho lạnh",
  "🚚 Xe lạnh 49C-188 đang giao hàng tuyến QL20 → Kho Sóng Thần HCM (4.1°C)",
  "🎁 Nhập mã AGRI30 giảm ngay 30% cho đơn hàng đầu tiên hôm nay",
  "⭐ 100% nông sản đều có mã QR truy xuất nguồn gốc minh bạch",
];

const heroWords = ["Bàn Ăn Gia Đình", "Bữa Cơm An Lành", "Người Tiêu Dùng", "Sức Khỏe Mọi Nhà"];

const categories = [
  { name: "Rau Ăn Lá", icon: "🥗", count: 18, tag: "Bán chạy", tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Củ Quả Tươi", icon: "🥕", count: 24, tag: "Tươi mới", tagColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Trái Cây Mùa Vụ", icon: "🍓", count: 15, tag: "Chính vụ", tagColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Nấm & Hữu Cơ", icon: "🍄", count: 12, tag: "Organic", tagColor: "bg-teal-50 text-teal-700 border-teal-200" },
];

const products = [
  { id: "1", name: "Xà Lách Lô Lô Thủy Canh", price: 35000, oldPrice: 42000, unit: "KG", origin: "Đà Lạt", cert: "VietGAP", rating: 4.9, reviews: 38, harvest: "Sáng nay", image: "/images/fresh-produce.png", cat: "rau" },
  { id: "2", name: "Dâu Tây New Zealand Mộc Châu", price: 180000, oldPrice: 210000, unit: "Hộp 500g", origin: "Mộc Châu", cert: "GlobalGAP", rating: 5.0, reviews: 52, harvest: "Chính vụ", image: "/images/fresh-produce.png", cat: "trai-cay" },
  { id: "3", name: "Cam Sành Hàm Yên Mọng Nước", price: 45000, oldPrice: 55000, unit: "KG", origin: "Tuyên Quang", cert: "VietGAP", rating: 4.8, reviews: 27, harvest: "Hôm qua", image: "/images/fresh-produce.png", cat: "trai-cay" },
  { id: "4", name: "Cà Chua Bi Cherry Đỏ Ngọt", price: 50000, oldPrice: 60000, unit: "KG", origin: "Đà Lạt", cert: "VietGAP", rating: 4.9, reviews: 19, harvest: "Sáng nay", image: "/images/fresh-produce.png", cat: "cu-qua" },
  { id: "5", name: "Cải Xoăn Kale Hữu Cơ", price: 65000, oldPrice: 75000, unit: "KG", origin: "Đà Lạt", cert: "Organic", rating: 4.7, reviews: 15, harvest: "Sáng nay", image: "/images/fresh-produce.png", cat: "rau" },
  { id: "6", name: "Bơ Sáp 034 Cao Nguyên", price: 75000, oldPrice: 90000, unit: "KG", origin: "Bảo Lộc", cert: "VietGAP", rating: 5.0, reviews: 44, harvest: "Hôm qua", image: "/images/fresh-produce.png", cat: "trai-cay" },
];

const vouchers = [
  { code: "AGRI30", title: "Giảm 30% đơn đầu tiên", desc: "Đơn từ 100k · Giảm tối đa 50k", badge: "Khách mới" },
  { code: "FREESHIP", title: "Miễn phí vận chuyển", desc: "Đơn từ 150k · Áp dụng toàn quốc", badge: "Phổ biến" },
  { code: "VIPGOLD", title: "Giảm 50k hội viên Vàng", desc: "Đơn từ 300k · Dành cho Gold", badge: "Đặc quyền" },
];

/* ── Component ── */

export default function HomePage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    const iv = setInterval(() => setWordIdx((i) => (i + 1) % heroWords.length), 2800);
    return () => clearInterval(iv);
  }, []);

  const shown = tab === "all" ? products : products.filter((p) => p.cat === tab);
  const addCart = (n: string) => toast.success(`Đã thêm "${n}" vào giỏ hàng!`);
  const copyCode = (c: string) => { navigator.clipboard?.writeText(c); toast.success(`Đã sao chép mã ${c}!`); };

  return (
    <div>
      {/* ── Ticker chữ chạy ── */}
      <div className="bg-[#10381e] text-emerald-100 py-2 overflow-hidden text-xs">
        <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 sm:px-6">
          <span className="shrink-0 flex items-center gap-1.5 bg-emerald-800 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-marquee gap-12">
              {ticker.concat(ticker).map((t, i) => (
                <span key={i} className="inline-block mr-12 font-medium">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-emerald-50/80 to-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Leaf size={13} className="animate-bounce" /> Nông sản sạch VietGAP & GlobalGAP
            </span>

            <h1 className="text-3xl sm:text-[46px] font-extrabold text-gray-900 leading-tight tracking-tight">
              Nông Sản Tươi Sạch <br />
              Từ Trang Trại Đến <br />
              <span className="relative inline-block text-emerald-700">
                <span key={wordIdx} className="animate-fade-in-up inline-block">{heroWords[wordIdx]}</span>
                <span className="absolute bottom-0.5 left-0 w-full h-2 bg-emerald-200/50 -z-10 rounded" />
              </span>
            </h1>

            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Rau củ quả thu hoạch mỗi sáng tại Đà Lạt & Mộc Châu. Mỗi sản phẩm đều có mã QR truy xuất nguồn gốc minh bạch từ nông trại đến tay bạn.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/products" className="group px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <ShoppingBag size={16} /> Xem Cửa Hàng
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/traceability" className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:border-emerald-400 shadow-xs hover:shadow transition-all flex items-center gap-2">
                <QrCode size={16} className="text-emerald-700" /> Tra Cứu Mã QR
              </Link>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/80 max-w-sm">
              <div><div className="text-lg font-extrabold text-emerald-700">100%</div><div className="text-[11px] text-gray-400">Chuẩn VietGAP</div></div>
              <div><div className="text-lg font-extrabold text-amber-600">24 Giờ</div><div className="text-[11px] text-gray-400">Thu Hái & Giao</div></div>
              <div><div className="text-lg font-extrabold text-blue-600">QR Code</div><div className="text-[11px] text-gray-400">Truy Xuất Gốc</div></div>
            </div>
          </div>

          <div className="animate-fade-in-up delay-200 rounded-2xl overflow-hidden shadow-xl border-4 border-white group">
            <Image src="/images/hero-farm.png" alt="Nông trại sạch" width={640} height={420} priority className="w-full h-[320px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <ShieldCheck size={20} />, color: "text-emerald-700 bg-emerald-50", t: "100% Chuẩn VietGAP", d: "Kiểm định an toàn sinh học" },
            { icon: <Truck size={20} />, color: "text-blue-700 bg-blue-50", t: "Giao Trong 24 Giờ", d: "Xe thùng lạnh chuyên dụng" },
            { icon: <QrCode size={20} />, color: "text-amber-700 bg-amber-50", t: "Mã QR Nguồn Gốc", d: "Minh bạch nông trại & ngày hái" },
            { icon: <Award size={20} />, color: "text-purple-700 bg-purple-50", t: "Đổi Trả 24H", d: "Hoàn 100% nếu không tươi" },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${b.color}`}>{b.icon}</div>
              <div><div className="font-bold text-xs text-gray-800">{b.t}</div><div className="text-[11px] text-gray-400">{b.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14 py-12">

        {/* ── Danh mục (có hover nâng lên) ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Danh Mục Nông Sản</h2>
            <Link href="/products" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">Xem tất cả <ArrowRight size={13} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c, i) => (
              <Link
                key={c.name}
                href="/products"
                className={`card-hover p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-400 group animate-fade-in-up delay-${(i + 1) * 100}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{c.icon}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.tagColor}`}>{c.tag}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-700 transition-colors">{c.name}</h3>
                <div className="text-[11px] text-gray-400 mt-1">{c.count} sản phẩm</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Sản phẩm (hover nâng + zoom ảnh) ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-900">Sản Phẩm Mới Thu Hoạch</h2>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500">
              {[
                { id: "all", l: "Tất cả" }, { id: "rau", l: "🥗 Rau lá" }, { id: "cu-qua", l: "🥕 Củ quả" }, { id: "trai-cay", l: "🍓 Trái cây" },
              ].map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-md transition-all ${tab === t.id ? "bg-white text-emerald-700 font-bold shadow-xs" : "hover:text-gray-700"}`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map((p) => (
              <div key={p.id} className="card-hover bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 overflow-hidden group">
                <div className="relative h-48 bg-gray-50 overflow-hidden">
                  <Image src={p.image} alt={p.name} width={400} height={280} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">{p.cert}</span>
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">-{Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}%</span>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700">
                    <Clock size={11} className="text-emerald-600" />{p.harvest}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <MapPin size={12} className="text-emerald-600" />{p.origin}
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Star size={12} className="text-amber-500" fill="currentColor" />
                    <span className="font-bold text-amber-600">{p.rating}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">{p.reviews} đánh giá</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-emerald-700">{p.price.toLocaleString("vi-VN")}đ</span>
                      <span className="text-[11px] text-gray-400 line-through">{p.oldPrice.toLocaleString("vi-VN")}đ</span>
                      <span className="text-[11px] text-gray-400">/{p.unit}</span>
                    </div>
                    <button onClick={() => addCart(p.name)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white transition-all group/btn" title="Thêm vào giỏ">
                      <ShoppingBag size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Vouchers (hover nâng) ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Mã Giảm Giá</h2>
            <Link href="/vouchers" className="text-xs font-semibold text-emerald-700 hover:underline">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vouchers.map((v) => (
              <div key={v.code} className="card-hover flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-300">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="font-extrabold text-sm text-emerald-700">{v.code}</code>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{v.badge}</span>
                  </div>
                  <div className="font-semibold text-xs text-gray-700">{v.title}</div>
                  <div className="text-[11px] text-gray-400">{v.desc}</div>
                </div>
                <button onClick={() => copyCode(v.code)} className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shrink-0 transition-all active:scale-95">
                  Lưu mã
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quy trình 4 bước (hover nâng) ── */}
        <section className="bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Quy Trình Chuỗi Cung Ứng</h2>
          <p className="text-xs text-gray-500 text-center mb-8">Từ trang trại đến tay người tiêu dùng — minh bạch mọi bước</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: 1, t: "Canh Tác VietGAP", d: "Gieo trồng chuẩn sinh học, ghi nhật ký đồng ruộng chi tiết" },
              { n: 2, t: "Cấp Mã QR Lô Hàng", d: "Mỗi lô thu hoạch được sinh mã QR xác thực nguồn gốc" },
              { n: 3, t: "Kho Lạnh FEFO 4°C", d: "Bảo quản kho mát, xuất hàng theo hạn dùng trước" },
              { n: 4, t: "Giao Tận Nơi", d: "Xe thùng lạnh giao nhanh, giữ trọn độ tươi đến bàn ăn" },
            ].map((s) => (
              <div key={s.n} className="card-hover bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-300 text-center space-y-2 group">
                <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-extrabold group-hover:bg-emerald-700 group-hover:text-white transition-colors">{s.n}</div>
                <h3 className="font-bold text-sm text-gray-800">{s.t}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-emerald-800 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Nông Sản Sạch Mỗi Ngày Cho Gia Đình Bạn</h3>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1">Đăng ký ngay để nhận voucher giảm 30% đơn hàng đầu tiên và tích điểm hội viên.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/products" className="px-5 py-2.5 bg-white text-emerald-800 text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-50 transition-colors">Mua Ngay</Link>
            <Link href="/register" className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-600 hover:bg-emerald-600 transition-colors">Đăng Ký</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
