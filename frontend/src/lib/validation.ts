import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email hoặc tài khoản"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự")
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ và tên (tối thiểu 2 ký tự)").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Tên tài khoản tối thiểu 3 ký tự")
    .max(30, "Tên tài khoản tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Tên tài khoản không dấu, không chứa khoảng trắng (VD: minh2026)"),
  phone: z
    .string()
    .trim()
    .min(10, "Số điện thoại tối thiểu 10 chữ số")
    .max(15, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+ ]{10,15}$/, "Số điện thoại chỉ bao gồm số (VD: 0988776655)"),
  email: z.string().min(1, "Vui lòng nhập địa chỉ email").email("Email không đúng định dạng (VD: example@gmail.com)"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu xác nhận")
}).refine((values) => values.password === values.confirmPassword, {
  message: "Mật khẩu xác nhận không trùng khớp",
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
  active: z.boolean(),
  roles: z.array(z.string()).min(1, "Chọn ít nhất một vai trò")
});

export const userCreateSchema = userSchema.extend({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự")
});
