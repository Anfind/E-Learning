import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "stream-chat-react/dist/css/v2/index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Learning Platform - Hệ thống học và thi online",
  description: "Hệ thống hỗ trợ học và thi online với xác thực khuôn mặt",
  keywords: ["learning", "online course", "exam", "education", "face recognition"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ChatProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
