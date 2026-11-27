"use client";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import { warehouseService as service } from "@/services/warehouse.service";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { LotQrReader, readLotCode } from "@/components/ui/lot-qr-reader";
import {
  documentLineError,
  eligibleIssueBalances,
  matchesFefoLines,
  warehouseToday,
} from "./warehouse-document-rules";
import type {
  Warehouse,
  StorageLocation,
  Balance,
  DocumentType,
  DocumentLine,
  Allocation,
  LotSummary,
} from "@/types/warehouse";

type DraftLine = Omit<DocumentLine, "quantityKg"> & {
  quantityKg: number | null;
};
const emptyLine = (): DraftLine => ({
  lotId: "",
  locationId: "",
  quantityKg: null,
});

interface Props {
  warehouseId: string;
  type: DocumentType;
  warehouses: Warehouse[];
  locations: StorageLocation[];
  balances: Balance[];
  busy: boolean;
  initialLine?: { lotId: string; locationId: string } | null;
  run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>;
  close: () => void;
  onOrderOutbound?: () => void;
}
const names: Record<DocumentType, string> = {
  INBOUND: "nhập kho",
  OUTBOUND: "xuất kho",
  COUNT: "kiểm kê",
  ADJUSTMENT: "điều chỉnh",
  TRANSFER: "chuyển kho",
};

function expiryLabel(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi-VN")
    .trim();
}

export function WarehouseDocumentEditor({
  warehouseId,
  type,
  warehouses,
  locations,
  balances,
  busy,
  initialLine,
  run,
  close,
  onOrderOutbound,
}: Props) {
  const client = useQueryClient();
  const [lines, setLines] = useState<DraftLine[]>(() =>
    initialLine
      ? [{ lotId: initialLine.lotId, locationId: initialLine.locationId, quantityKg: null }]
      : [emptyLine()]
  );
  const [scanned, setScanned] = useState<LotSummary[]>([]);
  const [readingLot, setReadingLot] = useState(false);
  const [target, setTarget] = useState("");
  const [lotSearch, setLotSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fefoSuggestion, setFefoSuggestion] = useState<Allocation[] | null>(
    null
  );
  const [checkingFefo, setCheckingFefo] = useState(false);

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

  const issue = type === "OUTBOUND" || type === "TRANSFER";
  const issueStock = warehouses.find(
    (warehouse) => warehouse.id === warehouseId
  )?.active
    ? eligibleIssueBalances(warehouseId, balances, locations, warehouseToday())
    : [];
  const sourceBalances = issue ? issueStock : balances;
  const inboundLots = [
    ...new Map(
      [...scanned, ...(lotQuery.data ?? [])].map((l) => [l.id, l])
    ).values(),
  ];
  const lots =
    type === "INBOUND"
      ? inboundLots
      : [
          ...new Map(
            sourceBalances.map((b) => [
              b.lotId,
              {
                id: b.lotId,
                productId: b.productId,
                lotCode: b.lotCode,
                expiryDate: b.expiryDate,
              },
            ])
          ).values(),
        ];
  const matchingLotIds = new Set(
    lots
      .filter((lot) =>
        searchable(`${lot.productId} ${lot.lotCode}`).includes(
          searchable(lotSearch)
        )
      )
      .map((lot) => lot.id)
  );
  const count = type === "COUNT" || type === "ADJUSTMENT";
  const currentWarehouse = warehouses.find(
    (warehouse) => warehouse.id === warehouseId
  );
  const totalKg =
    lines.reduce(
      (sum, line) =>
        sum +
        (line.quantityKg !== null && Number.isFinite(line.quantityKg)
          ? Math.round(line.quantityKg * 1000)
          : 0),
      0
    ) / 1000;

  function update(index: number, patch: Partial<DraftLine>) {
    setLines((previous) =>
      previous.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
    setFormError(null);
    setFefoSuggestion(null);
  }

  function removeLine(index: number) {
    setLines((previous) => previous.filter((_, i) => i !== index));
    setFormError(null);
    setFefoSuggestion(null);
  }

  function chooseLot(index: number, lotId: string) {
    const positions = issueStock.filter((balance) => balance.lotId === lotId);
    update(index, {
      lotId,
      quantityKg: null,
      ...(issue
        ? { locationId: positions.length === 1 ? positions[0].locationId : "" }
        : {}),
    });
  }

  async function lookupLot(raw: string) {
    const code = readLotCode(raw);
    if (!code) {
      setFormError("Nhập mã lô hoặc quét tem có mã lô hợp lệ.");
      return;
    }
    setReadingLot(true);
    setFormError(null);
    try {
      const lot = await service.lotByCode(warehouseId, code);
      setScanned((previous) => [
        lot,
        ...previous.filter((item) => item.id !== lot.id),
      ]);
      setLotSearch("");
      setLines((previous) => {
        const blank = previous.findIndex((line) => !line.lotId);
        if (blank < 0 && previous.some((line) => line.lotId === lot.id))
          return previous;
        if (blank < 0) return [...previous, { ...emptyLine(), lotId: lot.id }];
        return previous.map((line, i) =>
          i === blank ? { ...line, lotId: lot.id, quantityKg: null } : line
        );
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setReadingLot(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const note = String(data.get("note") ?? "").trim();
    setFormError(null);
    setFefoSuggestion(null);

    if (
      !lines.every(
        (line): line is DocumentLine =>
          line.quantityKg !== null && Number.isFinite(line.quantityKg)
      )
    ) {
      setFormError(
        "Nhập số lượng thực tế cho từng dòng. Nếu không còn hàng, nhập rõ số 0."
      );
      return;
    }

    const validationError = documentLineError(
      type,
      lines,
      warehouseId,
      target,
      issueStock
    );
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (type === "OUTBOUND") {
      if (!note) {
        setFormError(
          "Nhập lý do xuất trực tiếp. Nếu xuất cho đơn hàng, hãy sử dụng lượt giữ hàng của đơn."
        );
        return;
      }
      setCheckingFefo(true);
      try {
        const demands = new Map<string, number>();
        for (const line of lines) {
          const match = issueStock.find(
            (balance) => balance.lotId === line.lotId
          );
          if (!match) {
            setFormError("Dữ liệu tồn kho đã thay đổi, vui lòng chọn lại lô.");
            return;
          }
          demands.set(
            match.productId,
            (demands.get(match.productId) ?? 0) +
              Math.round(line.quantityKg * 1000)
          );
        }
        const suggested: Allocation[] = [];
        for (const [product, grams] of demands) {
          suggested.push(
            ...(await service.fefo(warehouseId, product, grams / 1000))
          );
        }
        if (!matchesFefoLines(lines, suggested)) {
          if (
            suggested.some(
              (allocation) =>
                !issueStock.some(
                  (balance) => balance.id === allocation.balanceId
                )
            )
          ) {
            await client.invalidateQueries({
              queryKey: ["warehouse", warehouseId, "stock"],
            });
          }
          setFefoSuggestion(suggested);
          setFormError(
            "Phân bổ hiện tại chưa đúng FEFO. Có lô hoặc vị trí cần ưu tiên xuất trước. Áp dụng đề xuất bên dưới rồi kiểm tra lại trước khi lưu."
          );
          return;
        }
      } catch (error) {
        setFormError(getApiErrorMessage(error));
        return;
      } finally {
        setCheckingFefo(false);
      }
    }

    if (
      await run(
        () =>
          service.createDocument(warehouseId, type, {
            note,
            targetWarehouseId: type === "TRANSFER" ? target : null,
            inTransit: type === "TRANSFER",
            lines: lines.map((l) => ({ ...l, lotId: l.lotId.trim() })),
          }),
        "Đã lưu phiếu nháp. Xác nhận trong Chứng từ để ghi nhận tồn kho."
      )
    )
      close();
  }

  return (
    <Modal
      size="wide"
      title={"Lập phiếu " + names[type]}
      onClose={() => {
        if (!busy && !checkingFefo) close();
      }}
    >
      <form
        className="max-h-[78vh] space-y-4 overflow-y-auto overscroll-contain pr-1"
        onSubmit={submit}
      >
        <div className="grid gap-3 rounded-none border border-slate-300 bg-slate-50 p-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Kho thực hiện</p>
            <p className="font-semibold text-foreground">
              {currentWarehouse?.name ?? "Đang tải kho"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nghiệp vụ</p>
            <p className="font-semibold capitalize text-foreground">
              {names[type]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trạng thái khi lưu</p>
            <p className="font-semibold text-amber-700">
              Bản nháp · chưa đổi tồn
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {count
            ? "Nhập số lượng thực tế, gồm cả 0. Hệ thống lưu mốc tồn và kiểm tra lại khi xác nhận."
            : "Số lượng tính theo kg. Phiếu nháp chưa làm thay đổi tồn kho."}
        </p>

        {type === "OUTBOUND" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 p-3.5 text-sm text-sky-950">
            <div className="space-y-0.5">
              <p className="font-medium">
                Phiếu này xuất trực tiếp từ hàng khả dụng và cần ghi lý do.
              </p>
              <p className="text-xs text-sky-800">
                Lô, vị trí và số lượng được đối chiếu FEFO trước khi lưu. Với đơn
                hàng, hãy lập phiếu xuất từ lượt giữ hàng.
              </p>
            </div>
            {onOrderOutbound && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy || checkingFefo}
                onClick={onOrderOutbound}
              >
                Xuất cho đơn hàng → FEFO & giữ hàng
              </Button>
            )}
          </div>
        )}

        {issue && (
          <p className="text-xs text-slate-600">
            Chỉ chọn được lô còn hạn, không cách ly và còn khả dụng tại vị trí
            đang hoạt động. Hệ thống kiểm tra lại tồn khi xác nhận phiếu.
          </p>
        )}

        {issue && lots.length === 0 && (
          <p
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            Chưa có lô đủ điều kiện xuất. Kiểm tra tồn kho, hàng đang giữ cho
            đơn và tình trạng chất lượng.
          </p>
        )}

        {lotQuery.error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {getApiErrorMessage(lotQuery.error)}
          </p>
        )}

        {type === "TRANSFER" && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Kho nhận</span>
            <Select
              value={target}
              required
              disabled={busy || checkingFefo}
              onChange={(e) => {
                setTarget(e.target.value);
                setLines(lines.map((l) => ({ ...l, targetLocationId: "" })));
                setFormError(null);
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

        <div className="space-y-2 rounded-2xl border border-border/80 bg-white p-3.5">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">
              Tìm nhanh lô theo tên nông sản hoặc mã lô
            </span>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                className="pl-9"
                placeholder="Ví dụ: xà lách, XL-131126-03"
                value={lotSearch}
                disabled={busy || checkingFefo}
                onChange={(event) => setLotSearch(event.target.value)}
              />
            </div>
          </label>

          {lotSearch.trim() && matchingLotIds.size === 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              Không tìm thấy lô phù hợp trong danh sách tải sẵn. Các lô đã chọn
              vẫn được giữ nguyên.
            </p>
          )}

          {type === "INBOUND" && (
            <div className="space-y-2 border-t border-border/60 pt-2.5">
              <LotQrReader onCode={lookupLot} disabled={busy || readingLot} />
              {lotSearch.trim() && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy || readingLot}
                  onClick={() => lookupLot(lotSearch)}
                >
                  Tra đúng mã lô &ldquo;{lotSearch.trim()}&rdquo; và điền vào
                  phiếu
                </Button>
              )}
              {readingLot && (
                <p role="status" className="text-xs text-primary">
                  Đang tra mã lô…
                </p>
              )}
            </div>
          )}
        </div>

        {lines.map((line, index) => {
          const selectedLot = lots.find((lot) => lot.id === line.lotId);
          const selectedBalance = sourceBalances.find(
            (balance) =>
              balance.lotId === line.lotId &&
              balance.locationId === line.locationId
          );
          const lineLocations = locations.filter((location) =>
            issue
              ? issueStock.some(
                  (balance) =>
                    balance.lotId === line.lotId &&
                    balance.locationId === location.id
                )
              : location.active || count
          );
          const sourceLot =
            type === "INBOUND"
              ? inboundLots.find((lot) => lot.id === line.lotId)
              : undefined;
          const earlierFefoBalance =
            issue && selectedLot
              ? issueStock
                  .filter(
                    (b) =>
                      b.productId === selectedLot.productId &&
                      b.lotId !== selectedLot.id &&
                      b.availableKg > 0 &&
                      b.expiryDate < selectedLot.expiryDate
                  )
                  .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0]
              : undefined;
          const selectedLocation = locations.find(
            (location) => location.id === line.locationId
          );
          const locationStock = balances
            .filter((balance) => balance.locationId === line.locationId)
            .reduce((sum, balance) => sum + balance.quantityKg, 0);
          const locationPlanned = lines
            .filter((item) => item.locationId === line.locationId)
            .reduce((sum, item) => sum + (item.quantityKg ?? 0), 0);
          const capacityKg = (selectedLocation?.capacityTons ?? 0) * 1000;
          const delta = count
            ? (line.quantityKg ?? 0) - (selectedBalance?.quantityKg ?? 0)
            : issue
              ? -(line.quantityKg ?? 0)
              : (line.quantityKg ?? 0);
          const expectedStock = (selectedBalance?.quantityKg ?? 0) + delta;
          const occupancyRatio =
            capacityKg > 0
              ? Math.min(100, ((locationStock + locationPlanned) / capacityKg) * 100)
              : 0;
          const overCapacity =
            type === "INBOUND" &&
            capacityKg > 0 &&
            locationStock + locationPlanned > capacityKg;

          return (
            <fieldset
              key={index}
              disabled={busy || checkingFefo}
              className="min-w-0 space-y-3 rounded-none border border-slate-300 bg-white p-3.5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                <legend className="text-sm font-semibold text-foreground">
                  Dòng {index + 1}
                  {selectedLot ? ` · ${selectedLot.lotCode}` : ""}
                </legend>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Bỏ dòng
                  </Button>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0 space-y-2 text-sm">
                  <label htmlFor={"lot-" + index} className="block font-medium">
                    Lô nông sản
                  </label>
                  <Select
                    className="min-w-0"
                    id={"lot-" + index}
                    required={type !== "INBOUND"}
                    value={line.lotId}
                    onChange={(e) => chooseLot(index, e.target.value)}
                  >
                    <option value="">
                      {lotQuery.isLoading && type === "INBOUND"
                        ? "Đang tải lô nông sản…"
                        : "Chọn nông sản và lô hàng"}
                    </option>
                    {lots
                      .filter(
                        (lot) =>
                          matchingLotIds.has(lot.id) || lot.id === line.lotId
                      )
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.productId} · {l.lotCode} · HSD{" "}
                          {expiryLabel(l.expiryDate)}
                        </option>
                      ))}
                  </Select>

                  {selectedLot && (
                    <div className="space-y-2 rounded-none border border-emerald-300 bg-emerald-50/40 p-2.5">
                      <p className="font-semibold text-foreground">
                        {selectedLot.productId}
                      </p>
                      <dl className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Mã lô</dt>
                          <dd className="font-mono-code font-semibold">
                            {selectedLot.lotCode}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Hạn sử dụng</dt>
                          <dd className="font-medium">
                            {expiryLabel(selectedLot.expiryDate)}
                          </dd>
                        </div>
                        {sourceLot && (
                          <div className="col-span-2">
                            <dt className="text-muted-foreground">
                              Khối lượng lô nông trại khai báo
                            </dt>
                            <dd className="font-medium">
                              {sourceLot.initialQuantity.toLocaleString("vi-VN")}{" "}
                              {sourceLot.unit.toLowerCase()}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {sourceLot && (
                        <p className="text-xs text-muted-foreground">
                          Nhập số kg thực nhận trong đợt này ở bên dưới. Khối
                          lượng lô khai báo có thể đã được nhận một phần.
                        </p>
                      )}
                      {issue && selectedBalance && (
                        <dl className="grid grid-cols-3 gap-2 border-t border-emerald-200/60 pt-2 text-xs">
                          <div>
                            <dt className="text-muted-foreground">
                              Tồn tại vị trí
                            </dt>
                            <dd className="font-medium">
                              {selectedBalance.quantityKg.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              kg
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Giữ cho đơn
                            </dt>
                            <dd className="font-medium">
                              {selectedBalance.reservedKg.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              kg
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Có thể xuất
                            </dt>
                            <dd className="font-semibold text-emerald-800">
                              {selectedBalance.availableKg.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              kg
                            </dd>
                          </div>
                        </dl>
                      )}
                    </div>
                  )}

                  {earlierFefoBalance && (
                    <div
                      role="status"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950"
                    >
                      <span>
                        <strong>Nhắc FEFO:</strong> Còn lô{" "}
                        <span className="font-mono font-semibold">
                          {earlierFefoBalance.lotCode}
                        </span>{" "}
                        (HSD {expiryLabel(earlierFefoBalance.expiryDate)} · khả
                        dụng{" "}
                        {earlierFefoBalance.availableKg.toLocaleString("vi-VN")}{" "}
                        kg) hết hạn sớm hơn.
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 whitespace-nowrap border-amber-300 bg-white px-2.5 text-xs text-amber-950 hover:bg-amber-100"
                        onClick={() =>
                          update(index, {
                            lotId: earlierFefoBalance.lotId,
                            locationId: earlierFefoBalance.locationId,
                            quantityKg: null,
                          })
                        }
                      >
                        Chọn lô này
                      </Button>
                    </div>
                  )}

                  {type === "INBOUND" && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer py-1 font-medium hover:text-foreground">
                        Không thấy lô trong danh sách? (Nhập ID thủ công)
                      </summary>
                      <p className="mb-2">
                        Danh sách hiển thị tối đa 200 lô đã duyệt gần nhất còn
                        hạn. Nếu đã có ID lô được duyệt, bạn có thể nhập bên
                        dưới.
                      </p>
                      <label className="block space-y-1">
                        <span>ID lô đã duyệt</span>
                        <Input
                          aria-label={"ID lô dòng " + (index + 1)}
                          value={line.lotId}
                          inputMode="numeric"
                          placeholder="Ví dụ: 12"
                          onChange={(e) =>
                            update(index, { lotId: e.target.value })
                          }
                        />
                      </label>
                      {line.lotId && !selectedLot && !lotQuery.isLoading && (
                        <p role="status" className="mt-2 text-amber-700">
                          Chưa có thông tin nông sản của ID này trong danh sách.
                          Hãy đối chiếu mã lô và tên nông sản trước khi lưu.
                        </p>
                      )}
                    </details>
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">Vị trí</span>
                    <Select
                      className="min-w-0 max-w-full"
                      required
                      disabled={issue && !line.lotId}
                      value={line.locationId}
                      onChange={(e) =>
                        update(index, {
                          locationId: e.target.value,
                          ...(count ? { quantityKg: null } : {}),
                        })
                      }
                    >
                      <option value="">Chọn vị trí</option>
                      {lineLocations.map((l) => {
                        const avail = issue
                          ? issueStock.find(
                              (balance) =>
                                balance.lotId === line.lotId &&
                                balance.locationId === l.id
                            )?.availableKg
                          : undefined;
                        return (
                          <option key={l.id} value={l.id}>
                            {l.code} – {l.name}
                            {issue && avail !== undefined
                              ? ` · Khả dụng ${avail.toLocaleString("vi-VN")} kg`
                              : ""}
                          </option>
                        );
                      })}
                    </Select>
                  </label>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={"qty-" + index} className="font-medium">
                        {type === "OUTBOUND"
                          ? "Số lượng cần xuất (kg)"
                          : type === "COUNT"
                            ? "Số lượng thực đếm (kg)"
                            : type === "ADJUSTMENT"
                              ? "Số dư sau điều chỉnh (kg)"
                              : type === "INBOUND"
                                ? "Số lượng thực nhận (kg)"
                                : "Số lượng chuyển (kg)"}
                      </label>
                      {issue && selectedBalance && (
                        <button
                          type="button"
                          onClick={() =>
                            update(index, {
                              quantityKg: selectedBalance.availableKg,
                            })
                          }
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Dùng tối đa (
                          {selectedBalance.availableKg.toLocaleString("vi-VN")}{" "}
                          kg)
                        </button>
                      )}
                    </div>
                    <Input
                      id={"qty-" + index}
                      required
                      type="number"
                      min={count ? 0 : 0.001}
                      step="0.001"
                      value={line.quantityKg ?? ""}
                      max={issue ? selectedBalance?.availableKg : undefined}
                      disabled={issue && !selectedBalance}
                      placeholder={
                        issue && selectedBalance
                          ? `Tối đa ${selectedBalance.availableKg.toLocaleString("vi-VN")} kg`
                          : "Nhập số lượng thực tế"
                      }
                      onChange={(e) =>
                        update(index, {
                          quantityKg:
                            e.target.value === ""
                              ? null
                              : e.target.valueAsNumber,
                        })
                      }
                    />
                  </div>

                  {line.lotId &&
                    selectedLocation &&
                    line.quantityKg !== null &&
                    Number.isFinite(line.quantityKg) && (
                      <div className="space-y-2 rounded-xl border border-border/80 bg-surface/60 p-3 text-xs">
                        <p className="font-semibold text-foreground">
                          Dự kiến khi xác nhận phiếu
                        </p>
                        <p>
                          Tồn lô tại {selectedLocation.code}:{" "}
                          <strong>
                            {(selectedBalance?.quantityKg ?? 0).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            → {expectedStock.toLocaleString("vi-VN")} kg
                          </strong>
                        </p>
                        {count && (
                          <p>
                            {type === "ADJUSTMENT"
                              ? "Mức điều chỉnh"
                              : "Chênh lệch kiểm đếm"}
                            :{" "}
                            <strong
                              className={
                                delta < 0 ? "text-rose-700" : "text-emerald-700"
                              }
                            >
                              {delta > 0 ? "+" : ""}
                              {delta.toLocaleString("vi-VN")} kg
                            </strong>
                          </p>
                        )}
                        {type === "INBOUND" && (
                          <div className="space-y-1">
                            <p
                              className={
                                overCapacity
                                  ? "font-semibold text-rose-700"
                                  : "text-muted-foreground"
                              }
                            >
                              Sức chứa vị trí:{" "}
                              {(
                                locationStock + locationPlanned
                              ).toLocaleString("vi-VN")}{" "}
                              / {capacityKg.toLocaleString("vi-VN")} kg (
                              {Math.round(occupancyRatio)}%)
                            </p>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full transition-all ${overCapacity ? "bg-rose-600" : occupancyRatio > 80 ? "bg-amber-500" : "bg-emerald-600"}`}
                                style={{ width: `${occupancyRatio}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {type === "TRANSFER" && (
                          <p className="text-muted-foreground">
                            Kho đích chỉ cộng tồn khi xác nhận nhận hàng.
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {type === "TRANSFER" && (
                  <label className="block space-y-1 text-sm lg:col-span-2">
                    <span className="font-medium">Vị trí nhận tại kho đích</span>
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
                            {l.code} – {l.name}
                          </option>
                        ))}
                    </Select>
                  </label>
                )}
              </div>
            </fieldset>
          );
        })}

        <Button
          type="button"
          variant="secondary"
          disabled={busy || checkingFefo || lines.length >= 100}
          onClick={() => setLines([...lines, emptyLine()])}
        >
          <Plus size={14} />
          Thêm dòng
        </Button>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Ghi chú / lý do</span>
          <Input
            name="note"
            maxLength={500}
            disabled={busy || checkingFefo}
            required={count || type === "OUTBOUND"}
            placeholder={
              type === "OUTBOUND" ? "Ghi rõ lý do xuất trực tiếp" : undefined
            }
          />
        </label>

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </p>
        )}

        {fefoSuggestion && (
          <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle2 size={16} />
              Lô và vị trí được FEFO đề xuất
            </p>
            <ul className="space-y-1 text-xs text-emerald-950">
              {fefoSuggestion.map((allocation) => (
                <li key={allocation.balanceId} className="font-medium">
                  <span className="font-mono-code">{allocation.lotCode}</span> ·{" "}
                  {
                    locations.find(
                      (location) => location.id === allocation.locationId
                    )?.code
                  }{" "}
                  · HSD {expiryLabel(allocation.expiryDate)} ·{" "}
                  <strong>{allocation.quantityKg.toLocaleString("vi-VN")} kg</strong>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setLines(
                  fefoSuggestion.map((allocation) => ({
                    lotId: allocation.lotId,
                    locationId: allocation.locationId,
                    quantityKg: allocation.quantityKg,
                  }))
                );
                setFefoSuggestion(null);
                setFormError(null);
              }}
            >
              Áp dụng phân bổ FEFO
            </Button>
          </div>
        )}

        <div className="sticky -bottom-1 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 p-4 shadow-lg backdrop-blur">
          <div>
            <p className="text-xs text-muted-foreground">
              {lines.length} dòng hàng ·{" "}
              {type === "ADJUSTMENT"
                ? "Tổng số dư sau điều chỉnh"
                : count
                  ? "Tổng thực đếm"
                  : "Tổng khối lượng"}
            </p>
            <p className="text-xl font-bold text-primary">
              {totalKg.toLocaleString("vi-VN")} kg
            </p>
            <p className="text-xs text-muted-foreground">
              Lưu nháp trước; xác nhận tại Chứng từ để ghi nhận tồn.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || checkingFefo}
              onClick={close}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={
                busy || readingLot || checkingFefo || (issue && !lots.length)
              }
            >
              {checkingFefo ? "Đang kiểm tra FEFO…" : "Lưu phiếu nháp"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
