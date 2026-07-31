import { Link, useLocation } from "@tanstack/react-router";
import { Bell, CircleUserRound, Home, BookOpen, Camera, Heart, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { baby } from "@/data/demo";

const navItems = [
  { to: "/", label: "成长", icon: Home },
  { to: "/moments", label: "时光", icon: Camera },
  { to: "/guide", label: "百科", icon: BookOpen },
  { to: "/me", label: "我的", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="safe-area-top sticky top-0 z-30 border-b border-[#e4e3db]/70 bg-[#fbf9f1]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="回到成长首页">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffb347] text-white shadow-[inset_0_-3px_6px_rgba(132,84,0,.16)]">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#845400]">育爱成长</span>
          </Link>
          <div className="flex items-center gap-3 text-[#524535]">
            <button className="rounded-full p-2 transition hover:bg-[#f0eee6]" aria-label="通知">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#845400] text-white">
              <CircleUserRound className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl pb-28">{children}</main>

      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[#e4e3db]/80 bg-[#fbf9f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-around px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${active ? "text-[#845400]" : "text-[#847463] hover:bg-[#f0eee6]"}`}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#1b1c17]">{title}</h2>{action ? <button className="text-sm font-semibold text-[#845400]">{action}</button> : null}</div>;
}

export function ToneIcon({ icon, tone = "orange" }: { icon: string; tone?: string }) {
  const colors: Record<string, string> = { orange: "bg-[#ffddb6] text-[#704700]", blue: "bg-[#cde5ff] text-[#294964]", mint: "bg-[#cbebca] text-[#324d35]", pink: "bg-[#f4c2c2]/60 text-[#8f4c4c]", neutral: "bg-[#eae8e0] text-[#524535]" };
  return <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors[tone] ?? colors.neutral}`}><span className="material-symbols-outlined text-[22px]">{icon}</span></div>;
}
