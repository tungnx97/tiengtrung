import type { Metadata } from "next";
import "./globals.css";
import "./accounts.css";

export const metadata: Metadata = {
  title: "HSK Master · Mỗi ngày một bước tiến",
  description:
    "Học tiếng Trung bằng flashcard, ngữ pháp tiếng Việt và bài luyện tập. Lưu tiến độ, ôn tập cách quãng và khám phá tài liệu có dẫn nguồn.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
