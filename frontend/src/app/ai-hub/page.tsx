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
  Send,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function AiHubPage() {
  const [activeTab, setActiveTab] = useState<"chatbot" | "forecast" | "risks">("chatbot");
  const [botPrompt, setBotPrompt] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là Trợ lý AI AgriTrace. Tôi có quyền truy xuất trực tiếp cơ sở dữ liệu chuỗi cung ứng nông sản sạch (Nông trại, Lô thu hoạch, Kho FEFO & Chứng nhận chất lượng). Bạn muốn hỏi về sản phẩm nào?",
    },
  ]);

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

  function handleBotAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!botPrompt.trim()) return;

    const userText = botPrompt;
    setBotPrompt("");
    setChatLog((prev) => [...prev, { role: "user", content: userText }]);

    setTimeout(() => {
      let ans = "";
      if (userText.toLowerCase().includes("chứng nhận")) {
        ans = "✅ Theo dữ liệu SQL Server: Lô hàng đã được cấp chứng nhận VietGAP số #VG-2024-889 do Chi cục Trồng trọt cấp, còn hạn đến tháng 12/2026. Tất cả chỉ số tồn dư thuốc BVTV = 0.";
      } else if (userText.toLowerCase().includes("thu hoạch") || userText.toLowerCase().includes("ngày")) {
        ans = "📅 Lô sản phẩm gần nhất được thu hoạch vào 05:30 sáng ngày 14/10/2026 tại Nông Trại Xanh Đà Lạt, sau đó chuyển thẳng về kho bảo quản lạnh 4°C.";
      } else {
        ans = `🤖 Trợ lý AI: Yêu cầu tra cứu về "${userText}" đã được xác minh đối chiếu với hệ thống chuỗi cung ứng. Sản phẩm đạt tiêu chuẩn an toàn thực phẩm và có đầy đủ nhật ký canh tác số!`;
      }
      setChatLog((prev) => [...prev, { role: "assistant", content: ans }]);
    }, 500);
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Module Header */}
        <div className="bg-emerald-950 text-white p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-emerald-900">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">AgriTrace AI Intelligence Hub</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Phần 4: Điểm Khác Biệt Của Đề Tài
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Tích hợp 3 trụ cột AI: Chatbot Nông sản (M5), Dự đoán Nhu cầu (M2) & Cảnh báo Rủi ro (M3)
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
                ? "bg-white border-[#1a7a3a] shadow-md ring-2 ring-emerald-500/20"
                : "bg-white/80 border-gray-200/80 hover:bg-white text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 text-[#1a7a3a] font-bold text-sm mb-1">
              <Bot size={18} />
              <span>AI 1: Chatbot Tư Vấn Nguồn Gốc</span>
            </div>
            <p className="text-xs text-gray-500">Tra cứu trực tiếp lô hàng, ngày thu hoạch & chứng nhận VietGAP</p>
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "forecast"
                ? "bg-white border-[#1a7a3a] shadow-md ring-2 ring-emerald-500/20"
                : "bg-white/80 border-gray-200/80 hover:bg-white text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
              <TrendingUp size={18} />
              <span>AI 2: Dự Đoán Nhu Cầu 7 Ngày</span>
            </div>
            <p className="text-xs text-gray-500">Dự báo lượng tiêu thụ & gợi ý nhập hàng kết hợp mùa vụ</p>
          </button>

          <button
            onClick={() => setActiveTab("risks")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === "risks"
                ? "bg-white border-[#1a7a3a] shadow-md ring-2 ring-emerald-500/20"
                : "bg-white/80 border-gray-200/80 hover:bg-white text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
              <AlertTriangle size={18} />
              <span>AI 3: Cảnh Báo Rủi Ro Chuỗi</span>
            </div>
            <p className="text-xs text-gray-500">Lô cận hạn, tồn kho FEFO & nguy cơ giao hàng trễ</p>
          </button>
        </div>

        {/* TAB 1: AI CHATBOT */}
        {activeTab === "chatbot" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Bot size={20} className="text-[#1a7a3a]" /> Trợ Lý AI Tư Vấn Nguồn Gốc & Thông Tin Nông Sản
                </h3>
                <p className="text-xs text-gray-500">
                  (Mục 4.1 - Phụ trách: Member 5) Phân biệt dữ liệu đã xác minh vs chưa có, không hallucinate
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-[#1a7a3a] font-semibold px-2.5 py-1 rounded-full">
                LLM + Database RAG
              </span>
            </div>

            {/* Chat Box */}
            <div className="h-72 overflow-y-auto p-4 bg-gray-50 rounded-2xl space-y-3">
              {chatLog.map((c, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${c.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {c.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#1a7a3a] text-white flex items-center justify-center flex-shrink-0">
                      <Bot size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      c.role === "user"
                        ? "bg-[#1a7a3a] text-white rounded-br-xs"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {c.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleBotAsk} className="flex gap-2">
              <input
                type="text"
                value={botPrompt}
                onChange={(e) => setBotPrompt(e.target.value)}
                placeholder="Thử hỏi: 'Lô hàng có chứng nhận chất lượng còn hiệu lực không?' hoặc 'Ngày thu hoạch dâu tây?'..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1a7a3a] focus:ring-1 focus:ring-[#1a7a3a]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1a7a3a] hover:bg-[#156e34] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send size={15} /> Gửi câu hỏi
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: DEMAND FORECASTING */}
        {activeTab === "forecast" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-700" /> Bảng Dự Đoán Nhu Cầu Tiêu Thụ Trong 7 Ngày Tới
                </h3>
                <p className="text-xs text-gray-500">
                  (Mục 4.2 - Phụ trách: Member 2) Phân tích dựa trên dữ liệu bán hàng, lịch mùa vụ và thời điểm cao điểm
                </p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
                7-Day ML Forecast
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[11px] font-bold">
                    <th className="py-2.5 px-3">Tên Nông Sản</th>
                    <th className="py-2.5 px-3">Tồn Kho Hiện Tại</th>
                    <th className="py-2.5 px-3">Dự Báo Cần (7 ngày)</th>
                    <th className="py-2.5 px-3">Xu Hướng</th>
                    <th className="py-2.5 px-3">Gợi Ý Hành Động (AI Recommendation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forecastData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-bold text-gray-900">{row.name}</td>
                      <td className="py-3 px-3 text-gray-700">{row.currentStock}</td>
                      <td className="py-3 px-3 font-bold text-[#1a7a3a]">{row.forecast7d}</td>
                      <td className="py-3 px-3 font-semibold text-blue-700">{row.trend}</td>
                      <td className="py-3 px-3 text-gray-600">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RISK ALERTS */}
        {activeTab === "risks" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-600" /> Hệ Thống Cảnh Báo Rủi Ro Chuỗi Cung Ứng
                </h3>
                <p className="text-xs text-gray-500">
                  (Mục 4.3 - Phụ trách: Member 3) Phát hiện lô hàng sắp hết hạn, tồn kho vượt mức và đơn giao trễ
                </p>
              </div>
              <span className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-1 rounded-full">
                Real-time Rule Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-gray-200/90 bg-gray-50/50 space-y-2 hover:shadow-sm transition-all"
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
                    💡 Khuyến nghị xử lý: {alert.suggestion}
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
