import { createFileRoute } from "@tanstack/react-router";
import { Activity, Baby, BedDouble, CalendarDays, CheckCircle2, ChevronRight, Ruler, Scale, Sparkles } from "lucide-react";
import { baby, dailyRecords, milestones } from "@/data/demo";
import { SectionHeading, ToneIcon } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  return (
    <div className="flex flex-col gap-6 px-6 pt-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#f0eee6] p-5 soft-shadow">
        <div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-[#ffb347]/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div><p className="mb-1 text-sm font-medium text-[#524535]">{baby.greeting}</p><h1 className="text-2xl font-bold text-[#845400]">{baby.name}的成长日记</h1><p className="mt-2 text-sm text-[#6f6254]">{baby.age} · 每一天都值得被记住</p></div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#ffb347] text-white shadow-md"><Baby className="h-8 w-8" /></div>
        </div>
      </section>

      <section className="space-y-4"><SectionHeading title="生长曲线" /><div className="grid grid-cols-2 gap-4">
        <MetricCard label="身高" value="68" unit="cm" icon={<Ruler className="h-5 w-5" />} tone="blue" />
        <MetricCard label="体重" value="8.5" unit="kg" icon={<Scale className="h-5 w-5" />} tone="orange" />
      </div></section>

      <section className="space-y-4"><SectionHeading title="里程碑" action="查看全部" /><div className="hide-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-1">{milestones.map((item) => <div key={item.title} className={`flex min-w-36 flex-col items-center rounded-[24px] bg-white p-4 text-center ${item.tone === "neutral" ? "border-2 border-dashed border-[#d6c3b0]" : "soft-shadow"}`}><ToneIcon icon={item.icon} tone={item.tone} /><p className="mt-3 font-semibold text-[#1b1c17]">{item.title}</p><p className="mt-1 text-xs text-[#6f6254]">{item.subtitle}</p></div>)}</div></section>

      <section className="flex items-center justify-between rounded-[24px] bg-[#ffdad6]/35 p-4 soft-shadow"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdad6] text-[#93000a]"><CalendarDays className="h-5 w-5" /></div><div><p className="font-semibold">下次疫苗</p><p className="text-sm text-[#6f6254]">乙肝疫苗（第3剂）</p></div></div><div className="text-right"><p className="text-2xl font-bold text-[#ba1a1a]">3<span className="ml-1 text-sm font-medium text-[#6f6254]">天后</span></p><button className="mt-1 text-xs font-semibold text-[#93000a]">查看日程</button></div></section>

      <section className="space-y-4"><SectionHeading title="今日记录" action="添加记录" /><div className="flex flex-col gap-3">{dailyRecords.map((record) => <div key={record.title} className="flex items-center justify-between rounded-[22px] bg-white p-4 soft-shadow"><div className="flex items-center gap-3"><ToneIcon icon={record.icon} tone={record.tone} /><div><p className="font-semibold">{record.title}</p><p className="text-sm text-[#6f6254]">{record.time} · {record.detail}</p></div></div><ChevronRight className="h-5 w-5 text-[#b3a390]" /></div>)}</div></section>

      <section className="rounded-[24px] bg-[#ffffff] p-5 soft-shadow"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cbebca] text-[#324d35]"><Sparkles className="h-5 w-5" /></div><div><p className="font-semibold">今天也有小小的进步</p><p className="text-sm text-[#6f6254]">记录下来，未来的你会感谢现在。</p></div></div></section>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, tone }: { label: string; value: string; unit: string; icon: React.ReactNode; tone: "blue" | "orange" }) {
  return <div className="relative overflow-hidden rounded-[24px] bg-white p-4 soft-shadow"><div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full ${tone === "blue" ? "bg-[#cde5ff] text-[#294964]" : "bg-[#ffddb6] text-[#704700]"}`}>{icon}</div><p className="text-sm text-[#6f6254]">{label}</p><p className={`mt-1 text-3xl font-bold ${tone === "blue" ? "text-[#42617d]" : "text-[#845400]"}`}>{value}<span className="ml-1 text-sm font-medium text-[#6f6254]">{unit}</span></p><Activity className={`absolute -bottom-1 right-2 h-14 w-20 opacity-20 ${tone === "blue" ? "text-[#42617d]" : "text-[#845400]"}`} /></div>;
}
