"use client";

import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DistributorPageHeader } from "@/components/distributor/distributor-ui";
import { distributorSeedOrders } from "@/features/distributor/mock-data";
import { subscribeToDistributorChanges } from "@/features/distributor/realtime";
import { catalogService, type ApiOrder } from "@/services/catalog.service";
import { distributorService } from "@/services/distributor.service";

function money(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DistributorOrderDetailPage() {
  const params = useParams<{ orderCode: string }>();
  const orderCode = decodeURIComponent(params.orderCode);
  const [orders, setOrders] = useState<ApiOrder[]>(distributorSeedOrders);
  const [shipments, setShipments] = useState<
    Awaited<ReturnType<typeof distributorService.getShipments>>
  >([]);

  useEffect(() => {
    catalogService
      .getOrders()
      .then((result) => result.length > 0 && setOrders(result))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const refresh = () =>
      distributorService
        .getShipments()
        .then(setShipments)
        .catch(() => undefined);
    void refresh();
    return subscribeToDistributorChanges(refresh);
  }, []);

  const order = useMemo(
    () => orders.find((item) => item.orderCode === orderCode),
    [orderCode, orders]
  );
  const shipment = useMemo(
    () => shipments.find((item) => item.orderCodes.includes(orderCode)),
    [orderCode, shipments]
  );

  if (!order) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/distributor/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
        >
          <ArrowLeft size={15} /> Quay lại danh sách đơn
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Không tìm thấy đơn hàng <strong>{orderCode}</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/distributor/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
        >
          <ArrowLeft size={15} /> Quay lại danh sách đơn
        </Link>
      </div>
      <DistributorPageHeader
        title={`Đơn hàng ${order.orderCode}`}
        description={`Lô hàng ${order.lotCode || "chưa gán"} • ${order.items.length} sản phẩm`}
        icon={Package}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="shadow-xs overflow-hidden rounded-2xl border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">
              Sản phẩm trong đơn
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex justify-between gap-4 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.qty} · {item.origin || "Nguồn gốc đang cập nhật"}
                  </p>
                  {item.cert && (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {item.cert}
                    </span>
                  )}
                </div>
                <p className="whitespace-nowrap text-sm font-bold text-gray-900">
                  {money(item.price)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-gray-100 bg-gray-50 p-4 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{money(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Giảm giá</span>
              <span>-{money(order.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-900">
              <span>Tổng thanh toán</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin size={16} className="text-amber-700" /> Thông tin giao
              nhận
            </h2>
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <p>
                <strong className="text-gray-900">{order.receiverName}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" />
                {order.receiverPhone}
              </p>
              <p className="leading-relaxed">{order.receiverAddress}</p>
              <p className="border-t border-gray-100 pt-2">
                <span className="text-gray-400">Khung giao:</span>{" "}
                <strong className="text-gray-800">
                  {order.deliverySlot || "Linh hoạt"}
                </strong>
              </p>
              {order.deliveryNote && (
                <p className="rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-amber-900">
                  Ghi chú: {order.deliveryNote}
                </p>
              )}
            </div>
          </section>

          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Truck size={16} className="text-amber-700" /> Chuyến vận chuyển
            </h2>
            {shipment ? (
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <p className="font-mono font-bold text-amber-900">
                  {shipment.shipmentCode}
                </p>
                <p>
                  {shipment.driverName} · {shipment.vehicleNumber}
                </p>
                <Link
                  href={`/dashboard/distributor/shipments/${encodeURIComponent(shipment.shipmentCode)}`}
                  className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline"
                >
                  Mở hành trình →
                </Link>
              </div>
            ) : (
              <Link
                href={`/dashboard/distributor/shipments?order=${encodeURIComponent(order.orderCode)}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
              >
                Tạo chuyến vận chuyển cho đơn này →
              </Link>
            )}
          </section>

          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CreditCard size={16} className="text-amber-700" /> Thanh toán
            </h2>
            <p className="mt-3 text-xs text-gray-600">
              Phương thức:{" "}
              <strong className="text-gray-900">{order.paymentMethod}</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
