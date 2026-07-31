import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, ChevronRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { guideArticles, guideCategories } from "@/data/demo";
import { SectionHeading, ToneIcon } from "@/components/app-shell";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function GuidePage() {
  return <div className="flex flex-col gap-6 pt-6">
    <section className="px-6"><p className="text-sm font-semibold text-[#845400]">陪你一起成长</p><h1 className="mt-1 text-3xl font-bold">育儿百科</h1><p className="mt-2 text-sm text-[#6f6254]">每一个小问题，都值得被温柔地回答。</p></section>
    <div className="mx-6 flex items-center gap-3 rounded-2xl bg-[#eae8e0] px-4 py-3 text-[#847463]"><Search className="h-5 w-5" /><span className="text-sm">搜索育儿知识...</span></div>
    <div className="hide-scrollbar flex gap-3 overflow-x-auto px-6">{guideCategories.map((category, index) => <button key={category} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold ${index === 0 ? "bg-[#845400] text-white" : "bg-[#f0eee6] text-[#524535]"}`}>{category}</button>)}</div>
    <section className="px-6"><article className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#42617d] to-[#aacaea] p-6 text-white soft-shadow"><div className="relative z-10"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80"><span className="rounded-full bg-white/20 px-3 py-1">本月精选</span><span>3分钟阅读</span></div><h2 className="max-w-[270px] text-2xl font-bold">6个月宝宝辅食添加指南：第一口吃什么？</h2><button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#294964]">开始阅读 <ChevronRight className="h-4 w-4" /></button></div><div className="absolute -bottom-10 -right-3 text-8xl opacity-70">🥣</div></article></section>
    <section className="space-y-4 px-6"><SectionHeading title="疫苗接种日程" action="全部日程" /><div className="space-y-3"><ScheduleItem title="五联疫苗（第一针）" detail="2个月龄接种" status="已完成" done /><ScheduleItem title="乙肝疫苗（第三针）" detail="6个月龄接种 · 建议本周完成" status="去打卡" /></div></section>
    <section className="space-y-4 px-6 pb-8"><SectionHeading title="每日小贴士" /><div className="grid grid-cols-2 gap-3">{guideArticles.slice(1, 3).map((article, index) => <div key={article.title} className="rounded-[22px] bg-white p-4 soft-shadow"><ToneIcon icon={index === 0 ? "masks" : "child_care"} tone={index === 0 ? "blue" : "mint"} /><h3 className="mt-3 font-semibold">{article.title}</h3><p className="mt-1 text-xs leading-relaxed text-[#6f6254]">{article.readTime} · 轻松了解日常护理小知识。</p></div>)}</div><p className="flex items-center gap-2 rounded-2xl bg-[#f0eee6] p-3 text-xs leading-relaxed text-[#6f6254]"><ShieldCheck className="h-4 w-4 shrink-0 text-[#49654c]" />百科内容仅供科普参考，不能替代专业医疗建议。</p></section>
  </div>;
}

function ScheduleItem({ title, detail, status, done = false }: { title: string; detail: string; status: string; done?: boolean }) { return <div className={`flex items-center gap-3 rounded-[22px] bg-white p-4 ${done ? "soft-shadow-blue" : "border border-[#ffb347]/30 soft-shadow"}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#cbebca] text-[#324d35]" : "bg-[#ffddb6] text-[#704700]"}`}>{done ? <CalendarDays className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{title}</h3><p className={`mt-1 text-xs ${done ? "text-[#6f6254]" : "text-[#845400]"}`}>{detail}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${done ? "bg-[#cbebca]/60 text-[#324d35]" : "bg-[#845400] text-white"}`}>{status}</span></div>; }
