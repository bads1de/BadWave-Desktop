import type { Metadata } from "next";
import { Figtree, Syncopate, Space_Mono } from "next/font/google";

import Player from "@/components/Player/Player";
import RightSidebar from "@/components/RightSidebar/RightSidebar";
import Sidebar from "@/components/Sidebar/Sidebar";
import WindowControls from "@/components/electron/WindowControls";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import OfflineRedirector from "@/components/common/OfflineRedirector";

import ModalProvider from "@/providers/ModalProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import PlaybackStateProvider from "@/providers/PlaybackStateProvider";

import ToasterProvider from "@/providers/ToasterProvider";
import UserProvider from "@/providers/UserProvider";
import TanStackProvider from "@/providers/TanStackProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import "./globals.css";

const font = Figtree({ subsets: ["latin"] });
const syncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-syncopate",
});
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "BadWave",
  description: "Listen to music!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${syncopate.variable} ${spaceMono.variable}`}
    >
      <body className={font.className}>
        <ToasterProvider />
        <TanStackProvider>
          <UserProvider>
            <SyncProvider>
              <ThemeProvider>
                <PlaybackStateProvider>
                  <ModalProvider />
                  <WindowControls />
                  <div className="app-wrapper relative overflow-hidden">
                    <div className="scanline-overlay z-50" />
                    <div className="scanline-moving z-50" />
                    <Sidebar>
                      <RightSidebar>{children}</RightSidebar>
                    </Sidebar>
                    <Player />
                  </div>
                  <OfflineIndicator />
                  <OfflineRedirector />
                </PlaybackStateProvider>
              </ThemeProvider>
            </SyncProvider>
          </UserProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
