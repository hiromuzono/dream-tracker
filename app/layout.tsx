import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DreamTracker - 目標達成管理アプリ",
  description: "人生の目標をマイルストーンとタスクで管理し、毎日の習慣と進捗率で夢の達成を追跡するアプリです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 min-h-screen text-white">{children}</body>
    </html>
  );
}
