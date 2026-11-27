"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

type Mode = "login" | "register";
type FormValues = { name: string; email: string; password: string; confirmPassword: string };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" }
  });
  const isLogin = mode === "login";

  async function onSubmit(values: FormValues) {
    try {
      const session = isLogin
        ? await authService.login(values)
        : await authService.register(values);
      setSession(session);
      toast.success(isLogin ? `Đăng nhập thành công! Chào mừng ${session.user.name}` : "Tạo tài khoản thành công!");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function fillDemoAccount(username: string) {
    setValue("email", username);
    setValue("password", "123456");
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isLogin && (
        <Field label="Họ và tên" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="Nguyễn Văn A" {...register("name")} />
        </Field>
      )}
      <Field label={isLogin ? "Tài khoản / Email" : "Địa chỉ Email"} error={errors.email?.message}>
        <Input
          type={isLogin ? "text" : "email"}
          autoComplete="username"
          placeholder={isLogin ? "admin, customer, farmer, warehouse, distributor" : "you@example.com"}
          {...register("email")}
        />
      </Field>
      <Field label="Mật khẩu" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder="Mật khẩu (VD: 123456)"
          {...register("password")}
        />
      </Field>
      {!isLogin && (
        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            {...register("confirmPassword")}
          />
        </Field>
      )}
      <Button className="w-full" type="submit" loading={isSubmitting}>
        {isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}
      </Button>

      {isLogin && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1.5">
          <p className="font-semibold text-emerald-900">💡 Bấm vào tài khoản mẫu để tự điền (Mật khẩu: 123456):</p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => fillDemoAccount("customer")}
              className="bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
            >
              🛒 Khách hàng: <b>customer</b>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("farmer")}
              className="bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
            >
              🌾 Nông dân: <b>farmer</b>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("warehouse")}
              className="bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
            >
              📦 Thủ kho: <b>warehouse</b>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("distributor")}
              className="bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
            >
              🚚 Phân phối: <b>distributor</b>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("admin")}
              className="bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
            >
              👑 Quản trị: <b>admin</b>
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
        <Link className="font-semibold text-primary hover:underline" href={isLogin ? "/register" : "/login"}>
          {isLogin ? "Tạo tài khoản mới" : "Đăng nhập ngay"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs text-danger">{error}</span>}
    </label>
  );
}
