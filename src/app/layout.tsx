import "@/styles/globals.css";

import type { Metadata } from "next";

import { cn } from "@/lib/clsx";
import { SpoqaHanSansNeo } from "@/styles/font";

export const metadata: Metadata = {
  title: "Pixona",
  description: "생성형 AI를 통한 img2img 픽셀 아트 아바타 생성 서비스",
  icons: {
    icon: "/favicon/pixona.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={SpoqaHanSansNeo.variable}>
      <body className={cn("font-spoqa-han-sans-neo", "w-full", "h-dvh")}>
        {children}
      </body>
    </html>
  );
}
