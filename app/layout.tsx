import "@/app/globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "MEDCARE — Patient Journey",
  description: "Turn fragmented medical records into one understandable patient journey.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
