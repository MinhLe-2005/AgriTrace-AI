"use client";

import { useState } from "react";

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "support">("ai");
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot" | "support"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Xin chào! Mình là AgriTrace AI Assistant. Bạn cần tra cứu nguồn gốc lô nông sản, mùa vụ thu hoạch hay chứng nhận chất lượng nào hôm nay?",
      time: "Vừa xong",
    },
  ]);

  const quickQuestions = [
    "Lô xà lách thủy canh XL-2026-08 thu hoạch ngày nào?",
    "Nông sản nào đang vào chính vụ tháng này?",
    "Chứng nhận VietGAP của Nông Trại Xanh còn hiệu lực không?",
    "Làm sao để quét mã QR truy xuất nguồn gốc?",
  ];

  function handleSend(textToSend?: string) {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal("");

    // Simulate smart AI response
    setTimeout(() => {
      let reply = "";
      if (text.includes("XL-2026-08") || text.includes("thu hoạch")) {
        reply = "Tra cứu hệ thống AgriTrace AI: Lô Xà Lách Thủy Canh [XL-2026-08] được thu hoạch ngày 12/10/2026 tại Nông Trại Xanh Đà Lạt (Mã NT: NT-DL-01). Trạng thái kiểm định: ĐÃ DUYỆT (VietGAP #VG-2024-889). Bạn có thể quét mã QR trên bao bì để xem nhật ký vận chuyển.";
      } else if (text.includes("mùa vụ") || text.includes("chính vụ")) {
        reply = "Nông sản đang vào chính vụ tháng 10: Dâu tây Đà Lạt, Bơ sáp Tây Nguyên, Cam sành Hàm Yên và Cải kale Mộc Châu. Tất cả đều có sẵn ưu đãi giảm 10% theo chương trình Voucher Mùa Vụ.";
      } else if (text.includes("VietGAP") || text.includes("chứng nhận")) {
        reply = "Chứng nhận VietGAP số #VG-2024-889 của Nông Trại Xanh do Chi cục Trồng trọt & BVTV cấp, có hiệu lực đến 15/12/2026. Hồ sơ đã được xác minh toàn diện trên hệ thống AgriTrace.";
      } else if (activeTab === "support") {
        reply = "Chủ nông trại (Farmer Nguyễn Văn Hùng): Cảm ơn quý khách đã nhắn tin. Lô hàng rau củ của bên mình vừa thu hái sáng sớm nay, bảo quản lạnh nhiệt độ tiêu chuẩn 5°C. Bạn cần ship gấp hay giao định kỳ ạ?";
      } else {
        reply = `[AgriTrace AI]: Đã tiếp nhận yêu cầu về "${text}". Dữ liệu được trích xuất từ cơ sở dữ liệu chuỗi cung ứng. Bạn có thể xem chi tiết tại mục 'Truy Xuất QR' hoặc chuyển qua tab 'Chat Nhân Viên' để được tư vấn trực tiếp.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: activeTab === "ai" ? "bot" : "support",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 600);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#156e34] to-[#25a854] text-white rounded-full shadow-2xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">

            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-[#156e34]"></span>
          </div>
          <div className="text-left">
            <div className="text-[13px] font-bold leading-tight">Trợ Lý Nông Sản AI</div>
            <div className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span>Hỏi đáp & Chat hỗ trợ</span>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[370px] sm:w-[410px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-[#0f2e1b] text-white p-3.5 flex items-center justify-between border-b border-emerald-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                {activeTab === "ai" ? "AI" : "Hỗ trợ"}
              </div>
              <div>
                <div className="text-[14px] font-bold leading-tight">
                  {activeTab === "ai" ? "AgriTrace AI Assistant" : "Hộp Thư Nhân Viên & Chủ Hàng"}
                </div>
                <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeTab === "ai" ? "Trí tuệ nhân tạo (LLM + DB Nông sản)" : "Trực tuyến • Sẵn sàng giải đáp"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-emerald-800 text-gray-300 hover:text-white transition-colors"
            >

            </button>
          </div>

          {/* Tab Switcher (AI vs Staff Chat - Module 4.1 vs 5.1) */}
          <div className="grid grid-cols-2 bg-gray-100 p-1 border-b border-gray-200 text-[12px] font-semibold">
            <button
              onClick={() => setActiveTab("ai")}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "ai"
                  ? "bg-white text-[#1a7a3a] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >

              <span>AI Chatbot Nông Sản</span>
            </button>
            <button
              onClick={() => setActiveTab("support")}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "support"
                  ? "bg-white text-[#1a7a3a] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >

              <span>Chat Nhân Viên / Chủ Hàng</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#fbfdfb]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender !== "user" && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5 ${
                    m.sender === "bot" ? "bg-emerald-600" : "bg-blue-600"
                  }`}>
                    {m.sender === "bot" ? "Hệ thống" : "Nhân viên"}
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-[13px] leading-relaxed shadow-xs ${
                    m.sender === "user"
                      ? "bg-[#1a7a3a] text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`block text-[10px] mt-1 ${m.sender === "user" ? "text-emerald-100 text-right" : "text-gray-400"}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Quick Prompts (only in AI tab) */}
            {activeTab === "ai" && (
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-gray-400 mb-1.5">Gợi ý câu hỏi nhanh:</div>
                <div className="flex flex-col gap-1.5">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-left text-[12px] bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#1a7a3a] p-2 rounded-xl border border-gray-200/80 transition-colors flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-2.5 border-t border-gray-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={
                  activeTab === "ai"
                    ? "Hỏi nguồn gốc, ngày thu hoạch, mã QR..."
                    : "Nhắn tin với nhân viên / chủ nông trại..."
                }
                className="flex-1 px-3 py-2 text-[13px] rounded-xl border border-gray-300 focus:outline-none focus:border-[#1a7a3a] focus:ring-1 focus:ring-[#1a7a3a]"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2 rounded-xl bg-[#1a7a3a] hover:bg-[#156e34] disabled:opacity-40 text-white transition-colors"
              >

              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
