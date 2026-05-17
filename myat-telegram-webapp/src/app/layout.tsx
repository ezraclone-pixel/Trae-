import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Myat Web App",
  description: "Telegram Web App for Myanmar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="my"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 🚀 Telegram SDK ကို အရင်ဆုံး Load လုပ်ခိုင်းမည့် စနစ် */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      {/* 🔥 [UI ပြင်ဆင်ချက်] body ထဲက ရိုးရိုး background class တွေ ဖယ်ထုတ်ပြီး globals.css က premium-bg အလုပ်လုပ်အောင် သတ်မှတ်ခြင်း */}
      <body className="min-h-full bg-background text-foreground selection:bg-indigo-500/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
