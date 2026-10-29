"use client";

import { ClipboardList, Eye, MapPin, Package, Search, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DistributorPageHeader } from "@/components/distributor/distributor-ui";
import { distributorSeedOrders } from "@/features/distributor/mock-data";
import { catalogService, type ApiOrder } from "@/services/catalog.service";

type Filter = "ALL" | "PENDING" | "SHIPPING" | "COMPLETED";

function statusInfo(status: ApiOrder["status"]) {
  if (status === "COMPLETED") return { label: "Đã giao", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "PENDING") return { label: "Chờ xử lý", className: "bg-sky-50 text-sky-700 border-sky-200" };
  return { label: "Đang giao", className: "bg-amber-50 text-amber-800 border-amber-200" };
}

function currency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export default function DistributorOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>(distributorSeedOrders);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    catalogService
      .getOrders()
      .then((result) => {
        if (result.length > 0) setOrders(result);
      })
      .catch(() => {
        // Keep the existing demo data visible when the API is not running.
      });
  }, []);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchedStatus = filter === "ALL" || order.status === filter;
      const matchedQuery =
        !normalized ||
        order.orderCode.toLowerCase().includes(normalized) ||
        order.receiverName.toLowerCase().includes(normalized) ||
        order.lotCode.toLowerCase().includes(normalized);
      return matchedStatus && matchedQuery;
    });
  }, [filter, orders, query]);

  return (
    <div className="space-y-6">
      <DistributorPageHeader
        title="Quản Lý Đơn Hàng"
        description="Theo dõi danh sách đơn được phân công, thông tin giao nhận và chi tiết lô hàng."
        icon={ClipboardList}
        actions={
          <Link
            href="/dashboard/distributor/shipments"
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Truck size={15} /> Tạo chuyến vận chuyển
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-gray-900">Danh sách đơn hàng được phân phối</h2>
            <p className="text-xs text-gray-500 mt-1">Chọn một đơn để xem địa chỉ giao, hàng hóa và hành trình liên quan.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Mã đơn, người nhận, mã lô"
                className="w-full sm:w-56 h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              />
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 outline-none focus:border-amber-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="SHIPPING">Đang giao</option>
              <option value="COMPLETED">Đã giao</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-bold tracking-wide">
                <th className="py-3 px-4">Mã đơn / lô</th>
                <th className="py-3 px-4">Người nhận</th>
                <th className="py-3 px-4">Hàng hóa</th>
                <th className="py-3 px-4">Khung giao</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleOrders.map((order) => {
                const status = statusInfo(order.status);
                return (
                  <tr key={order.orderCode} className="hover:bg-gray-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-amber-900">{order.orderCode}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Lô: {order.lotCode || "Chưa gán"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{order.receiverName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-start gap-1 max-w-[220px]"><MapPin size={12} className="shrink-0 mt-0.5" />{order.receiverAddress}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-800 max-w-[190px] truncate">{order.items.map((item) => item.name).join(", ")}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><Package size={12} />{order.items.length} sản phẩm</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{order.deliverySlot || "Linh hoạt"}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{currency(order.total)}</td>
                    <td className="py-3.5 px-4"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.className}`}>{status.label}</span></td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/dashboard/distributor/orders/${encodeURIComponent(order.orderCode)}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline">
                        <Eye size={13} /> Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleOrders.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Không tìm thấy đơn hàng phù hợp.</p>}
      </div>
    </div>
  );
}
