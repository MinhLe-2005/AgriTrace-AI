import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email hoặc tài khoản"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự")
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").max(100),
  email: z.string().email("Vui lòng nhập email hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string()
}).refine((values) => values.password === values.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"]
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Tên dự án tối thiểu 2 ký tự").max(150),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"])
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").max(100),
  email: z.string().min(1, "Vui lòng nhập email hoặc tài khoản"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "Chọn ít nhất một vai trò")
});

export const userCreateSchema = userSchema.extend({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự")
});
