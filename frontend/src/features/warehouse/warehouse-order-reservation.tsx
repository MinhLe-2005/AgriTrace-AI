"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, PackageCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import { warehouseService } from "@/services/warehouse.service";
import type { EligibleWarehouseOrder } from "@/types/warehouse";

interface ReservationProps {
  warehouseId: string;
  busy: boolean;
  close: () => void;
  reserve: (
    orderId: number,
    product: string,
    kg: number,
    ttl: number
  ) => Promise<boolean>;
}

export function WarehouseOrderReservation({
  warehouseId,
  busy,
  close,
  reserve,
}: ReservationProps) {
  const [reference, setReference] = useState("");
  const [searched, setSearched] = useState("");
  const order = useQuery({
    queryKey: ["warehouse", warehouseId, "eligible-order", searched],
    queryFn: () => warehouseService.lookupOrder(warehouseId, searched),
    enabled: !!searched,
    retry: false,
  });
  const matched = searched === reference.trim() && !!searched;

  function search(event: FormEvent) {
    event.preventDefault();
    const value = reference.trim();
    if (!value) return;
    if (value === searched) void order.refetch();
    else setSearched(value);
  }

  return (
    <Modal
      title="Giữ hàng cho đơn (FEFO)"
      onClose={() => {
        if (!busy) close();
      }}
    >
      <form className="flex items-end gap-2" onSubmit={search}>
        <label className="block flex-1 space-y-1 text-sm">
          <span className="font-medium">Mã đơn hoặc ID</span>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              autoFocus
              required
              maxLength={64}
              className="pl-9 font-mono-code"
              placeholder="VD: AGRI-1234 hoặc DEMO-..."
              value={reference}
              disabled={busy}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>
        </label>
        <Button
          type="submit"
          variant="secondary"
          disabled={busy || !reference.trim()}
        >
          Tra đơn
        </Button>
      </form>
      {matched && order.isFetching && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Đang tra đơn…
        </p>
      )}
      {matched && order.error && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
          <span>{getApiErrorMessage(order.error)}</span>
        </p>
      )}
      {matched && order.data && !order.isFetching && !order.error && (
        <OrderLines
          key={order.data.id}
          order={order.data}
          busy={busy}
          reserve={reserve}
          onSuccess={close}
          onFailure={() => {
            void order.refetch();
          }}
        />
      )}
    </Modal>
  );
}

function OrderLines({
  order,
  busy,
  reserve,
  onSuccess,
  onFailure,
}: {
  order: EligibleWarehouseOrder;
  busy: boolean;
  reserve: ReservationProps["reserve"];
  onSuccess: () => void;
  onFailure: () => void;
}) {
  const [product, setProduct] = useState("");
  const lines = order.lines.filter((line) => (line.remainingKg ?? 0) >= 0.001);
  const selected = lines.find((line) => line.productId === product) ?? lines[0];
  const remaining = selected?.remainingKg ?? 0;
  const maxKg = Math.floor((remaining + 1e-9) * 1000) / 1000;
  const [kgInput, setKgInput] = useState<string>(() =>
    maxKg > 0 ? String(maxKg) : ""
  );

  function handleSelectProduct(nextProduct: string) {
    setProduct(nextProduct);
    const nextLine = lines.find((l) => l.productId === nextProduct);
    const nextMax =
      Math.floor(((nextLine?.remainingKg ?? 0) + 1e-9) * 1000) / 1000;
    setKgInput(nextMax > 0 ? String(nextMax) : "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    const data = new FormData(event.currentTarget);
    if (
      await reserve(
        order.id,
        selected.productId,
        Number(data.get("kg")),
        Number(data.get("ttl"))
      )
    )
      onSuccess();
    else onFailure();
  }

  return (
    <form className="mt-4 space-y-3.5" onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-sm">
        <span className="font-mono-code font-bold text-emerald-950">
          #{order.orderCode}
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          {order.status}
        </span>
      </div>

      {order.lines
        .filter((line) => line.issue)
        .map((line) => (
          <p
            key={line.productId}
            className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800"
          >
            <strong>{line.productId}</strong> · Chưa quy đổi được số lượng trên
            đơn sang kg. Hãy khai báo quy đổi trọng lượng ở tab Kho & vị trí.
          </p>
        ))}

      {selected ? (
        <>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Sản phẩm còn cần giữ</span>
            <Select
              value={selected.productId}
              onChange={(event) => handleSelectProduct(event.target.value)}
              disabled={busy}
            >
              {lines.map((line) => (
                <option key={line.productId} value={line.productId}>
                  {line.productId}
                </option>
              ))}
            </Select>
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface/70 p-3 text-xs">
            <div>
              <span className="block text-muted-foreground">Đơn yêu cầu</span>
              <strong className="text-sm text-foreground">
                {selected.demandKg?.toLocaleString("vi-VN")} kg
              </strong>
            </div>
            <div>
              <span className="block text-muted-foreground">Còn cần giữ</span>
              <strong className="text-sm text-primary">
                {remaining.toLocaleString("vi-VN")} kg
              </strong>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="reserve-kg" className="font-medium">
                Khối lượng muốn giữ (kg)
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setKgInput(
                      String(Math.max(0.001, Math.round((maxKg / 2) * 1000) / 1000))
                    )
                  }
                  className="font-medium text-muted-foreground hover:text-primary"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setKgInput(String(maxKg))}
                  className="font-semibold text-primary hover:underline"
                >
                  Tối đa ({maxKg.toLocaleString("vi-VN")} kg)
                </button>
              </div>
            </div>
            <Input
              id="reserve-kg"
              name="kg"
              type="number"
              step="0.001"
              min="0.001"
              max={maxKg}
              value={kgInput}
              onChange={(e) => setKgInput(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Thời gian giữ (phút)</span>
            <Input
              name="ttl"
              type="number"
              min={1}
              max={1440}
              defaultValue={30}
              required
              disabled={busy}
            />
          </label>

          <Button type="submit" loading={busy} className="w-full">
            <PackageCheck size={16} aria-hidden="true" />
            Giữ hàng theo FEFO
          </Button>
        </>
      ) : (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-surface/70 p-3 text-sm text-muted-foreground"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
          Đơn này không còn dòng hàng đủ điều kiện để giữ thêm.
        </p>
      )}
    </form>
  );
}
