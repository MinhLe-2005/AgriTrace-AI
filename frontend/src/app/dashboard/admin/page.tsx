"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Lock,
  Shield,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function AdminPortalPage() {
  const [pendingAccounts, setPendingAccounts] = useState([
    {
      id: "usr-01",
      name: "Nguyễn Văn Hùng",
      email: "hung.dalat@farm.vn",
      role: "FARMER",
      farmName: "Nông Trại Xanh Đà Lạt",
      certFile: "VietGAP_NTX_2024.pdf",
      date: "14/10/2026",
    },
    {
      id: "usr-02",
      name: "Lê Hoàng Long",
      email: "long.logistics@trans.vn",
      role: "DISTRIBUTOR",
      farmName: "Vận Tải Xanh Express",
      certFile: "GiayPhep_VanTaiLanh.pdf",
      date: "13/10/2026",
    },
  ]);

  const auditLogs = [
    { time: "14/10 16:45", user: "admin@agritrace.vn", action: "Cập nhật chính sách Voucher Hạng Vàng (-5%)" },
    { time: "14/10 14:20", user: "admin@agritrace.vn", action: "Duyệt tài khoản Nông dân [FM-104]" },
    { time: "14/10 11:05", user: "system_scheduler", action: "Xét hạng thành viên định kỳ (32 users thăng hạng)" },
  ];

  function approve(id: string, name: string) {
    setPendingAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Đã phê duyệt và kích hoạt tài khoản "${name}" thành công!`);
  }

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-red-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-red-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-800 flex items-center justify-center text-white">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Cổng Quản Trị Viên (Admin Portal)</h1>
              <span className="text-[11px] bg-red-500/30 text-red-300 font-semibold px-2 py-0.5 rounded-full border border-red-400/30">
                Module 1
              </span>
            </div>
            <p className="text-xs text-red-200/80">
              Phụ trách: Member 1 (Phân quyền 5 vai trò, Quản lý tài khoản, Duyệt Nông dân/Distributor, Audit log)
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500">Tổng tài khoản</div>
          <div className="text-2xl font-black text-gray-900">1,248</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">+14 hôm nay</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500">Chờ duyệt xác minh</div>
          <div className="text-2xl font-black text-amber-600">{pendingAccounts.length}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold">Cần xử lý</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500">Tài khoản bị khóa</div>
          <div className="text-2xl font-black text-red-600">3</div>
          <div className="text-[11px] text-gray-400 mt-1">Vi phạm quy chế</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500">Nhật ký Audit 24h</div>
          <div className="text-2xl font-black text-blue-600">89</div>
          <div className="text-[11px] text-gray-400 mt-1">Ghi nhận đầy đủ</div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <UserCheck size={18} className="text-[#1a7a3a]" />
            Duyệt Xác Minh Tài Khoản Nông Dân & Nhà Phân Phối ({pendingAccounts.length})
          </h2>
          <span className="text-xs text-gray-400">Yêu cầu xác thực giấy phép</span>
        </div>

        {pendingAccounts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Không còn tài khoản nào đang chờ phê duyệt.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingAccounts.map((acc) => (
              <div key={acc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-gray-900">{acc.name}</div>
                  <div className="text-xs text-gray-500">{acc.email} • {acc.farmName}</div>
                  <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-2">
                    <span>Hồ sơ đính kèm: <strong className="underline">{acc.certFile}</strong></span>
                    <span>• Ngày gửi: {acc.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approve(acc.id, acc.name)}
                    className="px-3 py-1.5 bg-[#1a7a3a] hover:bg-[#156e34] text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Duyệt Tài Khoản
                  </button>
                  <button
                    onClick={() => {
                      setPendingAccounts((prev) => prev.filter((a) => a.id !== acc.id));
                      toast.info(`Đã từ chối xác minh tài khoản ${acc.name}.`);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                  >
                    Từ Chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-3">
        <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          Nhật Ký Thay Đổi Quan Trọng (Audit Log)
        </h2>
        <div className="space-y-2">
          {auditLogs.map((log, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
              <span className="font-mono text-gray-500">{log.time}</span>
              <span className="font-semibold text-gray-800">{log.action}</span>
              <span className="text-gray-400 font-mono">{log.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
