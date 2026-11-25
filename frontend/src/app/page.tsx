"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Leaf,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Star,
  Tag,
  Thermometer,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickBuyModal } from "@/components/cart/quick-buy-modal";
import { useEffect, useState, useRef } from "react";
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
  "LÔ #XL-2026-08 · Xà lách thủy canh 500kg thu hoạch lúc 05:30 tại Nông Trại Xanh Đà Lạt (KCS: Đạt)",
  "CHÍNH VỤ · Dâu tây Mộc Châu chuẩn GlobalGAP đã cập bến kho lạnh trung tâm (Nhiệt độ kho: 3.8°C)",
  "LOGISTICS · Tuyến xe lạnh 49C-188.92 đang điều phối về trạm phân phối TP.HCM (4.1°C · Độ ẩm 82%)",
  "ƯU ĐÃI MÙA VỤ · Nhập mã AGRI30 giảm ngay 30% cho đơn hàng nông sản tươi đầu tiên hôm nay",
  "MINH BẠCH GS1 · 100% nông sản xuất vườn đều định danh mã QR độc bản chống giả mạo",
];

const heroWords = ["Bàn Ăn Gia Đình", "Bữa Cơm An Lành", "Người Tiêu Dùng", "Sức Khỏe Mọi Nhà"];

export default function HomePage() {
  const router = useRouter();
  const [wordIdx, setWordIdx] = useState(0);
  const [tab, setTab] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<ApiProduct | null>(null);
  const [quickBuyQty, setQuickBuyQty] = useState(1);
  const [modalQty, setModalQty] = useState(1);
  const [quickQrInput, setQuickQrInput] = useState("AGRI-QR-XL-2026-08-DEMO");

  // Live data states loaded from Supabase
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = useCartStore((s) => s.addItem);
  const productCarouselRef = useRef<HTMLDivElement | null>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [autoSlideDirection, setAutoSlideDirection] = useState<"right" | "left">("right");
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  function scrollProducts(direction: "left" | "right") {
    if (!productCarouselRef.current) return;
    const el = productCarouselRef.current;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 16 : 300;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }

  const shown =
    tab === "all" ? products : products.filter((p) => p.categoryCode === tab);

  // Tự động di chuyển qua về (Ping-Pong Auto-Slide) sau mỗi 3.5 giây, tự tạm dừng khi hover chuột
  useEffect(() => {
    if (isCarouselPaused || shown.length <= 4) return;

    const timer = setInterval(() => {
      const el = productCarouselRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 5) return;

      const cur = el.scrollLeft;
      const firstCard = el.firstElementChild as HTMLElement | null;
      const step = firstCard ? firstCard.offsetWidth + 16 : 300;

      if (autoSlideDirection === "right") {
        if (cur + step >= maxScroll - 15) {
          el.scrollBy({ left: step, behavior: "smooth" });
          setAutoSlideDirection("left");
        } else {
          el.scrollBy({ left: step, behavior: "smooth" });
        }
      } else {
        if (cur - step <= 15) {
          el.scrollBy({ left: -step, behavior: "smooth" });
          setAutoSlideDirection("right");
        } else {
          el.scrollBy({ left: -step, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isCarouselPaused, autoSlideDirection, shown.length]);

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

  function handleBuyNow(p: ApiProduct, qtyOrEvent?: number | React.MouseEvent) {
    if (qtyOrEvent && typeof qtyOrEvent === "object" && "stopPropagation" in qtyOrEvent) {
      qtyOrEvent.stopPropagation();
    }
    const quantity = typeof qtyOrEvent === "number" ? qtyOrEvent : 1;
    setQuickBuyProduct(p);
    setQuickBuyQty(quantity);
    setSelectedProduct(null);
  }

  function handleCopyVoucher(code: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ưu đãi: ${code}!`);
      setTimeout(() => setCopiedCode(null), 3000);
    }
  }

  function handleQuickTrace(e: React.FormEvent) {
    e.preventDefault();
    const code = quickQrInput.trim() || "AGRI-QR-XL-2026-08-DEMO";
    router.push(`/traceability?batch=${encodeURIComponent(code)}`);
  }

  return (
    <div className="bg-[#FBF9F5] text-[#16261E] min-h-screen">
      {/* ── Live Supply Chain Telemetry Strip (Deep Botanical Ink) ── */}
      <div className="bg-[#16261E] text-stone-200 py-2 overflow-hidden text-xs border-b border-stone-800">
        <div className="flex items-center gap-4 max-w-7xl mx-auto px-4 sm:px-6">
          <span className="shrink-0 flex items-center gap-1.5 bg-amber-400/15 text-amber-300 font-mono font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>NHẬT KÝ VỤ MÙA LIVE</span>
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-marquee gap-14">
              {ticker.concat(ticker).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-2.5 mr-14 font-mono text-[11px] text-stone-300">
                  <span className="text-amber-400">◆</span>
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Editorial Hero Section: Warm Alabaster Paper + Botanical Field Dossier ── */}
      <section className="relative overflow-hidden border-b border-[#E4DFD5] pt-8 pb-12 sm:pt-12 sm:pb-16">
        {/* Subtle Architectural Dot Grid in corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 editorial-grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_75%)]"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Editorial Issue Masthead Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-7 border-b border-[#E4DFD5] text-[11px] font-mono text-stone-500">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#16261E] text-amber-300 font-bold">
                CHỨNG THỰC GS1 · VIETGAP
              </span>
              <span>ẤN PHẨM NÔNG NGHIỆP MINH BẠCH · ĐÀ LẠT & MỘC CHÂU</span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <span>NHIỆT ĐỘ CHUỖI LẠNH: <strong className="text-[#166534]">2.0°C – 4.8°C</strong></span>
              <span>·</span>
              <span>KIỂM ĐỊNH KCS: <strong className="text-[#166534]">ISO/IEC 17025</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column (7 cols): Editorial Story & Passport Verification Console */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6 animate-fade-in-up">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFE6] border border-[#E2DDD1] text-[11px] font-bold text-[#166534]">
                  <Sprout size={13} />
                  <span>Thu hoạch lúc 05:30 sáng · Định danh QR từng lô nông sản</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#16261E] leading-[1.13] tracking-tight">
                  Nông Sản Chính Vụ <br />
                  Minh Bạch Từ Đất Mẹ <br />
                  Đến{" "}
                  <span className="relative inline-block text-[#166534] italic">
                    <span key={wordIdx} className="animate-fade-in-up inline-block not-italic font-bold">
                      {heroWords[wordIdx]}
                    </span>
                    <span className="absolute -bottom-1 left-0 w-full h-2 bg-amber-300/45 -z-10 rounded-xs" />
                  </span>
                </h1>

                <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
                  Không chỉ là cửa hàng rau củ — <strong className="text-[#16261E] font-semibold">AgriTrace AI</strong> là hồ sơ sinh thái sống của từng bó rau, trái ngọt. Quét mã QR độc bản để tra cứu hộ nông dân canh tác, dư lượng BVTV bằng 0 và hành trình xe lạnh <strong className="text-[#16261E] font-semibold">2°C – 5°C</strong> đến tận tay bạn.
                </p>
              </div>

              {/* Dual Tactile CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="group px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#16261E] hover:bg-[#166534] shadow-sm transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
                >
                  <ShoppingBag size={16} className="text-amber-300" />
                  <span>Đặt Mua Nông Sản Sáng Nay</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/traceability"
                  className="group px-5 py-3.5 rounded-xl text-sm font-bold text-[#16261E] bg-white hover:bg-[#F3EFE6] border border-[#D8D2C5] shadow-2xs transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <QrCode size={16} className="text-[#A3630A]" />
                  <span>Mở Trình Quét QR</span>
                </Link>
              </div>

              {/* Interactive "Hộ Chiếu Nông Sản Số" (Digital Lot Passport Console) */}
              <div className="rounded-2xl bg-white border border-[#E4DFD5] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <QrCode size={13} className="text-[#166534]" />
                    <span>TRA CỨU NHANH HỘ CHIẾU LÔ NÔNG SẢN (LOT PASSPORT)</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ● Blockchain & KCS Verified
                  </span>
                </div>

                <form
                  onSubmit={handleQuickTrace}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5] focus-within:border-[#166534]">
                    <span className="font-mono text-[11px] font-bold text-stone-400 select-none">MÃ LÔ:</span>
                    <input
                      id="quick-qr-input"
                      type="text"
                      value={quickQrInput}
                      onChange={(e) => setQuickQrInput(e.target.value)}
                      placeholder="Nhập mã lô (VD: AGRI-QR-XL-2026-08-DEMO)..."
                      className="w-full text-xs font-mono font-bold text-[#16261E] bg-transparent outline-none placeholder:text-stone-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#A3630A] hover:bg-[#875006] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <span>Kiểm Chứng Hồ Sơ</span>
                    <ArrowUpRight size={14} />
                  </button>
                </form>

                {/* Ledger Specs Row */}
                <div className="grid grid-cols-3 divide-x divide-[#E4DFD5] pt-2 border-t border-[#F0ECE1] text-center sm:text-left">
                  <div className="pr-3">
                    <div className="font-mono text-xs sm:text-sm font-extrabold text-[#16261E]">0.00 ppm</div>
                    <div className="text-[10px] text-stone-500">Dư lượng thuốc BVTV</div>
                  </div>
                  <div className="px-3">
                    <div className="font-mono text-xs sm:text-sm font-extrabold text-[#166534]">&lt; 18 Giờ</div>
                    <div className="text-[10px] text-stone-500">Từ vườn về bàn ăn</div>
                  </div>
                  <div className="pl-3">
                    <div className="font-mono text-xs sm:text-sm font-extrabold text-[#A3630A]">100% FEFO</div>
                    <div className="text-[10px] text-stone-500">Xuất kho theo độ tươi</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Asymmetric Botanical Dossier Bento */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 animate-fade-in-up delay-150">
              {/* Main Specimen Photograph Card */}
              <div className="col-span-2 relative rounded-2xl overflow-hidden border border-[#E4DFD5] bg-white p-2 shadow-sm group">
                <div className="relative h-[250px] sm:h-[275px] rounded-xl overflow-hidden">
                  <Image
                    src="/images/hero-farm.png"
                    alt="Nông trại sinh thái AgriTrace Đà Lạt & Mộc Châu"
                    width={640}
                    height={420}
                    priority
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16261E]/85 via-transparent to-transparent" />

                  {/* Top Dossier Tag */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FBF9F5]/95 backdrop-blur-md text-[#16261E] font-mono text-[10px] font-bold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-ping" />
                      <span>TRẠM CANH TÁC #DL-04 · LÂM ĐỒNG</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#16261E]/90 text-amber-300 font-mono text-[10px] font-bold">
                      1,500m ASL
                    </span>
                  </div>

                  {/* Bottom Specimen Caption */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                        HỒ SƠ NÔNG TRẠI TIÊU BIỂU
                      </p>
                      <h3 className="font-serif text-base sm:text-lg font-bold leading-snug">
                        Nông Trại Sinh Thái Đà Lạt & Mộc Châu
                      </h3>
                      <p className="text-[11px] text-stone-200">
                        Nhiệt độ nhà màng: 18.5°C · Độ ẩm: 78% · Nước tưới RO
                      </p>
                    </div>
                    <Link
                      href="/traceability"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#FBF9F5] text-[#16261E] hover:bg-amber-300 transition-colors shrink-0"
                    >
                      Hồ sơ QR →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom-Left Bento Card: Cold Chain Telemetry Log */}
              <div className="bento-card p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-[#F6F3EC] text-[#16261E] border border-[#E4DFD5] flex items-center justify-center">
                    <Thermometer size={16} className="text-[#166534]" />
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200">
                    4.1°C · LIVE
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                    COLD-CHAIN TELEMETRY
                  </div>
                  <div className="text-xs font-extrabold text-[#16261E] mt-0.5">
                    Chuỗi Kho & Xe Lạnh 24/7
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                    Giám sát nhiệt độ & hạn dùng FEFO theo từng lô thu hái.
                  </p>
                </div>
              </div>

              {/* Bottom-Right Bento Card: Harvest Ochre Voucher Stamp */}
              <Link
                href="/vouchers"
                className="bento-card p-4 flex flex-col justify-between bg-[#16261E] text-white border-[#16261E] hover:border-amber-400 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                    <Tag size={16} />
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-300 text-[#16261E]">
                    -30% VỤ MÙA
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                    MÃ TRỢ GIÁ NÔNG SẢN
                  </div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5 flex items-center justify-between">
                    <span className="font-mono text-sm">AGRI30</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                    Ưu đãi trực tiếp cho đơn hàng nông sản sạch đầu tiên.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architectural Quality Charter Strip (4 Columns with Hairline Dividers) ── */}
      <section className="border-b border-[#E4DFD5] bg-[#F6F3EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4DFD5]">
          {[
            {
              code: "TIÊU CHUẨN 01",
              icon: <ShieldCheck size={18} strokeWidth={2} className="text-[#166534]" />,
              t: "100% Chuẩn VietGAP & GlobalGAP",
              d: "Kiểm nghiệm vi sinh định kỳ, cam kết 0% tồn dư hóa chất BVTV",
            },
            {
              code: "TIÊU CHUẨN 02",
              icon: <Truck size={18} strokeWidth={2} className="text-[#166534]" />,
              t: "Chuỗi Lạnh Khép Kín 2°C – 5°C",
              d: "Bảo quản kho lạnh FEFO, vận chuyển xe lạnh chuyên dụng trong 24H",
            },
            {
              code: "TIÊU CHUẨN 03",
              icon: <QrCode size={18} strokeWidth={2} className="text-[#A3630A]" />,
              t: "Tem QR Truy Xuất Độc Bản",
              d: "Minh bạch hộ nông dân, giờ thu hái, nhật ký phân bón & chứng nhận KCS",
            },
            {
              code: "TIÊU CHUẨN 04",
              icon: <Award size={18} strokeWidth={2} className="text-[#A3630A]" />,
              t: "Bảo Chứng Đổi Trả 1-Đổi-1",
              d: "Hoàn tiền 100% trong 24H nếu rau củ dập nát hoặc sai lệch độ tươi",
            },
          ].map((b, idx) => (
            <div
              key={b.t}
              className={cn(
                "py-5 flex items-start gap-3.5",
                idx === 0 ? "sm:pr-5" : idx === 3 ? "sm:pl-5" : "sm:px-5"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E4DFD5] flex items-center justify-center shrink-0 shadow-2xs">
                {b.icon}
              </div>
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">
                  {b.code}
                </span>
                <div className="font-bold text-xs sm:text-sm text-[#16261E] mt-0.5">{b.t}</div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 py-12 sm:py-16">
        {/* ========================================================= */}
        {/* PHẦN 1: DANH MỤC NÔNG SẢN TƯƠI TUYỂN CHỌN (BOTANICAL GRID)*/}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-7 border-b border-[#E4DFD5]">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#166534] flex items-center gap-1.5">
                <span>CHUYÊN MỤC 01</span>
                <span>·</span>
                <span>PHÂN LOẠI NÔNG SẢN CHÍNH VỤ</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#16261E] mt-1">
                Danh Mục Nông Sản Tuyển Chọn
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E4DFD5] text-xs font-bold text-[#16261E] hover:bg-[#16261E] hover:text-white transition-all shadow-2xs shrink-0"
            >
              <span>Xem toàn bộ danh mục</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading && categories.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bento-card p-3.5 h-56 animate-pulse flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full rounded-xl bg-stone-200/70" />
                    <div className="h-3 w-3/4 rounded bg-stone-200/70" />
                    <div className="h-2.5 w-1/2 rounded bg-stone-200/60" />
                  </div>
                ))
              : categories.map((c, idx) => (
              <Link
                key={c.code}
                href={`/products?cat=${c.code}`}
                className="bento-card group p-3.5 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Category Thumbnail */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F6F3EC] border border-[#EFECE4]">
                    <Image
                      src={c.image || "/images/categories/cat-rau.jpg"}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#FBF9F5]/95 text-[#16261E] border border-[#E4DFD5] shadow-2xs">
                      0{idx + 1} · {c.tag || "Tươi 24h"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#16261E] group-hover:text-[#166534] transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{c.description}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] font-bold text-[#166534]">
                  <span>Khám phá</span>
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 2: SẢN PHẨM MỚI THU HOẠCH (BOTANICAL SPECIMEN CARDS) */}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 mb-7 border-b border-[#E4DFD5]">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#A3630A] flex items-center gap-1.5">
                <Clock size={12} />
                <span>CHUYÊN MỤC 02 · THU HOẠCH LÚC 05:30 SÁNG NAY · BẢO QUẢN LẠNH 2°C – 5°C</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#16261E] mt-1">
                Nông Sản Tươi Mới Trong Ngày ({products.length} lô)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD5] rounded-xl text-xs font-semibold text-stone-600 overflow-x-auto">
                {[
                  { id: "all", l: "Tất cả lô" },
                  { id: "rau", l: "Rau ăn lá" },
                  { id: "cu-qua", l: "Củ quả tươi" },
                  { id: "trai-cay", l: "Trái cây vụ này" },
                  { id: "nam", l: "Nấm hữu cơ" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      tab === t.id
                        ? "bg-[#16261E] text-white font-bold shadow-2xs"
                        : "hover:text-[#16261E] hover:bg-white/60"
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              {/* Prev / Next Carousel Controls */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#166534] border border-emerald-200 text-[10px] font-mono font-bold mr-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCarouselPaused ? 'bg-amber-500' : 'bg-emerald-600 animate-pulse'}`} />
                  <span>{isCarouselPaused ? "Tạm dừng khi rê chuột" : "Tự động trượt qua về"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    scrollProducts("left");
                    setAutoSlideDirection("left");
                  }}
                  className="w-9 h-9 rounded-xl bg-white border border-[#E4DFD5] text-[#16261E] hover:text-white hover:bg-[#16261E] flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Quay lui sang trái"
                  aria-label="Quay lui"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    scrollProducts("right");
                    setAutoSlideDirection("right");
                  }}
                  className="w-9 h-9 rounded-xl bg-white border border-[#E4DFD5] text-[#16261E] hover:text-white hover:bg-[#16261E] flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Quay tới sang phải"
                  aria-label="Quay tới"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel container with 4 cards per frame on desktop & Ping-Pong Auto-Play */}
          <div
            className="relative group/carousel"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Floating Side Left Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollProducts("left");
                setAutoSlideDirection("left");
              }}
              className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-[#E4DFD5] text-[#16261E] hover:bg-[#16261E] hover:text-white items-center justify-center shadow-md transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer active:scale-95"
              title="Trượt về bên trái"
              aria-label="Trượt trái"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Floating Side Right Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollProducts("right");
                setAutoSlideDirection("right");
              }}
              className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-[#E4DFD5] text-[#16261E] hover:bg-[#16261E] hover:text-white items-center justify-center shadow-md transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer active:scale-95"
              title="Trượt sang bên phải"
              aria-label="Trượt phải"
            >
              <ChevronRight size={20} />
            </button>

            {/* Horizontal Scroll Track - 4 cards visible per frame on LG */}
            <div
              ref={productCarouselRef}
              onScroll={() => {
                const el = productCarouselRef.current;
                if (!el) return;
                const firstCard = el.firstElementChild as HTMLElement | null;
                const step = firstCard ? firstCard.offsetWidth + 16 : 300;
                const idx = Math.round(el.scrollLeft / step);
                setActiveSlideIdx(Math.max(0, idx));
              }}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {shown.map((p) => {
                const discountPercent =
                  p.oldPrice > p.price
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : 0;

                const displayBatch = p.batchCode || (p.id ? `LÔ-${p.id.slice(0, 5).toUpperCase()}` : "AGRI-01");

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="bento-card w-[84%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 snap-start group overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-md"
                  >
                    <div>
                      {/* Top Specimen Header Bar */}
                      <div className="px-3 py-2 bg-[#FBF9F5] border-b border-[#EFECE4] flex items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="font-bold text-[#166534] flex items-center gap-1 whitespace-nowrap truncate">
                          <QrCode size={11} className="shrink-0" />
                          <span className="truncate">LÔ #{displayBatch}</span>
                        </span>
                        <span className="font-bold text-stone-500 whitespace-nowrap shrink-0">
                          CHỨNG NHẬN: <strong className="text-[#16261E]">{p.cert}</strong>
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="relative h-48 bg-[#F6F3EC] overflow-hidden">
                        <Image
                          src={p.image || "/images/products/xa-lach.jpg"}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 84vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {discountPercent > 0 && (
                          <span className="absolute top-2.5 right-2.5 font-mono px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#A3630A] text-white shadow-xs">
                            -{discountPercent}%
                          </span>
                        )}

                        {/* Harvest time tag */}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16261E]/85 backdrop-blur-md text-stone-100 text-[10px] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{p.harvest}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-1">
                            <MapPin size={12} className="text-[#166534] shrink-0" />
                            <span className="truncate font-medium">{p.origin || p.farm}</span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-[#16261E] group-hover:text-[#166534] transition-colors line-clamp-1 capitalize">
                            {p.name}
                          </h3>
                        </div>

                        {/* Rating & Stock */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span className="font-bold text-[#16261E]">{p.rating}</span>
                            <span className="text-stone-400">({p.reviews})</span>
                          </div>

                          <span className="font-mono text-[10px] text-[#166534] font-bold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                            CÒN {p.stockLeft} SUẤT
                          </span>
                        </div>

                        {/* Price Section */}
                        <div className="pt-2.5 border-t border-[#F0ECE1] flex items-baseline justify-between">
                          <div>
                            <span className="font-mono text-lg font-extrabold text-[#16261E]">
                              {p.price.toLocaleString("vi-VN")} đ
                            </span>
                            <span className="text-xs text-stone-500 font-medium"> / {p.unit}</span>
                            {p.oldPrice > p.price && (
                              <span className="ml-2 font-mono text-[11px] text-stone-400 line-through">
                                {p.oldPrice.toLocaleString("vi-VN")} đ
                              </span>
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
                        className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#16261E] bg-[#F6F3EC] hover:bg-[#EAE5D9] border border-[#E4DFD5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag size={13} />
                        <span>+ Giỏ hàng</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleBuyNow(p, e)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#166534] hover:bg-[#14532D] shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Mua ngay</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Dots */}
            {shown.length > 4 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {Array.from({ length: shown.length - 3 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const el = productCarouselRef.current;
                      if (!el) return;
                      const firstCard = el.firstElementChild as HTMLElement | null;
                      const step = firstCard ? firstCard.offsetWidth + 16 : 300;
                      el.scrollTo({ left: i * step, behavior: "smooth" });
                      setActiveSlideIdx(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                      activeSlideIdx === i
                        ? "w-7 bg-[#166534]"
                        : "w-2 bg-[#D5CEC2] hover:bg-stone-400"
                    )}
                    title={`Xem nhóm nông sản ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Editorial Callout Banner */}
          <div className="mt-3 bento-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F6F3EC]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#16261E] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#16261E]">
                  Kho Nông Sản Thực Thực Tế ({products.length} mặt hàng chính vụ)
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Đầy đủ rau ăn lá thủy canh, củ quả tươi, trái cây vụ mùa và nấm sạch thu hoạch trực tiếp tại vườn mỗi sáng.
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#16261E] hover:bg-[#166534] text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Xem toàn bộ cửa hàng</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 3: HÀNH TRÌNH MINH BẠCH - NÔNG TRẠI ĐẾN BÀN ĂN        */}
        {/* ========================================================= */}
        <section className="bg-[#16261E] rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden border border-stone-800">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-8 border-b border-white/10">
            <div className="max-w-2xl space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-400/30">
                <QrCode size={12} />
                <span>CHUYÊN MỤC 03 · GIAO THỨC TRUY XUẤT NGUỒN GỐC SỐ HÓA</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight">
                4 Chốt Kiểm Định Từ Đất Mẹ Đến Bàn Ăn
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Mỗi sản phẩm đều gắn liền với một mã định danh QR duy nhất. Quét tem để kiểm chứng toàn bộ quá
                trình sinh trưởng, kiểm định KCS, nhiệt độ bảo quản lạnh và lộ trình vận chuyển.
              </p>
            </div>

            <Link
              href="/traceability"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#16261E] text-xs font-extrabold transition-all shadow-md shrink-0"
            >
              <QrCode size={15} />
              <span>Trình Quét QR Truy Xuất</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "CHỐT 01",
                title: "Canh Tác Sinh Thái VietGAP",
                desc: "Đất trồng và nguồn nước được kiểm nghiệm định kỳ, 100% không sử dụng thuốc trừ sâu hóa học cấm.",
                tag: "Tại Nông Trại",
              },
              {
                step: "CHỐT 02",
                title: "Thẩm Định KCS & Cấp Tem QR",
                desc: "Mỗi lô thu hoạch được thẩm định tiêu chuẩn ISO 17025, ghi nhận ngày hái và hộ nông dân phụ trách.",
                tag: "Kiểm Định Lô",
              },
              {
                step: "CHỐT 03",
                title: "Kho Lạnh FEFO & Xe Lạnh 4°C",
                desc: "Điều phối xuất kho tự động theo chuẩn FEFO và vận chuyển bằng xe lạnh giám sát nhiệt độ liên tục.",
                tag: "Chuỗi Lạnh 24/7",
              },
              {
                step: "CHỐT 04",
                title: "Giao Tận Cửa & Đối Soát QR",
                desc: "Đến tay gia đình bạn chỉ sau vài giờ từ khi thu hái, quét mã trên bao bì để đối soát toàn bộ lịch sử.",
                tag: "Bàn Ăn Gia Đình",
              },
            ].map((st) => (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 flex flex-col justify-between hover:bg-white/[0.09] hover:border-amber-300/40 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-extrabold text-amber-300 tracking-wider">
                      {st.step}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-stone-200">
                      {st.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-white mb-2">{st.title}</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">{st.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>VERIFIED ON AGRITRACE</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHẦN 4: KHO VOUCHER & MÃ ƯU ĐÃI NÔNG SẢN (HARVEST COUPONS)*/}
        {/* ========================================================= */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-7 border-b border-[#E4DFD5]">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#A3630A] flex items-center gap-1.5">
                <Tag size={12} />
                <span>CHUYÊN MỤC 04 · PHIẾU TRỢ GIÁ NÔNG SẢN TRỰC TIẾP TỪ VƯỜN</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#16261E] mt-1">
                Mã Giảm Giá & Trợ Giá Mùa Vụ
              </h2>
            </div>

            <Link
              href="/vouchers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E4DFD5] text-xs font-bold text-[#16261E] hover:bg-[#16261E] hover:text-white transition-all shadow-2xs shrink-0"
            >
              <span>Xem ví toàn bộ voucher ({vouchers.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vouchers.map((v) => {
              const isCopied = copiedCode === v.code;

              return (
                <div
                  key={v.code}
                  className="bento-card relative p-5 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#16261E] text-amber-300">
                        {v.badge}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-stone-500">
                        HSD: {v.exp}
                      </span>
                    </div>

                    <div>
                      <div className="font-mono text-2xl font-black text-[#166534] tracking-tight">
                        {v.discount}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-[#16261E] mt-1">{v.title}</h3>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{v.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-dashed border-[#D8D2C5] flex items-center justify-between gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-[#F6F3EC] border border-[#E4DFD5] text-xs font-mono font-bold text-[#16261E]">
                      {v.code}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(v.code)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        isCopied
                          ? "bg-[#166534] text-white"
                          : "bg-[#16261E] text-white hover:bg-[#A3630A]"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Sao chép</span>
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
        <div
          onClick={() => setSelectedProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in cursor-pointer"
        >
          <div
            className="relative w-full max-w-2xl bg-[#FBF9F5] rounded-3xl shadow-2xl border border-[#E4DFD5] overflow-hidden max-h-[92vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="p-4 sm:p-5 border-b border-[#E4DFD5] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-extrabold bg-[#16261E] text-amber-300">
                  {selectedProduct.cert}
                </span>
                <span className="text-xs font-mono font-bold text-stone-600">
                  MÃ LÔ: #{selectedProduct.batchCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Đóng chi tiết sản phẩm"
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#E4DFD5]">
                  <Image
                    src={selectedProduct.image || "/images/products/xa-lach.jpg"}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#16261E]/85 backdrop-blur-md text-white text-[11px] font-mono">
                    {selectedProduct.harvest}
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin size={13} className="text-[#166534]" />
                      <span className="font-medium">{selectedProduct.origin || selectedProduct.farm}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#16261E] leading-snug">
                      {selectedProduct.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star size={13} className="fill-amber-400" />
                        <span className="ml-1 font-bold text-[#16261E]">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-stone-400">· {selectedProduct.reviews} đánh giá</span>
                    </div>

                    <div className="pt-2">
                      <span className="font-mono text-2xl font-black text-[#166534]">
                        {selectedProduct.price.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-xs text-stone-500 font-normal"> / {selectedProduct.unit}</span>
                      {selectedProduct.oldPrice > selectedProduct.price && (
                        <div className="font-mono text-xs text-stone-400 line-through">
                          {selectedProduct.oldPrice.toLocaleString("vi-VN")} đ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-2 pt-2 border-t border-[#E4DFD5]">
                    <span className="text-xs font-bold text-[#16261E]">Chọn số lượng:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#D8D2C5] bg-white rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="px-3 py-1.5 hover:bg-stone-100 text-stone-700 text-sm font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 font-mono text-xs font-bold text-[#16261E] min-w-8 text-center">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="px-3 py-1.5 hover:bg-stone-100 text-stone-700 text-sm font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#166534]">
                        = {(selectedProduct.price * modalQty).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4DFD5] text-xs text-stone-700 leading-relaxed">
                {selectedProduct.description}
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Hồ Sơ Kỹ Thuật & Bảo Quản Chuỗi Lạnh
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl border border-[#E4DFD5] bg-white flex items-center gap-2.5">
                    <Leaf size={15} className="text-[#166534] shrink-0" />
                    <div>
                      <div className="text-[10px] text-stone-400">Phương pháp canh tác</div>
                      <div className="font-bold text-[#16261E]">
                        {selectedProduct.cultivation || "Thủy canh / Hữu cơ VietGAP"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E4DFD5] bg-white flex items-center gap-2.5">
                    <Thermometer size={15} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-stone-400">Nhiệt độ bảo quản lạnh</div>
                      <div className="font-bold text-[#16261E]">
                        {selectedProduct.temperature || "2°C - 5°C xe lạnh"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E4DFD5] bg-white flex items-center gap-2.5">
                    <ShieldCheck size={15} className="text-[#166534] shrink-0" />
                    <div>
                      <div className="text-[10px] text-stone-400">Dư lượng thuốc BVTV</div>
                      <div className="font-bold text-[#16261E]">
                        {selectedProduct.pesticide || "Không tồn dư hóa chất (BVTV = 0)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E4DFD5] bg-white flex items-center gap-2.5">
                    <Package size={15} className="text-[#A3630A] shrink-0" />
                    <div>
                      <div className="text-[10px] text-stone-400">Đóng gói tiêu chuẩn</div>
                      <div className="font-bold text-[#16261E]">
                        {selectedProduct.packaging || "Màng thở vi lỗ bảo quản sinh học"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-[#E4DFD5] bg-white flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/traceability?batch=${selectedProduct.batchCode}`}
                className="px-4 py-2.5 rounded-xl border border-[#D8D2C5] hover:border-[#16261E] bg-[#FBF9F5] text-[#16261E] text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <QrCode size={14} className="text-[#166534]" />
                <span>Xem hồ sơ QR</span>
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
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#16261E] bg-[#F3EFE6] hover:bg-[#E5E0D4] border border-[#D8D2C5] transition-colors cursor-pointer"
                >
                  + Thêm vào giỏ
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyNow(selectedProduct, modalQty)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#166534] hover:bg-[#14532D] shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Mua ngay</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mua Ngay Siêu Tốc Modal */}
      <QuickBuyModal
        isOpen={!!quickBuyProduct}
        onClose={() => setQuickBuyProduct(null)}
        product={quickBuyProduct}
        initialQty={quickBuyQty}
      />
    </div>
  );
}
