import type { ReactNode } from "react";
import SideBar from "./components/sidebar/page";
import Header from "./components/header/page";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="w-16 shrink-0 border-e border-slate-200 bg-slate-900 text-slate-50 md:w-64">
          <SideBar />
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col bg-slate-50">
          <header className="border-b border-slate-200 bg-white">
            <Header />
          </header>

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
