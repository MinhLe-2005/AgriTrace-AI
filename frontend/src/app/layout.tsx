import type { Metadata } from "next";
import { type ReactNode } from "react";

import "@/app/globals.css";
import { PublicLayoutWrapper } from "@/components/layout/public-layout";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "AgriTrace – Nông Sản Sạch & Truy Xuất Nguồn Gốc",
    template: "%s | AgriTrace",
  },
  description:
    "Hệ thống quản lý chuỗi cung ứng nông sản sạch và truy xuất nguồn gốc bằng mã QR từ nông trại đến bàn ăn.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased text-gray-800 bg-[#fbfdfb]">
        <Providers>
          <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
