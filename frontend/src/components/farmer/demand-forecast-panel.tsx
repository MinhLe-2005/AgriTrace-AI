"use client";

import {
  AlertTriangle,
  Bot,
  CalendarRange,
  CheckCircle2,
  PackageCheck,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  farmerService,
  type ApiDemandForecastResponse,
  type ApiForecastProductItem,
} from "@/services/farmer.service";
import { toast } from "@/stores/toast-store";

type FarmOption = {
  code: string;
  name: string;
};

type DemandForecastPanelProps = {
  ownerId: string;
  farms: FarmOption[];
  onPlanHarvestBatch: (item: ApiForecastProductItem) => void;
};

const QUICK_AI_PROMPTS = [
  "Tuần tới tôi nên ưu tiên thu hoạch sản phẩm nào để tránh thiếu hàng?",
  "Nông sản nào có nguy cơ dư thừa và cách xử lý tối ưu?",
  "Đề xuất lịch gieo trồng gối vụ trong 30 ngày tới theo mùa vụ hiện tại.",
];

function renderAdvisorRichText(text: string) {
  return text.split("\n").map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-1.5" />;
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className="leading-relaxed">
        {parts.map((part, partIdx) =>
          part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
            <strong key={partIdx} className="font-bold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={partIdx}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export function DemandForecastPanel({
  ownerId,
  farms,
  onPlanHarvestBatch,
}: DemandForecastPanelProps) {
  const [horizonDays, setHorizonDays] = useState<7 | 14 | 30>(7);
  const [farmFilter, setFarmFilter] = useState<string>("ALL");
  const [forecast, setForecast] = useState<ApiDemandForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [advisorQuestion, setAdvisorQuestion] = useState<string>("");
  const [advisorReply, setAdvisorReply] = useState<string>("");
  const [advisorModel, setAdvisorModel] = useState<string>("");
  const [askingAi, setAskingAi] = useState<boolean>(false);

  const loadForecast = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await farmerService.getDemandForecast({
        ownerId,
        farmCode: farmFilter,
        horizonDays,
      });
      setForecast(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải dữ liệu dự báo nhu cầu AI";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ownerId, farmFilter, horizonDays]);

  useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  const handleAskAdvisor = async (customQuestion?: string) => {
    if (!forecast) return;
    const questionText = (customQuestion ?? advisorQuestion).trim();
    setAskingAi(true);
    try {
      const res = await farmerService.askForecastAdvisor(forecast, questionText || undefined);
      setAdvisorReply(res.advice);
      setAdvisorModel(res.model);
      if (!customQuestion) setAdvisorQuestion("");
    } catch {
      toast.error("Không thể lấy tư vấn chi tiết từ trợ lý AI lúc này.");
    } finally {
      setAskingAi(false);
    }
  };

  const maxTimelineValue = useMemo(() => {
    if (!forecast?.timeline?.length) return 10;
    return Math.max(
      10,
      ...forecast.timeline.map((p) => Math.max(p.predictedDemand, p.supplyBaseline))
    );
  }, [forecast]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles size={12} /> AI Demand Forecast
            </span>
            {forecast && (
              <span className="text-[11px] font-semibold text-gray-500">
                • {forecast.currentSeasonName} • Phân tích {forecast.analyzedOrdersCount} đơn hàng lịch sử
              </span>
            )}
          </div>
          <h3 className="font-bold text-base text-gray-900">
            Dự Báo Sức Mua & Kế Hoạch Gieo Trồng / Thu Hoạch ({horizonDays} Ngày Tới)
          </h3>
          <p className="text-xs text-gray-500">
            Kết hợp dữ liệu đơn hàng thực tế, mùa vụ cây trồng, tồn kho vườn và các chiến dịch ưu đãi để cảnh báo thiếu hàng hoặc dư thừa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setHorizonDays(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  horizonDays === days
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {days} ngày
              </button>
            ))}
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
            onClick={() => void loadForecast()}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Phân tích lại AI
          </button>
        </div>
      </div>

      {loading && !forecast ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
          <RefreshCw size={24} className="animate-spin mx-auto text-emerald-600 mb-2" />
          Đang tổng hợp lịch sử đơn hàng, mùa vụ và tồn kho nông trại...
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-xs font-bold text-rose-800">{errorMsg}</p>
          <button
            type="button"
            onClick={() => void loadForecast()}
            className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : forecast ? (
        <>
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                Nhu cầu dự báo ({forecast.horizonDays} ngày)
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {Math.round(forecast.totalPredictedDemand).toLocaleString("vi-VN")} <span className="text-xs font-semibold text-gray-500">đơn vị</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                Cập nhật lúc {forecast.generatedAt}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <PackageCheck size={14} className="text-blue-600" />
                Nguồn cung hiện có
              </div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">
                {Math.round(forecast.totalAvailableSupply).toLocaleString("vi-VN")} <span className="text-xs font-semibold text-gray-500">đơn vị</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Từ tồn kho gian hàng & lô chưa xuất
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
              <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-600" />
                Cần tăng thu hoạch (Thiếu)
              </div>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">
                {forecast.deficitCount} <span className="text-xs font-semibold">nông sản</span>
              </div>
              <div className="text-[11px] text-rose-700/80 mt-0.5">
                Sức mua dự báo vượt cung hiện tại
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1.5">
                <TrendingDown size={14} className="text-amber-600" />
                Nguy cơ dư thừa / Chậm
              </div>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {forecast.surplusCount} <span className="text-xs font-semibold">nông sản</span>
              </div>
              <div className="text-[11px] text-amber-800/80 mt-0.5">
                {forecast.balancedCount} nông sản đang cân bằng
              </div>
            </div>
          </div>

          {/* Executive Summary & Timeline Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <CalendarRange size={16} className="text-emerald-700" />
                    Biểu Đồ Dự Báo Nhu Cầu Theo Thời Gian ({forecast.horizonDays} Ngày)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    So sánh sức mua dự báo (xanh ngọc) so với mức cung bình quân (xám xanh) qua từng giai đoạn.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Nhu cầu dự báo
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" /> Nguồn cung TB
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 px-1 border-b border-gray-100 pb-2">
                {forecast.timeline.map((point) => {
                  const demandHeightPct = Math.max(8, Math.round((point.predictedDemand / maxTimelineValue) * 100));
                  const supplyHeightPct = Math.max(6, Math.round((point.supplyBaseline / maxTimelineValue) * 100));
                  return (
                    <div key={point.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="text-[10px] font-bold text-emerald-800">
                        {Math.round(point.predictedDemand)}
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-28">
                        <div
                          style={{ height: `${demandHeightPct}%` }}
                          className="w-4 sm:w-5 rounded-t-md bg-emerald-600 transition-all"
                          title={`Dự báo nhu cầu: ${point.predictedDemand}`}
                        />
                        <div
                          style={{ height: `${supplyHeightPct}%` }}
                          className="w-3 sm:w-3.5 rounded-t-md bg-slate-300 transition-all"
                          title={`Nguồn cung bình quân: ${point.supplyBaseline}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 truncate max-w-full">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-950 leading-relaxed">
                <strong className="text-emerald-900">Tóm tắt AI: </strong>
                {forecast.executiveSummary}
              </div>
            </div>

            {/* Interactive AI Strategy Advisor */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Bot size={17} className="text-emerald-700" />
                    Trợ Lý Chiến Lược Mùa Vụ AI
                  </h4>
                  {advisorModel && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {advisorModel}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AI_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={askingAi}
                      onClick={() => void handleAskAdvisor(prompt)}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-medium cursor-pointer transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-xs text-gray-700 min-h-[120px] max-h-56 overflow-y-auto space-y-1.5">
                  {askingAi ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <RefreshCw size={13} className="animate-spin" /> AI đang phân tích kịch bản canh tác...
                    </span>
                  ) : advisorReply ? (
                    renderAdvisorRichText(advisorReply)
                  ) : (
                    "Chọn câu hỏi gợi ý bên trên hoặc nhập tình huống thực tế của vườn (VD: thời tiết mưa kéo dài, muốn mở rộng luống mới...) để nhận tư vấn cân đối sản lượng."
                  )}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAskAdvisor();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={advisorQuestion}
                  onChange={(e) => setAdvisorQuestion(e.target.value)}
                  placeholder="Hỏi AI về kế hoạch thu hoạch / gieo trồng..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                />
                <button
                  type="submit"
                  disabled={askingAi}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send size={13} /> Hỏi AI
                </button>
              </form>
            </div>
          </div>

          {/* Product-Level Forecast Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  Chi Tiết Dự Báo & Đề Xuất Sản Lượng Theo Từng Nông Sản
                </h4>
                <p className="text-[11px] text-gray-500">
                  Độ tin cậy dựa trên lịch sử bán hàng (7-90 ngày), hệ số mùa vụ hiện tại và chiến dịch khuyến mãi đang chạy.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {forecast.items.length} nông sản được phân tích
              </span>
            </div>

            {forecast.items.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Nông trại này chưa có sản phẩm hoặc lô thu hoạch nào để phân tích.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-4">Nông Sản & Nguồn Dữ Liệu</th>
                      <th className="py-3 px-4">Mùa Vụ & Xu Hướng</th>
                      <th className="py-3 px-4">Nguồn Cung Hiện Tại</th>
                      <th className="py-3 px-4">Dự Báo Sức Mua ({forecast.horizonDays}N)</th>
                      <th className="py-3 px-4">Cân Bằng & Đề Xuất Gieo/Thu Hoạch</th>
                      <th className="py-3 px-4 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {forecast.items.map((item) => {
                      const isDeficit = item.riskStatus === "DEFICIT";
                      const isSurplus = item.riskStatus === "SURPLUS";
                      return (
                        <tr key={item.productId} className="hover:bg-gray-50/70 transition-colors align-top">
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="font-bold text-gray-900">{item.productName}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {item.farmName} {item.farmCode ? `(${item.farmCode})` : ""}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-1">
                              {item.dataBasis} • Tin cậy {item.confidencePercent}%
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.seasonPhase} (x{item.seasonalMultiplier})
                            </span>
                            <div
                              className={`text-[11px] font-bold mt-1 ${
                                item.growthPercent >= 0 ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              Xu hướng: {item.growthPercent >= 0 ? `+${item.growthPercent}%` : `${item.growthPercent}%`}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Bán 7N: <strong>{item.soldLast7Days}</strong> · 30N: <strong>{item.soldLast30Days}</strong> {item.unit}
                            </div>
                            {item.activeCampaignTitle && (
                              <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                                Chiến dịch: {item.activeCampaignTitle}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">
                            {item.currentSupply} {item.unit}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-extrabold text-emerald-800 text-sm">
                              {item.predictedDemand} {item.unit}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              ~{item.avgDailyDemand} {item.unit}/ngày
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-[300px] space-y-1">
                            {isDeficit ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle size={11} /> Thiếu hàng (~{Math.abs(Math.round(item.supplyGap))} {item.unit})
                              </span>
                            ) : isSurplus ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <TrendingDown size={11} /> Nguy cơ dư thừa (+{Math.round(item.supplyGap)} {item.unit})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={11} /> Cân bằng cung cầu
                              </span>
                            )}
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              {item.recommendation}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isDeficit || item.recommendedPrepQty > 0 ? (
                              <button
                                type="button"
                                onClick={() => onPlanHarvestBatch(item)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Plus size={12} /> Lập Lô Thu Hoạch
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-gray-400">
                                Không cần tăng thu hái
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
