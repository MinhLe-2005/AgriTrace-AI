"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Package,
  Thermometer,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function WarehousePortalPage() {
  const stockItems = [
    {
      lot: "XL-2026-08",
      name: "Xà Lách Thủy Canh Lô Lô",
      shelf: "Khu A - Kệ 02 (Kho Mát)",
      temp: "4.5°C",
      imported: "14/10/2026",
      expiry: "18/10/2026",
      fefoStatus: "Ưu tiên xuất (Còn 4 ngày)",
      fefoColor: "#10b981",
      stock: "240 kg",
    },
    {
      lot: "KL-2026-05",
      name: "Cải Kale Xoăn",
      shelf: "Khu A - Kệ 05 (Kho Mát)",
      temp: "4.8°C",
      imported: "12/10/2026",
      expiry: "16/10/2026",
      fefoStatus: "CẬN DATE (Còn 2 ngày)",
      fefoColor: "#dc2626",
      stock: "45 kg",
    },
    {
      lot: "DT-MC-2026-11",
      name: "Dâu Tây Giống Nhật Mộc Châu",
      shelf: "Khu B - Tủ Lạnh 01",
      temp: "2.8°C",
      imported: "13/10/2026",
      expiry: "19/10/2026",
      fefoStatus: "Bình thường (Còn 5 ngày)",
      fefoColor: "#3b82f6",
      stock: "180 hộp",
    },
    {
      lot: "CS-BG-2026-03",
      name: "Cam Sành Bố Hạ",
      shelf: "Khu C - Pallet 12 (Kho Thoáng)",
      temp: "18°C",
      imported: "11/10/2026",
      expiry: "25/10/2026",
      fefoStatus: "Tồn kho tốt (Còn 11 ngày)",
      fefoColor: "#10b981",
      stock: "650 kg",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-blue-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-blue-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center text-white">
            <Warehouse size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Cổng Thủ Kho & Quản Lý Tồn Kho (Warehouse Staff)</h1>
              <span className="text-[11px] bg-blue-500/30 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                Chuẩn Lạnh & FEFO
              </span>
            </div>
            <p className="text-xs text-blue-200/80">
              Kiểm soát nhiệt độ kho mát 2-6°C, giám sát hạn sử dụng nông sản và xuất kho ưu tiên FEFO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("Mở phiếu lập Nhập Kho mới!")}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-blue-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <ArrowDownToLine size={14} /> Lập Phiếu Nhập
          </button>
          <button
            onClick={() => toast.success("Mở phiếu lập Xuất Kho theo FEFO!")}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-blue-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <ArrowUpFromLine size={14} /> Xuất Kho FEFO
          </button>
        </div>
      </div>

      {/* Warehouse FEFO Principle Explanation */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Quy tắc xuất kho FEFO (First Expired, First Out):</span> Hệ thống tự động xếp thứ tự ưu tiên các lô có hạn dùng gần nhất để xuất kho trước, đặc biệt đối với trái cây và rau ăn lá có hạn dùng ngắn, giảm thiểu tối đa hao hụt nông sản.
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-blue-700" />
            Bảng Theo Dõi Tồn Kho Theo Lô & Hạn Sử Dụng
          </h3>
          <span className="text-xs text-gray-400">Nhiệt độ cảm biến IoT thời gian thực</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3">Mã Lô</th>
                <th className="py-2.5 px-3">Tên Nông Sản</th>
                <th className="py-2.5 px-3">Vị Trí Kệ</th>
                <th className="py-2.5 px-3">Nhiệt Độ Kho</th>
                <th className="py-2.5 px-3">Số Lượng Tồn</th>
                <th className="py-2.5 px-3">Hạn Dùng (FEFO)</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockItems.map((st) => (
                <tr key={st.lot} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{st.lot}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">{st.name}</td>
                  <td className="py-3 px-3 text-gray-600">{st.shelf}</td>
                  <td className="py-3 px-3 text-blue-800 font-medium">{st.temp}</td>
                  <td className="py-3 px-3 font-extrabold text-gray-900">{st.stock}</td>
                  <td className="py-3 px-3">
                    <span
                      style={{ color: st.fefoColor }}
                      className="font-bold"
                    >
                      {st.fefoStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => toast.info(`Đã chọn lô [${st.lot}] vào lệnh xuất kho ưu tiên FEFO.`)}
                      className="text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      Xuất kho →
                    </button>
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
