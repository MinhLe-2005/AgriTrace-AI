"use client";

import { Building2, KeyRound, Lock, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DistributorPageHeader } from "@/components/distributor/distributor-ui";
import { getApiErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

export default function DistributorSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setFullName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setCompanyName(user?.companyName ?? "");
    setAddress(user?.address ?? "");
  }, [user]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên người phụ trách.");
      return;
    }
    setIsSavingProfile(true);
    const profile = { fullName: fullName.trim(), phone: phone.trim(), companyName: companyName.trim(), address: address.trim() };
    try {
      const updated = await authService.updateProfile(profile);
      updateUser(updated);
      toast.success("Đã cập nhật thông tin nhà phân phối.");
    } catch (error) {
      // Preserve the useful local profile even when the optional API is offline.
      updateUser({ name: profile.fullName, phone: profile.phone || undefined, companyName: profile.companyName || undefined, address: profile.address || undefined });
      toast.info(`Đã lưu thông tin trên phiên làm việc này. API chưa đồng bộ: ${getApiErrorMessage(error)}`);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới cần có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword({ email: user?.email ?? "", currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đã đổi mật khẩu thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <DistributorPageHeader title="Cài Đặt Tài Khoản" description="Cập nhật thông tin nhà phân phối và đổi mật khẩu truy cập an toàn." icon={UserRound} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><UserRound size={17} className="text-amber-700" /> Thông tin nhà phân phối</h2><p className="text-xs text-gray-500 mt-1">Thông tin này được dùng để nhận diện đơn vị điều phối.</p></div>
          <form onSubmit={saveProfile} className="p-5 space-y-4">
            <Input label="Họ tên người phụ trách *" icon={UserRound} value={fullName} onChange={setFullName} placeholder="Họ và tên" />
            <Input label="Email đăng nhập" icon={Mail} value={user?.email ?? ""} onChange={() => undefined} disabled />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Số điện thoại" icon={Phone} value={phone} onChange={setPhone} placeholder="09xx xxx xxx" /><Input label="Tên đơn vị / công ty" icon={Building2} value={companyName} onChange={setCompanyName} placeholder="Công ty vận tải" /></div>
            <Input label="Địa chỉ liên hệ" icon={MapPin} value={address} onChange={setAddress} placeholder="Địa chỉ văn phòng / kho điều phối" />
            <button disabled={isSavingProfile} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"><Save size={15} />{isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}</button>
          </form>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><KeyRound size={17} className="text-amber-700" /> Đổi mật khẩu</h2><p className="text-xs text-gray-500 mt-1">Đặt mật khẩu mới để bảo vệ tài khoản điều phối.</p></div>
          <form onSubmit={changePassword} className="p-5 space-y-4">
            <Input label="Mật khẩu hiện tại *" icon={Lock} type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Nhập mật khẩu hiện tại" autoComplete="current-password" />
            <Input label="Mật khẩu mới *" icon={Lock} type="password" value={newPassword} onChange={setNewPassword} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
            <Input label="Xác nhận mật khẩu mới *" icon={ShieldCheck} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-900 flex items-start gap-2"><ShieldCheck size={15} className="shrink-0 mt-0.5" />Không chia sẻ mật khẩu với tài xế hoặc nhân viên điểm nhận. Hệ thống chỉ chấp nhận mật khẩu mới từ 6 ký tự trở lên.</div>
            <button disabled={isChangingPassword} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"><KeyRound size={15} />{isChangingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</button>
          </form>
        </section>
      </div>
      <style jsx>{`.field { width: 100%; height: 2.5rem; border: 1px solid #e5e7eb; border-radius: .75rem; padding: 0 .75rem 0 2.25rem; font-size: .75rem; outline: none; background: #fff; } .field:focus { border-color: #d97706; box-shadow: 0 0 0 4px rgba(217, 119, 6, .1); } .field:disabled { background: #f9fafb; color: #6b7280; }`}</style>
    </div>
  );
}

function Input({ label, icon: Icon, value, onChange, placeholder, type = "text", disabled, autoComplete }: { label: string; icon: typeof UserRound; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean; autoComplete?: string }) {
  return <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">{label}</span><span className="relative block"><Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} autoComplete={autoComplete} className="field" /></span></label>;
}
