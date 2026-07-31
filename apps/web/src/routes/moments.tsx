import { createFileRoute } from "@tanstack/react-router";
import { Camera, Heart, Plus, Search } from "lucide-react";
import { memories } from "@/data/demo";
import { SectionHeading } from "@/components/app-shell";

export const Route = createFileRoute("/moments")({ component: MomentsPage });

function MomentsPage() {
  return <div className="flex flex-col gap-6 px-6 pt-6">
    <section><p className="text-sm font-semibold text-[#845400]">糯米的第6个月</p><h1 className="mt-1 text-3xl font-bold text-[#1b1c17]">时光记录</h1><p className="mt-2 text-sm text-[#6f6254]">把平凡日子，收藏成温柔的回忆。</p></section>
    <div className="flex items-center gap-3 rounded-2xl bg-[#eae8e0] px-4 py-3 text-[#847463]"><Search className="h-5 w-5" /><span className="text-sm">搜索成长记录...</span></div>
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ffb347] to-[#f4c2c2] p-6 text-white soft-shadow"><div className="relative z-10"><p className="text-sm font-semibold text-white/80">本月精选</p><h2 className="mt-2 max-w-[220px] text-2xl font-bold">记录宝宝第一次独立坐稳</h2><button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#845400]"><Camera className="h-4 w-4" /> 写下这一刻</button></div><div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-white/20" /><div className="absolute right-8 top-8 rotate-12 text-6xl">🌱</div></section>
    <section className="space-y-4"><SectionHeading title="最近瞬间" action="按月份查看" /><div className="grid grid-cols-2 gap-4">{memories.map((memory) => <article key={memory.date} className="group overflow-hidden rounded-[24px] bg-white soft-shadow"><div className={`flex h-40 items-end bg-gradient-to-br ${memory.tone === "orange" ? "from-[#ffddb6] to-[#ffb347]" : memory.tone === "mint" ? "from-[#cbebca] to-[#abcaab]" : memory.tone === "blue" ? "from-[#cde5ff] to-[#aacaea]" : "from-[#f4c2c2] to-[#e8a9b4]"} p-3`}><div className="flex w-full items-center justify-between"><span className="rounded-full bg-black/25 px-2 py-1 text-xs text-white">{memory.date}</span><Heart className="h-4 w-4 text-white/90 transition group-hover:fill-white" /></div></div><div className="p-4"><p className="font-semibold leading-snug">{memory.title}</p><p className="mt-1 text-xs text-[#6f6254]">心情：{memory.mood}</p></div></article>)}</div></section>
    <button className="fixed bottom-28 right-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#845400] text-white shadow-[0_10px_30px_rgba(132,84,0,.3)] transition hover:scale-105" aria-label="新增记录"><Plus className="h-7 w-7" /></button>
  </div>;
}
