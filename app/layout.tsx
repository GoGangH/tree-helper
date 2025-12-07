import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "트리 시각화 도구 - Tree Helper",
  description: "BST, AVL, B-트리, B+ 트리를 학습하고 시각화하는 도구",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="top-center"
          containerStyle={{
            top: 30,
          }}
          toastOptions={{
            success: {
              duration: 3000,
              style: {
                background: "#10b981",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "700",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
              iconTheme: {
                primary: "#ffffff",
                secondary: "#10b981",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
