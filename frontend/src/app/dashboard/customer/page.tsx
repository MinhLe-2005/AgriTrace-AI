"use client";

import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Gift,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Star,
  Tag,
  Thermometer,
  Truck,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

type Order = {
  id: string;
  date: string;
  status: "SHIPPING" | "COMPLETED" | "CANCELLED";
  statusText: string;
  statusBg: string;
  statusColor: string;
  lotCode: string;
  items: {
    name: string;
    origin: string;
    cert: string;
    qty: string;
    price: number;
    image: string;
  }[];
  voucherUsed?: string;
  discount?: number;
  shippingFee: number;
  total: number;
  pointsAwarded: number;
  temperature?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
};

const mockOrders: Order[] = [
  {
    id: "AGRI-8841",
    date: "Hôm nay, 14:15",
    status: "SHIPPING",
    statusText: "Đang giao xe lạnh",
    statusBg: "bg-blue-50 text-blue-700 border-blue-200",
    statusColor: "text-blue-700",
    lotCode: "XL-2026-08",
    temperature: "4.2°C (Chuẩn lạnh FEFO)",
    driverName: "Nguyễn Văn Thắng",
    driverPhone: "0912.888.777",
    vehiclePlate: "49C-188.24",
    items: [
      {
        name: "Xà Lách Lô Lô Thủy Canh",
        origin: "Nông Trại Xanh - Đà Lạt",
        cert: "VietGAP",
        qty: "2 KG",
        price: 70000,
        image: "/images/fresh-produce.png",
      },
      {
        name: "Dâu Tây New Zealand Mộc Châu",
        origin: "HTX Dâu Tây Mộc Châu",
        cert: "GlobalGAP",
        qty: "1 Hộp 500g",
        price: 180000,
        image: "/images/fresh-produce.png",
      },
    ],
    voucherUsed: "AGRI30 (-14.000đ)",
    discount: 14000,
    shippingFee: 0,
    total: 236000,
    pointsAwarded: 28,
  },
  {
    id: "AGRI-8790",
    date: "10/10/2026",
    status: "COMPLETED",
    statusText: "Giao thành công",
    statusBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    statusColor: "text-emerald-700",
    lotCode: "CS-BG-2026-03",
    items: [
      {
        name: "Cam Sành Hàm Yên Mọng Nước",
        origin: "HTX Cam Sành Tuyên Quang",
        cert: "VietGAP",
        qty: "2 KG",
        price: 90000,
        image: "/images/fresh-produce.png",
      },
      {
        name: "Bơ Sáp 034 Cao Nguyên",
        origin: "Nông Trại Bơ Bảo Lộc",
        cert: "VietGAP",
        qty: "1 KG",
        price: 75000,
        image: "/images/fresh-produce.png",
      },
    ],
    shippingFee: 35000,
    total: 200000,
    pointsAwarded: 24,
  },
];

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"ALL" | "SHIPPING" | "COMPLETED">("ALL");
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(5);

  const filteredOrders = mockOrders.filter((ord) => {
    if (tab === "ALL") return true;
    return ord.status === tab;
  });

  return (
    <div className="space-y-6">
      {/* ── Customer Profile Card ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "K"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900">
                  {user?.name || "Khách Hàng Thân Thiết"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Star size={12} className="fill-amber-500 text-amber-500" /> Hội Viên Vàng
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tài khoản: <span className="font-semibold text-gray-700">{user?.email}</span> · Nhận ưu đãi độc quyền nông sản sạch VietGAP
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 text-center">
            <div className="px-2">
              <div className="text-xl font-extrabold text-emerald-700">2</div>
              <div className="text-[11px] text-gray-400 font-medium">Đơn hàng</div>
            </div>
            <div className="px-2">
              <div className="text-xl font-extrabold text-amber-600">248</div>
              <div className="text-[11px] text-gray-400 font-medium">Điểm thưởng</div>
            </div>
            <div className="px-2">
              <div className="text-xl font-extrabold text-blue-600">3</div>
              <div className="text-[11px] text-gray-400 font-medium">Voucher ví</div>
            </div>
          </div>
        </div>

        {/* Quick customer shortcuts */}
        <div className="flex flex-wrap gap-2.5 mt-5 pt-5 border-t border-gray-100">
          <Link
            href="/products"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ShoppingBag size={14} /> Mua Nông Sản Mới
          </Link>
          <Link
            href="/vouchers"
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Gift size={14} /> Kho Voucher & Giảm Giá
          </Link>
          <Link
            href="/loyalty"
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Award size={14} /> Đổi Điểm Thưởng
          </Link>
          <Link
            href="/traceability"
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <QrCode size={14} className="text-emerald-700" /> Quét Mã QR Nông Trại
          </Link>
        </div>
      </div>

      {/* ── Order Status Filter Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Package size={18} className="text-emerald-700" />
          Lịch Sử & Tiến Độ Đơn Đặt Hàng
        </h2>

        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === "ALL" ? "bg-emerald-700 text-white font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tất cả ({mockOrders.length})
          </button>
          <button
            onClick={() => setTab("SHIPPING")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === "SHIPPING" ? "bg-emerald-700 text-white font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Đang giao (1)
          </button>
          <button
            onClick={() => setTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === "COMPLETED" ? "bg-emerald-700 text-white font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Đã nhận (1)
          </button>
        </div>
      </div>

      {/* ── Order Cards ── */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all hover:border-emerald-300"
          >
            {/* Header: Order info & Status */}
            <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold text-sm text-gray-900">#{order.id}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <Clock size={13} /> {order.date}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Lô: {order.lotCode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${order.statusBg}`}>
                  {order.statusText}
                </span>
              </div>
            </div>

            {/* Product items */}
            <div className="p-5 space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-emerald-600" /> {item.origin}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          {item.cert}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Số lượng: {item.qty}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-sm text-gray-900">
                      {item.price.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>
              ))}

              {/* Order total & Rewards */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg">
                  <Award size={14} /> +{order.pointsAwarded} Điểm thưởng hội viên
                  {order.voucherUsed && (
                    <span className="text-purple-700 ml-2">| Mã: {order.voucherUsed}</span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-500">Tổng thanh toán:</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {order.total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-5 py-3.5 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Link
                  href={`/traceability?code=${order.lotCode}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-emerald-400 font-semibold text-gray-700 flex items-center gap-1.5 transition-colors"
                >
                  <QrCode size={13} className="text-emerald-700" /> Tra Cứu Mã Nông Trại
                </Link>

                {order.status === "SHIPPING" && (
                  <button
                    onClick={() => setSelectedOrderTracking(order)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Truck size={13} /> Xem Xe Lạnh Di Chuyển
                  </button>
                )}

                {order.status === "COMPLETED" && (
                  <button
                    onClick={() => setReviewOrder(order.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Star size={13} /> Đánh Giá 5 Sao
                  </button>
                )}
              </div>

              <button
                onClick={() => toast.success(`Đã thêm lại các sản phẩm trong đơn #${order.id} vào giỏ hàng!`)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} /> Mua Lại Đơn Này
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal: Tracking Xe Lạnh Chuỗi Cung Ứng ── */}
      {selectedOrderTracking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-fade-in-up">
            <button
              onClick={() => setSelectedOrderTracking(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Hành Trình Vận Chuyển Xe Lạnh
                </h3>
                <p className="text-xs text-gray-500">Mã đơn: #{selectedOrderTracking.id}</p>
              </div>
            </div>

            {/* IoT & Driver status */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5 text-blue-900">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Thermometer size={14} className="text-blue-600" /> Nhiệt độ thùng xe:
                </span>
                <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {selectedOrderTracking.temperature}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tài xế giao hàng:</span>
                <span className="font-bold">{selectedOrderTracking.driverName} ({selectedOrderTracking.driverPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Biển số xe chuyên dụng:</span>
                <span className="font-bold">{selectedOrderTracking.vehiclePlate}</span>
              </div>
            </div>

            {/* Supply Chain Timeline */}
            <div className="space-y-4 pl-4 border-l-2 border-emerald-500 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                <p className="font-bold text-gray-900">05:30 - Thu hái tại Nông Trại Xanh Đà Lạt</p>
                <p className="text-gray-500 text-[11px]">Đã dán tem kiểm định VietGAP theo quy chuẩn sinh học.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                <p className="font-bold text-gray-900">10:00 - Nhập Kho Lạnh Sóng Thần (HCM)</p>
                <p className="text-gray-500 text-[11px]">Thủ kho kiểm tra cảm biến 4°C và phân loại theo hạn dùng FEFO.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 animate-pulse" />
                <p className="font-bold text-blue-700">14:00 - Đang trên đường giao đến bạn</p>
                <p className="text-gray-500 text-[11px]">Xe thùng lạnh đang cách điểm nhận khoảng 4km. Dự kiến giao 15:30.</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderTracking(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Đánh Giá 5 Sao ── */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-fade-in-up">
            <button
              onClick={() => setReviewOrder(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-gray-900">Đánh Giá Nông Sản Nhận Được</h3>
              <p className="text-xs text-gray-500">Đơn hàng #{reviewOrder}</p>
            </div>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    className={s <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Chia sẻ cảm nhận của bạn về độ tươi giòn, quy cách đóng gói và hương vị nông sản..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 resize-none"
              defaultValue="Rau rất tươi ngon, cuống còn nguyên vị giòn ngọt, đóng gói cẩn thận và có mã QR rõ ràng!"
            />

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Đánh giá đã được gửi và bạn được tặng +10 điểm tích lũy!");
                setReviewOrder(null);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Gửi Đánh Giá (+10 Điểm)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
