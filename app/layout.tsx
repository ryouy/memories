import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memories",
  description: "旅行記録"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
