import type { Metadata } from "next";
import { type ReactNode } from "react";

import "@/app/globals.css";
import { PublicLayoutWrapper } from "@/components/layout/public-layout";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "AgriTrace AI – Quản Lý Chuỗi Cung Ứng Nông Sản Sạch",
    template: "%s | AgriTrace AI",
  },
  description:
    "Nền tảng quản lý chuỗi cung ứng nông sản sạch tích hợp trí tuệ nhân tạo. Truy xuất nguồn gốc, quản lý nông trại, kho hàng và đặt hàng trực tuyến.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
