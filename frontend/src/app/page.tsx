"use client";

import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Heart,
  HelpCircle,
  Info,
  Leaf,
  MapPin,
  Package,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Thermometer,
  Truck,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  catalogService,
  ApiCategory,
  ApiProduct,
  ApiVoucher,
} from "@/services/catalog.service";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

/* ── Static Ticker & Hero Words ── */

const ticker = [
  "Lô xà lách thủy canh 500kg thu hoạch sáng nay lúc 05:30 tại Nông Trại Xanh Đà Lạt",
  "Chính vụ: Dâu tây Mộc Châu đạt chuẩn GlobalGAP đã cập bến kho lạnh trung tâm",
  "Vận chuyển: Tuyến xe lạnh 49C-188 đang giao hàng về kho phân phối (4.1°C)",
  "Ưu đãi: Nhập mã AGRI30 giảm ngay 30% cho đơn hàng đầu tiên hôm nay",
  "Minh bạch: 100% nông sản đều có mã QR số hóa truy xuất nguồn gốc",
];

const heroWords = ["Bàn Ăn Gia Đình", "Bữa Cơm An Lành", "Người Tiêu Dùng", "Sức Khỏe Mọi Nhà"];

export default function HomePage() {
  const router = useRouter();
  const [wordIdx, setWordIdx] = useState(0);
  const [tab, setTab] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [modalQty, setModalQty] = useState(1);

  // Live data states loaded from Supabase
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const iv = setInterval(() => setWordIdx((i) => (i + 1) % heroWords.length), 2800);
    return () => clearInterval(iv);
  }, []);

  // Fetch real data from Supabase backend on mount
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const [cats, prods, vous] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts(),
          catalogService.getVouchers(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setVouchers(vous);
      } catch (err) {
        console.error("Error loading real data from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSupabaseData();
  }, []);

  const shown =
    tab === "all" ? products : products.filter((p) => p.categoryCode === tab);

  function handleAddCart(p: ApiProduct, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    addItem(
      {
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        farm: p.origin || p.farm,
        cert: p.cert,
        batchCode: p.batchCode,
        image: p.image,
      },
      1
    );
    toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
  }

  function handleBuyNow(p: ApiProduct, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    addItem(
      {
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        farm: p.origin || p.farm,
        cert: p.cert,
        batchCode: p.batchCode,
        image: p.image,
      },
      modalQty || 1
    );
    router.push("/cart");
  }

  function handleCopyVoucher(code: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ưu đãi: ${code}!`);
      setTimeout(() => setCopiedCode(null), 3000);
    }
  }

  return (
    <div className="bg-[#fbfdfb]">
      {/* ── Ticker chữ chạy ── */}
      <div className="bg-[#0f2e1a] text-emerald-100 py-2 overflow-hidden text-xs border-b border-emerald-900/50">
        <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 sm:px-6">
          <span className="shrink-0 flex items-center gap-1.5 bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Trực tiếp nông trại
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-marquee gap-12">
              {ticker.concat(ticker).map((t, i) => (
                <span key={i} className="inline-block mr-12 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Tiêu chuẩn VietGAP & GlobalGAP
            </span>

            <h1 className="text-3xl sm:text-[46px] font-extrabold text-gray-900 leading-tight tracking-tight">
              Nông Sản Tươi Sạch <br />
              Từ Trang Trại Đến <br />
              <span className="relative inline-block text-emerald-700">
                <span key={wordIdx} className="animate-fade-in-up inline-block">
                  {heroWords[wordIdx]}
                </span>
                <span className="absolute bottom-0.5 left-0 w-full h-2 bg-emerald-200/50 -z-10 rounded" />
              </span>
            </h1>

            <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
              Rau củ quả thu hoạch mỗi sáng tại Đà Lạt & Mộc Châu. Mỗi sản phẩm đều có mã QR truy xuất nguồn gốc
              minh bạch từ nông trại đến tận bàn ăn của bạn.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/products"
                className="group px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                <ShoppingBag size={15} strokeWidth={1.75} />
                <span>Xem Cửa Hàng</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/traceability"
                className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:border-emerald-400 shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <QrCode size={15} strokeWidth={1.75} className="text-emerald-700" />
                <span>Tra Cứu Mã QR</span>
              </Link>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/80 max-w-sm">
              <div>
                <div className="text-lg font-extrabold text-emerald-700">100%</div>
                <div className="text-[11px] text-gray-500">Chuẩn VietGAP</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-amber-600">24 Giờ</div>
                <div className="text-[11px] text-gray-500">Thu Hái & Giao</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-blue-600">QR Code</div>
                <div className="text-[11px] text-gray-500">Truy Xuất Gốc</div>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-up delay-200 rounded-2xl overflow-hidden shadow-xl border-4 border-white group relative">
            <Image
              src="/images/hero-farm.png"
              alt="Nông trại sạch"
              width={640}
              height={420}
              priority
              className="w-full h-[320px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Leaf size={16} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Nông Trại Xanh Mộc Châu</div>
                  <div className="text-[11px] text-gray-500">Nhiệt độ thu hái: 18.5°C · Đạt chuẩn GlobalGAP</div>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang thu hái
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Badges Bar ── */}
      <section className="border-y border-gray-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <ShieldCheck size={20} strokeWidth={2} />,
              color: "text-emerald-700 bg-emerald-50 border-emerald-200",
              t: "100% Chuẩn VietGAP",
              d: "Kiểm định vi sinh, không tồn dư BVTV",
            },
            {
              icon: <Truck size={20} strokeWidth={2} />,
              color: "text-blue-700 bg-blue-50 border-blue-200",
              t: "Chuỗi Xe Lạnh 0 - 5°C",
              d: "Bảo quản khép kín, giao nhanh trong 24H",
            },
            {
              icon: <QrCode size={20} strokeWidth={2} />,
              color: "text-amber-700 bg-amber-50 border-amber-200",
              t: "Truy Xuất Tem QR Số",
              d: "Rõ hộ nông dân, ngày hái & lô kiểm định",
            },
            {
              icon: <Award size={20} strokeWidth={2} />,
              color: "text-purple-700 bg-purple-50 border-purple-200",
              t: "Đổi Trả Uy Tín 24H",
              d: "Hoàn tiền 100% nếu nông sản bị dập nát",
            },
          ].map((b) => (
            <div key={b.t} className="flex items-start gap-3.5 p-2 rounded-xl">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${b.color}`}
              >
                {b.icon}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-gray-900">{b.t}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 py-12">
        {/* ========================================================= */}
        {/* PHẦN 1: DANH MỤC NÔNG SẢN TƯƠI TUYỂN CHỌN (SUPABASE)       */}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Nông sản tươi sạch từ Supabase Database</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                Danh Mục Nông Sản Tuyển Chọn
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Dữ liệu danh mục lưu trữ trực tiếp trên cơ sở dữ liệu Supabase.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
            >
              <span>Xem tất cả danh mục</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link
                key={c.code}
                href={`/products?cat=${c.code}`}
                className="group p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category Thumbnail */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={c.image || "/images/categories/cat-rau.jpg"}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${
                        c.tagColor || "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {c.tag || "Tươi 24h"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{c.description}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                  <span>Khám phá</span>
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-1 transition-transform text-emerald-600"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 2: SẢN PHẨM MỚI THU HOẠCH & FLASH DEALS (SUPABASE)   */}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Clock size={14} className="text-emerald-600" />
                <span>Dữ liệu thực từ Supabase PostgreSQL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                Sản Phẩm Mới Thu Hoạch ({products.length} sản phẩm)
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold text-gray-500 overflow-x-auto">
              {[
                { id: "all", l: "Tất cả" },
                { id: "rau", l: "Rau ăn lá" },
                { id: "cu-qua", l: "Củ quả tươi" },
                { id: "trai-cay", l: "Trái cây vụ này" },
                { id: "nam", l: "Nấm sạch" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    tab === t.id
                      ? "bg-white text-emerald-800 font-bold shadow-xs"
                      : "hover:text-gray-900"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {shown.map((p) => {
              const discountPercent =
                p.oldPrice > p.price
                  ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                  : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Product Image & Badges */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <Image
                        src={p.image || "/images/products/xa-lach.jpg"}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-700 text-white shadow-xs">
                          {p.cert}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-gray-800 shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <QrCode size={11} className="text-emerald-700" />
                          <span>{p.batchCode}</span>
                        </span>
                      </div>

                      {discountPercent > 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          -{discountPercent}%
                        </span>
                      )}

                      {/* Harvest time tag */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{p.harvest}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                          <MapPin size={12} className="text-emerald-600" />
                          <span className="truncate">{p.origin || p.farm}</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                      </div>

                      {/* Rating & Stock */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span className="font-bold text-gray-800">{p.rating}</span>
                          <span className="text-gray-400">({p.reviews})</span>
                        </div>

                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Còn {p.stockLeft} suất
                        </span>
                      </div>

                      {/* Price Section */}
                      <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-extrabold text-emerald-800">
                            {p.price.toLocaleString("vi-VN")} đ
                          </span>
                          <span className="text-xs text-gray-500 font-normal"> / {p.unit}</span>
                          {p.oldPrice > p.price && (
                            <div className="text-[11px] text-gray-400 line-through">
                              {p.oldPrice.toLocaleString("vi-VN")} đ
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleAddCart(p, e)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag size={13} />
                      <span>+ Giỏ</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBuyNow(p, e)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Mua ngay</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 3: HÀNH TRÌNH MINH BẠCH - NÔNG TRẠI ĐẾN BÀN ĂN        */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-br from-emerald-900 via-[#0e2c19] to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mb-8 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold border border-emerald-700">
              <QrCode size={13} />
              Tiêu chuẩn công nghệ số AgriTrace
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hành Trình Minh Bạch Từ Nông Trại Đến Bàn Ăn
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Mỗi sản phẩm đều gắn liền với một mã định danh duy nhất. Quét tem QR để kiểm chứng toàn bộ quá
              trình sinh trưởng, nhiệt độ bảo quản lạnh và hồ sơ an toàn thực phẩm.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Canh Tác Chuẩn VietGAP",
                desc: "Đất trồng và nguồn nước được kiểm nghiệm định kỳ, 100% không sử dụng thuốc trừ sâu cấm.",
                tag: "Nông trại sinh thái",
              },
              {
                step: "02",
                title: "Số Hóa & Cấp Mã QR",
                desc: "Mỗi lô thu hoạch được gán mã định danh số hóa trên blockchain, ghi nhận ngày hái và hộ nông dân.",
                tag: "Tem điện tử chống giả",
              },
              {
                step: "03",
                title: "Chuỗi Lạnh 0°C - 5°C",
                desc: "Vận chuyển bằng xe lạnh chuyên dụng kiểm soát nhiệt độ liên tục theo thời gian thực.",
                tag: "Giữ trọn độ tươi giòn",
              },
              {
                step: "04",
                title: "Giao Nhanh 24H Tận Cửa",
                desc: "Đến tay gia đình bạn chỉ sau vài giờ từ khi hái, cam kết bồi hoàn 100% nếu dập nát.",
                tag: "Tươi ngon từng bữa ăn",
              },
            ].map((st) => (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-emerald-400 group-hover:scale-110 transition-transform inline-block">
                      {st.step}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                      {st.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{st.title}</h3>
                  <p className="text-xs text-emerald-100/70 leading-relaxed">{st.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Đã chuẩn hóa ISO & VietGAP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Bạn có tem QR trên bao bì?</p>
                <p className="text-[11px] text-emerald-200/70">
                  Dùng camera quét hoặc nhập mã lô để xem giấy kiểm nghiệm an toàn.
                </p>
              </div>
            </div>

            <Link
              href="/traceability"
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-md flex items-center gap-1.5"
            >
              <span>Mở Trình Quét QR Truy Xuất</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 4: KHO VOUCHER & MÃ ƯU ĐÃI (SUPABASE)                */}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Tag size={14} className="text-emerald-600" />
                <span>Ưu đãi từ Supabase Database</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                Mã Giảm Giá Hôm Nay
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sao chép mã voucher và nhập tại bước thanh toán để nhận ngay chiết khấu.
              </p>
            </div>

            <Link
              href="/vouchers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
            >
              <span>Xem ví toàn bộ voucher ({vouchers.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {vouchers.map((v) => {
              const isCopied = copiedCode === v.code;

              return (
                <div
                  key={v.code}
                  className="relative p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="absolute top-1/2 -left-2 w-4 h-4 bg-[#fbfdfb] rounded-full border-r border-gray-200 transform -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-2 w-4 h-4 bg-[#fbfdfb] rounded-full border-l border-gray-200 transform -translate-y-1/2" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.badgeColor || "bg-emerald-500 text-white"
                        }`}
                      >
                        {v.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">{v.exp}</span>
                    </div>

                    <div>
                      <div className="text-xl font-black text-emerald-800 tracking-tight">
                        {v.discount}
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 mt-0.5">{v.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{v.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-mono font-bold text-gray-800">
                      {v.code}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(v.code)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                        isCopied
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-200"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Sao chép mã</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* MODAL CHI TIẾT SẢN PHẨM & TRUY XUẤT NHANH                 */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-700 text-white">
                  {selectedProduct.cert}
                </span>
                <span className="text-xs font-bold text-gray-500">Mã lô: {selectedProduct.batchCode}</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProduct.image || "/images/products/xa-lach.jpg"}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                    {selectedProduct.harvest}
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={13} className="text-emerald-600" />
                      <span>{selectedProduct.origin || selectedProduct.farm}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      {selectedProduct.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star size={13} className="fill-amber-400" />
                        <span className="ml-1 font-bold text-gray-800">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-gray-400">· {selectedProduct.reviews} đánh giá</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-2xl font-black text-emerald-800">
                        {selectedProduct.price.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-xs text-gray-500 font-normal"> / {selectedProduct.unit}</span>
                      {selectedProduct.oldPrice > selectedProduct.price && (
                        <div className="text-xs text-gray-400 line-through">
                          {selectedProduct.oldPrice.toLocaleString("vi-VN")} đ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-700">Chọn số lượng:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold text-gray-800 min-w-8 text-center">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        = {(selectedProduct.price * modalQty).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-gray-50 text-xs text-gray-600 leading-relaxed">
                {selectedProduct.description}
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Thông số an toàn & Bảo quản
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Leaf size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Phương pháp canh tác</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.cultivation || "Thủy canh / Hữu cơ VietGAP"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Thermometer size={14} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Nhiệt độ bảo quản lạnh</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.temperature || "2°C - 5°C xe lạnh"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Dư lượng thuốc BVTV</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.pesticide || "Không tồn dư hóa chất (BVTV = 0)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Package size={14} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Đóng gói tiêu chuẩn</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.packaging || "Màng thở vi lỗ bảo quản sinh học"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
              <Link
                href={`/traceability?batch=${selectedProduct.batchCode}`}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:border-emerald-500 bg-white text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <QrCode size={14} className="text-emerald-700" />
                <span>Xem nhật ký QR</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addItem(
                      {
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        price: selectedProduct.price,
                        unit: selectedProduct.unit,
                        farm: selectedProduct.origin || selectedProduct.farm,
                        cert: selectedProduct.cert,
                        batchCode: selectedProduct.batchCode,
                        image: selectedProduct.image,
                      },
                      modalQty
                    );
                    toast.success(
                      `Đã thêm ${modalQty} ${selectedProduct.unit} "${selectedProduct.name}" vào giỏ hàng!`
                    );
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  + Thêm vào giỏ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addItem(
                      {
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        price: selectedProduct.price,
                        unit: selectedProduct.unit,
                        farm: selectedProduct.origin || selectedProduct.farm,
                        cert: selectedProduct.cert,
                        batchCode: selectedProduct.batchCode,
                        image: selectedProduct.image,
                      },
                      modalQty
                    );
                    router.push("/cart");
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>Mua ngay</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
