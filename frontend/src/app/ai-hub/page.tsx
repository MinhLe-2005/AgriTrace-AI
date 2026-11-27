"use client";

import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Package,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { GeminiChatWidget } from "@/components/ai-chat/gemini-chat-widget";

export default function AiHubPage() {
  const [activeTab, setActiveTab] = useState<"chatbot" | "forecast" | "risks">("chatbot");

  const forecastData = [
    {
      name: "Dâu Tây Giống Nhật Mộc Châu",
      currentStock: "140 hộp",
      forecast7d: "380 hộp",
      trend: "+38% (Cao điểm)",
      action: "Cần tăng thu hoạch thêm 240 hộp từ HTX Mộc Châu",
      status: "warning",
    },
    {
      name: "Xà Lách Thủy Canh Lô Lô",
      currentStock: "520 gói",
      forecast7d: "490 gói",
      trend: "Ổn định",
      action: "Tồn kho đủ đáp ứng 7 ngày tới theo chuẩn FEFO",
      status: "good",
    },
    {
      name: "Cam Sành Bố Hạ",
      currentStock: "850 kg",
      forecast7d: "1.200 kg",
      trend: "+42% (Chính vụ)",
      action: "Kích hoạt nhập kho bổ sung từ vườn Bắc Giang",
      status: "warning",
    },
    {
      name: "Bơ Sáp 034 Tây Nguyên",
      currentStock: "310 kg",
      forecast7d: "180 kg",
      trend: "-25% (Cuối mùa)",
      action: "Khuyến nghị xả kho ưu tiên và giảm sản lượng nhập mới",
      status: "danger",
    },
  ];

  const riskAlerts = [
    {
      level: "CAO (High)",
      color: "#dc2626",
      type: "Hạn sử dụng FEFO",
      target: "Lô Cải Kale KL-2026-05",
      detail: "Còn 2 ngày trước khi hết hạn lưu kho tốt nhất. Hiện còn tồn 45 túi tại Kho Tân Bình.",
      suggestion: "Kích hoạt xuất kho ưu tiên cho đơn hàng sỉ hoặc áp voucher giảm 30%.",
    },
    {
      level: "TRUNG BÌNH (Medium)",
      color: "#ea580c",
      type: "Cảnh báo Mùa Vụ",
      target: "Bơ Sáp 034",
      detail: "Trái cây cuối vụ, thời gian bảo quản rút ngắn còn 5 ngày thay vì 10 ngày.",
      suggestion: "Tự động gửi cảnh báo cho nhân viên kho kiểm tra nhiệt độ mát 5°C liên tục.",
    },
    {
      level: "TRUNG BÌNH (Medium)",
      color: "#ea580c",
      type: "Chứng nhận sắp hết hạn",
      target: "Chứng nhận VietGAP #VG-2024-889",
      detail: "Hồ sơ chứng nhận của Nông Trại Xanh còn 45 ngày nữa là hết hiệu lực kiểm định.",
      suggestion: "Hệ thống tự động thông báo cho chủ nông trại chuẩn bị hồ sơ tái kiểm định.",
    },
    {
      level: "THẤP (Low)",
      color: "#2563eb",
      type: "Vận chuyển",
      target: "Đơn giao #ORD-8841",
      detail: "Tuyến đường QL20 có lưu lượng cao, nguy cơ giao hàng trễ 30 phút so với hẹn.",
      suggestion: "Cập nhật lộ trình thay thế cho tài xế và gửi SMS báo cho khách hàng.",
    },
  ];

  return (
    <div className="bg-[#FBF9F5] text-[#16261E] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#16261E] via-[#1B3326] to-[#16261E] text-white p-6 sm:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-[#243B2E]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-lg">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">Trung Tâm Trí Tuệ Nhân Tạo AgriTrace</h1>
                <span className="text-[11px] font-mono bg-amber-400/15 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  AI Intelligence Hub
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                Giải pháp AI hỗ trợ tự động hóa chuỗi cung ứng nông sản sạch: Trợ lý tra cứu, dự báo nhu cầu & cảnh báo rủi ro kho lạnh.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core AI Pillars Tab Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab("chatbot")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "chatbot"
                ? "bg-white border-[#166534] shadow-md ring-2 ring-emerald-700/15"
                : "bg-[#F6F3EC] border-[#E4DFD5] hover:bg-white text-stone-600"
            }`}
          >
            <div className="flex items-center gap-2 text-[#166534] font-bold text-sm mb-1">
              <Bot size={18} />
              <span>AI 1: Chatbot Tư Vấn Nguồn Gốc</span>
            </div>
            <p className="text-xs text-stone-500">Tra cứu trực tiếp lô hàng, ngày thu hoạch & chứng nhận VietGAP</p>
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "forecast"
                ? "bg-white border-[#166534] shadow-md ring-2 ring-emerald-700/15"
                : "bg-[#F6F3EC] border-[#E4DFD5] hover:bg-white text-stone-600"
            }`}
          >
            <div className="flex items-center gap-2 text-[#16261E] font-bold text-sm mb-1">
              <TrendingUp size={18} className="text-emerald-700" />
              <span>AI 2: Dự Đoán Nhu Cầu 7 Ngày</span>
            </div>
            <p className="text-xs text-stone-500">Dự báo lượng tiêu thụ & gợi ý nhập hàng kết hợp mùa vụ</p>
          </button>

          <button
            onClick={() => setActiveTab("risks")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "risks"
                ? "bg-white border-[#166534] shadow-md ring-2 ring-emerald-700/15"
                : "bg-[#F6F3EC] border-[#E4DFD5] hover:bg-white text-stone-600"
            }`}
          >
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <AlertTriangle size={18} />
              <span>AI 3: Cảnh Báo Rủi Ro Chuỗi</span>
            </div>
            <p className="text-xs text-stone-500">Lô cận hạn, tồn kho FEFO & nguy cơ giao hàng trễ</p>
          </button>
        </div>

        {/* TAB 1: AI CHATBOT (GEMINI) */}
        {activeTab === "chatbot" && (
          <div className="space-y-4">
            <GeminiChatWidget minHeight="620px" />
          </div>
        )}

        {/* TAB 2: DEMAND FORECASTING */}
        {activeTab === "forecast" && (
          <div className="bento-card p-6 space-y-5">
            <div className="border-b border-[#F0ECE1] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#16261E] flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#166534]" /> Bảng Dự Đoán Nhu Cầu Tiêu Thụ Trong 7 Ngày Tới
                </h3>
                <p className="text-xs text-stone-500">
                  Phân tích chuỗi thời gian dựa trên lịch sử bán hàng, xu hướng mùa vụ và sự kiện khuyến mãi
                </p>
              </div>
              <span className="text-xs font-mono bg-[#F6F3EC] text-[#16261E] border border-[#E4DFD5] font-semibold px-2.5 py-1 rounded-full">
                7-Day ML Forecast
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E4DFD5] text-stone-500 uppercase text-[11px] font-mono font-bold">
                    <th className="py-2.5 px-3">Tên Nông Sản</th>
                    <th className="py-2.5 px-3">Tồn Kho Hiện Tại</th>
                    <th className="py-2.5 px-3">Dự Báo Cần (7 ngày)</th>
                    <th className="py-2.5 px-3">Xu Hướng</th>
                    <th className="py-2.5 px-3">Gợi Ý Hành Động (AI Recommendation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {forecastData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBF9F5]">
                      <td className="py-3 px-3 font-bold text-[#16261E]">{row.name}</td>
                      <td className="py-3 px-3 font-mono text-stone-700">{row.currentStock}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#166534]">{row.forecast7d}</td>
                      <td className="py-3 px-3 font-semibold text-amber-800">{row.trend}</td>
                      <td className="py-3 px-3 text-stone-600">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RISK ALERTS */}
        {activeTab === "risks" && (
          <div className="bento-card p-6 space-y-4">
            <div className="border-b border-[#F0ECE1] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#16261E] flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-700" /> Hệ Thống Cảnh Báo Rủi Ro Chuỗi Cung Ứng
                </h3>
                <p className="text-xs text-stone-500">
                  Tự động phát hiện nông sản sắp cận hạn, hàng tồn kho lệch chuẩn và cảnh báo nhiệt độ xe lạnh
                </p>
              </div>
              <span className="text-xs font-mono bg-red-50 text-red-800 border border-red-200 font-semibold px-2.5 py-1 rounded-full">
                Real-time Rule Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-[#E4DFD5] bg-[#FBF9F5] space-y-2 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{ backgroundColor: alert.color }}
                      className="text-white text-[10px] font-bold px-2 py-0.5 rounded"
                    >
                      Mức độ: {alert.level}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{alert.type}</span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{alert.target}</h4>
                  <p className="text-xs text-gray-600">{alert.detail}</p>
                  <div className="pt-2 border-t border-gray-200 text-xs text-emerald-800 font-medium">
                    Khuyến nghị xử lý: {alert.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
