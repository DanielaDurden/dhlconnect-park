import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DHL Stage",
  description: "Tu espacio de trabajo en DHL",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DHL Stage",
  },
};

export const viewport: Viewport = {
  themeColor: "#D40511",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
<body className="antialiased bg-dhl-light-gray min-h-screen">
        {children}
      </body>
    </html>
  );
}
