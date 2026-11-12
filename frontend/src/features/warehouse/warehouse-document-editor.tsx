"use client";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { warehouseService as service } from "@/services/warehouse.service";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type {
  Warehouse,
  StorageLocation,
  Balance,
  DocumentType,
  DocumentLine,
} from "@/types/warehouse";

interface Props {
  warehouseId: string;
  type: DocumentType;
  warehouses: Warehouse[];
  locations: StorageLocation[];
  balances: Balance[];
  busy: boolean;
  run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>;
  close: () => void;
}
const names: Record<DocumentType, string> = {
  INBOUND: "nhập kho",
  OUTBOUND: "xuất kho",
  COUNT: "kiểm kê",
  ADJUSTMENT: "điều chỉnh",
  TRANSFER: "chuyển kho",
};
export function WarehouseDocumentEditor({
  warehouseId,
  type,
  warehouses,
  locations,
  balances,
  busy,
  run,
  close,
}: Props) {
  const [lines, setLines] = useState<DocumentLine[]>([
    { lotId: "", locationId: "", quantityKg: 0 },
  ]);
  const [target, setTarget] = useState("");
  const lotQuery = useQuery({
    queryKey: ["warehouse", warehouseId, "lots"],
    queryFn: () => service.lots(warehouseId),
    enabled: type === "INBOUND",
    retry: false,
  });
  const destinations = useQuery({
    queryKey: ["warehouse", target, "locations"],
    queryFn: () => service.locations(target),
    enabled: !!target,
    retry: false,
  });
  const lots =
    type === "INBOUND"
      ? (lotQuery.data ?? [])
      : [
          ...new Map(
            balances.map((b) => [
              b.lotId,
              { id: b.lotId, lotCode: b.lotCode, expiryDate: b.expiryDate },
            ])
          ).values(),
        ];
  const count = type === "COUNT" || type === "ADJUSTMENT";
  function update(index: number, patch: Partial<DocumentLine>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await run(
        () =>
          service.createDocument(warehouseId, type, {
            note: String(data.get("note") ?? "").trim(),
            targetWarehouseId: type === "TRANSFER" ? target : null,
            inTransit: type === "TRANSFER",
            lines,
          }),
        "Đã lưu phiếu nháp. Xác nhận trong Chứng từ để ghi nhận tồn kho."
      )
    )
      close();
  }
  return (
    <Modal title={"Lập phiếu " + names[type]} onClose={close}>
      <form
        className="max-h-[70vh] space-y-4 overflow-auto pr-1"
        onSubmit={submit}
      >
        <p className="text-sm text-slate-500">
          {count
            ? "Nhập số lượng thực tế, gồm cả 0. Hệ thống lưu mốc tồn và kiểm tra lại khi xác nhận."
            : "Số lượng dùng kg. Phiếu nháp chưa thay đổi tồn kho."}
        </p>
        {lotQuery.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {getApiErrorMessage(lotQuery.error)}
          </p>
        )}
        {type === "TRANSFER" && (
          <label className="block space-y-1 text-sm">
            Kho nhận
            <Select
              value={target}
              required
              onChange={(e) => {
                setTarget(e.target.value);
                setLines(lines.map((l) => ({ ...l, targetLocationId: "" })));
              }}
            >
              <option value="">Chọn kho nhận</option>
              {warehouses
                .filter((w) => w.active && w.id !== warehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </Select>
          </label>
        )}
        {lines.map((line, index) => (
          <fieldset key={index} className="space-y-3 rounded-xl border p-3">
            <legend className="px-1 text-sm font-medium">
              Dòng {index + 1}
            </legend>
            <div className="block space-y-1 text-sm">
              <label htmlFor={"lot-" + index}>Lô nông sản</label>
              <Select
                id={"lot-" + index}
                required={type !== "INBOUND"}
                value={line.lotId}
                onChange={(e) => update(index, { lotId: e.target.value })}
              >
                <option value="">Chọn lô</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lotCode} · HSD {l.expiryDate}
                  </option>
                ))}
              </Select>
              {type === "INBOUND" && (
                <label className="block space-y-1 text-xs text-slate-500">
                  Danh sách hiển thị tối đa 200 lô gần nhất. Có thể nhập ID lô
                  đã duyệt:
                  <Input
                    aria-label={"ID lô dòng " + (index + 1)}
                    value={line.lotId}
                    required
                    inputMode="numeric"
                    pattern="[1-9][0-9]*"
                    onChange={(e) => update(index, { lotId: e.target.value })}
                  />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1 text-sm">
                Vị trí
                <Select
                  required
                  value={line.locationId}
                  onChange={(e) =>
                    update(index, { locationId: e.target.value })
                  }
                >
                  <option value="">Chọn vị trí</option>
                  {locations
                    .filter((l) => l.active || count)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code}
                      </option>
                    ))}
                </Select>
              </label>
              <label className="block space-y-1 text-sm">
                Số lượng (kg)
                <Input
                  required
                  type="number"
                  min={count ? 0 : 0.001}
                  step="0.001"
                  value={line.quantityKg}
                  onChange={(e) =>
                    update(index, { quantityKg: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            {type === "TRANSFER" && (
              <label className="block space-y-1 text-sm">
                Vị trí nhận
                <Select
                  required
                  value={line.targetLocationId ?? ""}
                  onChange={(e) =>
                    update(index, { targetLocationId: e.target.value })
                  }
                >
                  <option value="">Chọn vị trí nhận</option>
                  {destinations.data
                    ?.filter((l) => l.active)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code}
                      </option>
                    ))}
                </Select>
              </label>
            )}
            {lines.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setLines(lines.filter((_, i) => i !== index))}
              >
                Bỏ dòng
              </Button>
            )}
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={lines.length >= 100}
          onClick={() =>
            setLines([...lines, { lotId: "", locationId: "", quantityKg: 0 }])
          }
        >
          <Plus size={14} />
          Thêm dòng
        </Button>
        <label className="block space-y-1 text-sm">
          Ghi chú / lý do
          <Input name="note" maxLength={500} required={count} />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Đóng
          </Button>
          <Button type="submit" disabled={busy}>
            Lưu phiếu nháp
          </Button>
        </div>
      </form>
    </Modal>
  );
}
