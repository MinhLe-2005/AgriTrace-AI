"use client";

import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { farmerService, type ApiCropSeason } from "@/services/farmer.service";
import { toast } from "@/stores/toast-store";

type FarmOption = {
  code: string;
  name: string;
};

type CropSeasonsPanelProps = {
  ownerId: string;
  farms: FarmOption[];
  productNames: string[];
};

export type LocalSeasonCode = "UPCOMING" | "IN_SEASON" | "LATE_SEASON" | "OFF_SEASON";

export function evaluateSeasonStatusClient(
  startMonth: number,
  endMonth: number,
  currentMonth: number
): {
  code: LocalSeasonCode;
  label: string;
  crossYear: boolean;
  durationMonths: number;
  inWindow: boolean;
} {
  const crossYear = startMonth > endMonth;
  const durationMonths = ((endMonth - startMonth + 12) % 12) + 1;
  const distanceFromStart = (currentMonth - startMonth + 12) % 12;

  if (durationMonths === 12) {
    return { code: "IN_SEASON", label: "Đang vào mùa", crossYear, durationMonths, inWindow: true };
  }
  if (distanceFromStart < durationMonths) {
    const isFinal = durationMonths >= 2 && distanceFromStart === durationMonths - 1;
    return {
      code: isFinal ? "LATE_SEASON" : "IN_SEASON",
      label: isFinal ? "Cuối mùa" : "Đang vào mùa",
      crossYear,
      durationMonths,
      inWindow: true,
    };
  }
  const upcomingMonth = ((startMonth - 2 + 12) % 12) + 1;
  if (currentMonth === upcomingMonth) {
    return { code: "UPCOMING", label: "Sắp vào mùa", crossYear, durationMonths, inWindow: false };
  }
  return { code: "OFF_SEASON", label: "Hết mùa", crossYear, durationMonths, inWindow: false };
}

function isMonthActiveInSpan(startMonth: number, endMonth: number, month: number): boolean {
  const duration = ((endMonth - startMonth + 12) % 12) + 1;
  const dist = (month - startMonth + 12) % 12;
  return dist < duration;
}

const SEASON_STYLE_MAP: Record<LocalSeasonCode, { pill: string; border: string }> = {
  IN_SEASON: {
    pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-200",
  },
  UPCOMING: {
    pill: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-sky-200",
  },
  LATE_SEASON: {
    pill: "bg-amber-100 text-amber-900 border-amber-300",
    border: "border-amber-200",
  },
  OFF_SEASON: {
    pill: "bg-slate-100 text-slate-700 border-slate-300",
    border: "border-gray-200",
  },
};

export function CropSeasonsPanel({ ownerId, farms, productNames }: CropSeasonsPanelProps) {
  const realCurrentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(realCurrentMonth);
  const [farmFilter, setFarmFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LocalSeasonCode>("ALL");
  const [seasons, setSeasons] = useState<ApiCropSeason[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<ApiCropSeason | null>(null);
  const [formFarmCode, setFormFarmCode] = useState<string>(farms[0]?.code || "NT-DL-01");
  const [formProductName, setFormProductName] = useState<string>(productNames[0] || "");
  const [formCategory, setFormCategory] = useState<string>("trai_cay");
  const [formStartMonth, setFormStartMonth] = useState<number>(11);
  const [formEndMonth, setFormEndMonth] = useState<number>(2);
  const [formPeakMultiplier, setFormPeakMultiplier] = useState<string>("1.30");
  const [formNotes, setFormNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadSeasons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await farmerService.getCropSeasons({
        ownerId,
        farmCode: farmFilter,
        month: selectedMonth,
      });
      setSeasons(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [ownerId, farmFilter, selectedMonth]);

  useEffect(() => {
    void loadSeasons();
  }, [loadSeasons]);

  const counts = useMemo(() => {
    const map: Record<LocalSeasonCode, number> = {
      IN_SEASON: 0,
      UPCOMING: 0,
      LATE_SEASON: 0,
      OFF_SEASON: 0,
    };
    for (const s of seasons) {
      const code = (s.seasonCode ||
        evaluateSeasonStatusClient(s.startMonth, s.endMonth, selectedMonth).code) as LocalSeasonCode;
      if (code in map) map[code]++;
    }
    return map;
  }, [seasons, selectedMonth]);

  const visibleSeasons = useMemo(() => {
    return seasons.filter((s) => {
      if (statusFilter === "ALL") return true;
      const code =
        s.seasonCode || evaluateSeasonStatusClient(s.startMonth, s.endMonth, selectedMonth).code;
      return code === statusFilter;
    });
  }, [seasons, statusFilter, selectedMonth]);

  const liveModalPreview = useMemo(() => {
    return evaluateSeasonStatusClient(formStartMonth, formEndMonth, selectedMonth);
  }, [formStartMonth, formEndMonth, selectedMonth]);

  const openCreateModal = () => {
    setEditingSeason(null);
    setFormFarmCode(farmFilter !== "ALL" ? farmFilter : farms[0]?.code || "NT-DL-01");
    setFormProductName(productNames[0] || "Dâu Tây / Nông sản sạch");
    setFormCategory("trai_cay");
    setFormStartMonth(11);
    setFormEndMonth(2);
    setFormPeakMultiplier("1.32");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (season: ApiCropSeason) => {
    setEditingSeason(season);
    setFormFarmCode(season.farmCode || farms[0]?.code || "NT-DL-01");
    setFormProductName(season.productName);
    setFormCategory(season.categoryCode || "trai_cay");
    setFormStartMonth(season.startMonth);
    setFormEndMonth(season.endMonth);
    setFormPeakMultiplier(String(season.peakMultiplier || 1.3));
    setFormNotes(season.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductName.trim()) {
      toast.error("Vui lòng nhập hoặc chọn tên nông sản!");
      return;
    }
    const peakNum = Number(formPeakMultiplier);
    const safePeak = Number.isFinite(peakNum) && peakNum > 0 ? peakNum : 1.3;

    setSubmitting(true);
    try {
      const payload = {
        ownerId,
        farmCode: formFarmCode,
        productName: formProductName.trim(),
        categoryCode: formCategory,
        startMonth: formStartMonth,
        endMonth: formEndMonth,
        peakMultiplier: safePeak,
        notes: formNotes.trim() || undefined,
      };
      if (editingSeason) {
        await farmerService.updateCropSeason(editingSeason.id, payload);
        toast.success(`Đã cập nhật mùa vụ "${payload.productName}" (T${formStartMonth} → T${formEndMonth})!`);
      } else {
        await farmerService.createCropSeason(payload);
        toast.success(`Đã thêm mùa vụ "${payload.productName}" (T${formStartMonth} → T${formEndMonth})!`);
      }
      setIsModalOpen(false);
      await loadSeasons();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeason = async (season: ApiCropSeason) => {
    if (!confirm(`Xác nhận xóa cấu hình mùa vụ "${season.productName}" (T${season.startMonth} → T${season.endMonth})?`)) {
      return;
    }
    try {
      await farmerService.deleteCropSeason(season.id);
      setSeasons((prev) => prev.filter((item) => item.id !== season.id));
      toast.info(`Đã xóa mùa vụ "${season.productName}"`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Month Simulator Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CalendarRange size={12} /> Thuật Toán Mùa Vụ Canh Tác
            </span>
            <span className="text-[11px] font-semibold text-gray-500">
              • Hỗ trợ vắt qua năm mới (VD: Tháng 11 → Tháng 2) • Đồng bộ AI Dự Báo Nhu Cầu
            </span>
          </div>
          <h3 className="font-bold text-base text-gray-900">
            Quản Lý & Tính Toán Trạng Thái Mùa Vụ (Tháng {selectedMonth}
            {selectedMonth === realCurrentMonth ? " - Hiện tại" : " - Mô phỏng"})
          </h3>
          <p className="text-xs text-gray-500">
            Hệ thống tự động phân loại 4 nhãn <strong>Sắp vào mùa</strong>, <strong>Đang vào mùa</strong>,{" "}
            <strong>Cuối mùa</strong>, <strong>Hết mùa</strong> và truyền hệ số sang công cụ dự báo sức mua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Clock size={13} className="text-emerald-700" />
            <span className="font-semibold text-emerald-900">Xem theo tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Chọn tháng xem mùa vụ"
              className="bg-white border border-emerald-200 rounded-lg px-2 py-1 font-bold text-emerald-900 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m} {m === realCurrentMonth ? "(Hiện tại)" : ""}
                </option>
              ))}
            </select>
          </div>

          <select
            value={farmFilter}
            onChange={(e) => setFarmFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-semibold text-gray-800"
          >
            <option value="ALL">Tất cả nông trại ({farms.length})</option>
            {farms.map((farm) => (
              <option key={farm.code} value={farm.code}>
                {farm.name} ({farm.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} /> Thêm Mùa Vụ Mới
          </button>
        </div>
      </div>

      {/* 4 Season Status KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "IN_SEASON" ? "ALL" : "IN_SEASON"))}
          className={`text-left p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer ${
            statusFilter === "IN_SEASON" ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-emerald-300"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Đang vào mùa
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{counts.IN_SEASON}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Sản lượng & sức mua cao nhất</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "UPCOMING" ? "ALL" : "UPCOMING"))}
          className={`text-left p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer ${
            statusFilter === "UPCOMING" ? "border-sky-600 ring-2 ring-sky-500/20" : "border-gray-200 hover:border-sky-300"
          }`}
        >
          <div className="text-[11px] font-bold text-sky-700 uppercase flex items-center gap-1.5">
            <Sparkles size={14} /> Sắp vào mùa
          </div>
          <div className="text-2xl font-extrabold text-sky-700 mt-1">{counts.UPCOMING}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Chuẩn bị phân bón & xuống giống</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "LATE_SEASON" ? "ALL" : "LATE_SEASON"))}
          className={`text-left p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer ${
            statusFilter === "LATE_SEASON" ? "border-amber-600 ring-2 ring-amber-500/20" : "border-gray-200 hover:border-amber-300"
          }`}
        >
          <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1.5">
            <Sun size={14} /> Cuối mùa
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{counts.LATE_SEASON}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Tháng cuối vụ, ưu tiên thu dứt điểm</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "OFF_SEASON" ? "ALL" : "OFF_SEASON"))}
          className={`text-left p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer ${
            statusFilter === "OFF_SEASON" ? "border-slate-600 ring-2 ring-slate-500/20" : "border-gray-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
            <Sprout size={14} /> Hết mùa
          </div>
          <div className="text-2xl font-extrabold text-slate-700 mt-1">{counts.OFF_SEASON}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Nghỉ đất / dưỡng cây chờ vụ mới</div>
        </button>
      </div>

      {/* Season Cards Grid */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
          <RefreshCw size={22} className="animate-spin mx-auto text-emerald-600 mb-2" />
          Đang tính toán trạng thái mùa vụ từ máy chủ...
        </div>
      ) : visibleSeasons.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center text-xs text-gray-500 space-y-2">
          <CalendarRange size={30} className="mx-auto text-emerald-600/50" />
          <p className="font-semibold">Chưa có cấu hình mùa vụ nào trong bộ lọc này.</p>
          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
            >
              Xem tất cả mùa vụ
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleSeasons.map((season) => {
            const evalRes = evaluateSeasonStatusClient(
              season.startMonth,
              season.endMonth,
              selectedMonth
            );
            const code = (season.seasonCode || evalRes.code) as LocalSeasonCode;
            const label = season.seasonLabel || evalRes.label;
            const isCrossYear = season.crossYear ?? evalRes.crossYear;
            const duration = season.durationMonths ?? evalRes.durationMonths;
            const style = SEASON_STYLE_MAP[code] || SEASON_STYLE_MAP.OFF_SEASON;

            return (
              <div
                key={season.id}
                className={`bg-white rounded-2xl border ${style.border} p-5 shadow-xs space-y-3.5 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {season.farmCode && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {season.farmCode}
                        </span>
                      )}
                      {isCrossYear && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                          Vắt qua năm mới
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.pill}`}>
                      {label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">{season.productName}</h4>
                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Khung vụ: <strong className="text-emerald-800">Tháng {season.startMonth} → Tháng {season.endMonth}</strong> ({duration} tháng)
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        Hệ số AI: <strong className="text-gray-800">×{season.effectiveDemandMultiplier ?? season.peakMultiplier ?? 1.3}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 12-Month Calendar Bar */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const inSpan = isMonthActiveInSpan(season.startMonth, season.endMonth, m);
                        const isSelectedMonth = m === selectedMonth;
                        return (
                          <div
                            key={m}
                            className={`text-center py-1 rounded text-[10px] font-bold transition-all ${
                              inSpan
                                ? isSelectedMonth
                                  ? "bg-emerald-700 text-white ring-2 ring-emerald-400"
                                  : "bg-emerald-100 text-emerald-800"
                                : isSelectedMonth
                                ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400"
                                : "bg-gray-100 text-gray-400"
                            }`}
                            title={`Tháng ${m}`}
                          >
                            T{m}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {season.notes && (
                    <p className="text-[11px] text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      {season.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openEditModal(season)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={13} /> Chỉnh sửa mùa vụ
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSeason(season)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Xóa cấu hình mùa vụ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Crop Season */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default"
          >
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CalendarRange size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingSeason ? "Chỉnh Sửa Cấu Hình Mùa Vụ" : "Khai Báo Mùa Vụ Nông Sản Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nông trại áp dụng *</label>
                  <select
                    value={formFarmCode}
                    onChange={(e) => setFormFarmCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {farms.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nhóm cây trồng</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    <option value="trai_cay">Trái cây</option>
                    <option value="rau_la">Rau ăn lá</option>
                    <option value="cu_qua">Củ quả sạch</option>
                    <option value="nam_dac_san">Nấm & Đặc sản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên nông sản *</label>
                <input
                  type="text"
                  required
                  list="crop-season-products"
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  placeholder="VD: Dâu Tây New Zealand, Xoài Cát Chu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
                <datalist id="crop-season-products">
                  {productNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tháng bắt đầu *</label>
                  <select
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold"
                  >
                    {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tháng kết thúc *</label>
                  <select
                    value={formEndMonth}
                    onChange={(e) => setFormEndMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold"
                  >
                    {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Hệ số chính vụ AI</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="2.0"
                    value={formPeakMultiplier}
                    onChange={(e) => setFormPeakMultiplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Live Algorithm Preview Box */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">
                    Kết quả tính cho Tháng {selectedMonth}:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${SEASON_STYLE_MAP[liveModalPreview.code].pill}`}>
                    {liveModalPreview.label}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-900/90">
                  Thời gian mùa vụ: <strong>Tháng {formStartMonth} → Tháng {formEndMonth}</strong> ({liveModalPreview.durationMonths} tháng)
                  {liveModalPreview.crossYear && (
                    <span className="ml-2 font-bold text-purple-800">• Tự động nhận diện mùa vắt qua năm mới</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Ghi chú kỹ thuật canh tác</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="VD: Thời điểm bón phân, chuẩn bị cây giống, lưu ý thời tiết..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save size={14} /> {submitting ? "Đang lưu..." : "Lưu Cấu Hình Mùa Vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
