"use client";

import {
  CheckCheck,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Search,
  Send,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ChatPage() {
  const [activeChannelId, setActiveChannelId] = useState("ch-1");
  const [msgInput, setMsgInput] = useState("");

  const channels = [
    {
      id: "ch-1",
      name: "Chủ Nông Trại Xanh Đà Lạt (Farmer)",
      role: "FARMER",
      roleBadge: "Chủ Nông Trại",
      roleColor: "#1a7a3a",
      lastMsg: "Dạ hàng vừa cắt sáng sớm nay, đảm bảo tươi ngon!",
      time: "10:14",
      unread: 1,
      contextProduct: "Lô Xà lách thủy canh XL-2026-08",
    },
    {
      id: "ch-2",
      name: "Tư Vấn Đơn Hàng & Vận Chuyển (Staff)",
      role: "WAREHOUSE_STAFF",
      roleBadge: "Nhân Viên Kho",
      roleColor: "#0284c7",
      lastMsg: "Đơn hàng #ORD-8841 đang được xe lạnh tiếp nhận ạ.",
      time: "Hôm qua",
      unread: 0,
      contextProduct: "Đơn hàng #ORD-8841",
    },
    {
      id: "ch-3",
      name: "Bộ Phận Chăm Sóc Khách Hàng (Admin)",
      role: "ADMIN",
      roleBadge: "Quản Trị Viên",
      roleColor: "#dc2626",
      lastMsg: "Cảm ơn bạn đã đánh giá 5 sao cho nông sản sạch!",
      time: "12/10",
      unread: 0,
      contextProduct: "Khiếu nại & Voucher",
    },
  ];

  const [chatHistories, setChatHistories] = useState<Record<string, Array<{ sender: "me" | "them"; text: string; time: string }>>>({
    "ch-1": [
      { sender: "me", text: "Chào nhà vườn, xà lách thủy canh này trồng theo chuẩn nào thế ạ?", time: "10:10" },
      { sender: "them", text: "Dạ chào bạn! Nông trại mình trồng theo chuẩn GlobalGAP #GG-VN-2024-910, hoàn toàn trong nhà màng tự động.", time: "10:12" },
      { sender: "them", text: "Dạ hàng vừa cắt sáng sớm nay, đảm bảo tươi ngon!", time: "10:14" },
    ],
    "ch-2": [
      { sender: "me", text: "Shop ơi đơn hàng của mình đã xuất kho chưa?", time: "Hôm qua 15:30" },
      { sender: "them", text: "Đơn hàng #ORD-8841 đang được xe lạnh tiếp nhận ạ.", time: "Hôm qua 15:35" },
    ],
    "ch-3": [
      { sender: "them", text: "Cảm ơn bạn đã đánh giá 5 sao cho nông sản sạch!", time: "12/10" },
    ],
  });

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const activeMessages = chatHistories[activeChannelId] || [];

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const newMsg = {
      sender: "me" as const,
      text: msgInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistories((prev) => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
    }));
    setMsgInput("");

    // Simulate reply after 1s
    setTimeout(() => {
      setChatHistories((prev) => ({
        ...prev,
        [activeChannelId]: [
          ...(prev[activeChannelId] || []),
          {
            sender: "them",
            text: `Dạ ${activeChannel.name} đã ghi nhận thông tin từ bạn! Chúng mình sẽ phản hồi ngay qua WebSocket ạ.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    }, 800);
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="text-emerald-700" size={24} />
              <span>Hỗ Trợ & Tư Vấn Trực Tuyến</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Trao đổi trực tiếp với nhân viên hỗ trợ, nông trại và đội vận chuyển về đơn hàng của bạn.
            </p>
          </div>
          <Link
            href="/ai-hub#chatbot"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            Trợ lý tra cứu AI →
          </Link>
        </div>

        {/* Main Messenger Box */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Left: Channel List */}
          <div className="border-r border-gray-200 flex flex-col bg-gray-50/50">
            <div className="p-3.5 border-b border-gray-200 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm hội thoại, đơn hàng..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {channels.map((ch) => {
                const isSelected = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-3.5 flex gap-3 items-start transition-colors ${
                      isSelected ? "bg-emerald-50/70 border-l-4 border-[#1a7a3a]" : "hover:bg-gray-100/60"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {ch.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 truncate">{ch.name}</span>
                        <span className="text-[10px] text-gray-400">{ch.time}</span>
                      </div>
                      <span
                        style={{ color: ch.roleColor }}
                        className="inline-block text-[10px] font-semibold"
                      >
                        {ch.roleBadge}
                      </span>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{ch.lastMsg}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Message Window */}
          <div className="md:col-span-2 flex flex-col bg-white">
            {/* Header with Context */}
            <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  {activeChannel.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900">{activeChannel.name}</h3>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Đang trực tuyến • WebSocket Connected</span>
                  </div>
                </div>
              </div>

              {/* Context Banner */}
              <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[11px]">
                <Package size={13} className="text-[#1a7a3a]" />
                <span className="font-medium truncate max-w-[180px]">{activeChannel.contextProduct}</span>
              </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fafbfa]">
              {activeMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-xs leading-relaxed ${
                      msg.sender === "me"
                        ? "bg-[#1a7a3a] text-white rounded-br-xs"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className={`text-[10px] ${msg.sender === "me" ? "text-emerald-100" : "text-gray-400"}`}>
                        {msg.time}
                      </span>
                      {msg.sender === "me" && <CheckCheck size={12} className="text-emerald-200" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2 bg-white">
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Nhập tin nhắn trao đổi với nông trại / nhân viên..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1a7a3a] focus:ring-1 focus:ring-[#1a7a3a]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1a7a3a] hover:bg-[#156e34] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Send size={14} /> Gửi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
