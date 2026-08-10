import { Camera, Heart, ImagePlus, Sparkles } from "lucide-react";
import { useState } from "react";

import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Modal } from "@/components/ui/modal";
import { moments as initialMoments } from "./data";

export function MomentsContent() {
	const [moments, setMoments] = useState(initialMoments);
	const [adding, setAdding] = useState(false);

	function toggleFavorite(id: string) {
		setMoments((current) =>
			current.map((moment) =>
				moment.id === id ? { ...moment, favorite: !moment.favorite } : moment,
			),
		);
	}

	return (
		<div className="space-y-7">
			<section>
				<p className="font-semibold text-primary text-sm">成长影集</p>
				<h1 className="mt-1 font-bold text-3xl tracking-[-0.04em]">家庭时光</h1>
				<p className="mt-1 text-muted-foreground">
					每一个平凡瞬间，都值得被珍藏
				</p>
			</section>

			<section className="grid grid-cols-3 rounded-[2rem] bg-card p-5 text-center shadow-card">
				<Stat label="美好瞬间" value="342" />
				<Stat label="当前年龄" value="6个月" />
				<Stat label="精彩视频" value="28" />
			</section>

			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<div className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
						<Sparkles aria-hidden="true" size={18} />
					</div>
					<h2 className="font-bold text-xl">6个月</h2>
				</div>
				<div className="grid grid-cols-2 gap-3">
					{moments.map((moment, index) => (
						<article
							className={`group relative min-h-52 overflow-hidden rounded-[2rem] bg-surface-low shadow-card ${
								index === 0 ? "col-span-2 min-h-72" : ""
							}`}
							key={moment.id}
						>
							<img
								alt={moment.title}
								className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
								src={moment.image}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />
							<a
								aria-label={`查看 ${moment.title}`}
								className="absolute inset-0 rounded-[2rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/45"
								href={`/moments/${moment.id}`}
							>
								<span className="sr-only">查看 {moment.title}</span>
							</a>
							<div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
								<p className="text-white/85 text-xs">{moment.date}</p>
								<h3 className="mt-1 max-w-[82%] font-bold leading-5">
									{moment.title}
								</h3>
							</div>
							<button
								aria-label={`收藏 ${moment.title}`}
								aria-pressed={moment.favorite}
								className="absolute right-3 bottom-3 z-10 grid size-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition active:scale-95"
								onClick={() => toggleFavorite(moment.id)}
								type="button"
							>
								<Heart
									aria-hidden="true"
									fill={moment.favorite ? "currentColor" : "none"}
									size={20}
								/>
							</button>
						</article>
					))}
				</div>
			</section>

			<div className="rounded-[2rem] border-2 border-border border-dashed p-7 text-center text-muted-foreground">
				<ImagePlus aria-hidden="true" className="mx-auto opacity-60" />
				<p className="mt-2 font-semibold">补充5个月的照片，记录更多回忆</p>
			</div>

			<FloatingActionButton
				icon={<Camera aria-hidden="true" />}
				label="添加时光"
				onClick={() => setAdding(true)}
			/>
			<Modal onClose={() => setAdding(false)} open={adding} title="添加时光">
				<div className="rounded-3xl bg-muted p-6 text-center">
					<Camera
						aria-hidden="true"
						className="mx-auto text-primary"
						size={36}
					/>
					<p className="mt-3 font-semibold">课程后续将接入真实图片上传</p>
					<p className="mt-1 text-muted-foreground text-sm">
						当前阶段保留本地交互，不会上传任何文件。
					</p>
				</div>
			</Modal>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="font-bold text-primary text-xl">{value}</p>
			<p className="mt-1 text-muted-foreground text-xs">{label}</p>
		</div>
	);
}
