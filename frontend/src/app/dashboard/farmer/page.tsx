"use client";

import {
  Calendar,
  CheckCircle2,
  FileCheck,
  Leaf,
  MapPin,
  Package,
  Plus,
  QrCode,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function FarmerPortalPage() {
  const [batches, setBatches] = useState([
    {
      code: "XL-2026-08",
      product: "Xà Lách Thủy Canh Lô Lô",
      harvestDate: "14/10/2026",
      qty: "500 kg",
      status: "Đã duyệt xuất kho",
      statusColor: "#10b981",
      cert: "GlobalGAP",
    },
    {
      code: "KL-2026-05",
      product: "Cải Kale Xoăn",
      harvestDate: "14/10/2026",
      qty: "300 kg",
      status: "Đang lưu kho lạnh",
      statusColor: "#3b82f6",
      cert: "VietGAP",
    },
    {
      code: "DT-2026-02",
      product: "Dâu Tây Giống Nhật",
      harvestDate: "16/10/2026 (Dự kiến)",
      qty: "150 kg",
      status: "Đang chăm sóc",
      statusColor: "#f59e0b",
      cert: "VietGAP",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white">
            <Leaf size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Cổng Nông Dân & Chủ Trang Trại (Farmer Portal)</h1>
              <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Module 2
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              Phụ trách: Member 2 (Quản lý Nông trại, Lô sản xuất/thu hoạch, Hồ sơ canh tác, Chứng nhận VietGAP/GlobalGAP)
            </p>
          </div>
        </div>

        <button
          onClick={() => toast.success("Mở form tạo lô thu hoạch mới!")}
          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={15} /> Tạo Lô Thu Hoạch Mới
        </button>
      </div>

      {/* Farm Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400">Trang trại quản lý:</div>
          <h2 className="text-lg font-extrabold text-gray-900">Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)</h2>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <MapPin size={13} className="text-emerald-600" />
            <span>Xã Xuân Thọ, TP. Đà Lạt • Diện tích canh tác: 4.5 hecta</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-center">
            <div className="text-[10px] text-emerald-700 font-semibold uppercase">Chứng nhận chính</div>
            <div className="text-xs font-bold text-[#1a7a3a]">GlobalGAP #GG-910</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl text-center">
            <div className="text-[10px] text-blue-700 font-semibold uppercase">Lô đang thu hoạch</div>
            <div className="text-xs font-bold text-blue-800">3 Lô hoạt động</div>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-[#1a7a3a]" />
            Danh Sách Lô Sản Xuất & Thu Hoạch Nông Sản
          </h3>
          <span className="text-xs text-gray-400">Tự động gắn mã QR theo lô</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3">Mã Lô</th>
                <th className="py-2.5 px-3">Nông Sản</th>
                <th className="py-2.5 px-3">Ngày Thu Hoạch</th>
                <th className="py-2.5 px-3">Sản Lượng</th>
                <th className="py-2.5 px-3">Chứng Nhận</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Mã QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((b) => (
                <tr key={b.code} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-mono font-bold text-[#1a7a3a]">{b.code}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">{b.product}</td>
                  <td className="py-3 px-3 text-gray-600">{b.harvestDate}</td>
                  <td className="py-3 px-3 font-bold text-gray-800">{b.qty}</td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {b.cert}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      style={{ color: b.statusColor }}
                      className="font-semibold"
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/traceability?batch=${b.code}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a7a3a] hover:underline"
                    >
                      <QrCode size={13} /> Xem QR
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
