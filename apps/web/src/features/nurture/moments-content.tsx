import { Camera, Heart, ImagePlus, Sparkles } from "lucide-react";
import { useState } from "react";

import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Modal } from "@/components/ui/modal";
import { initialMoments } from "./data";
import type { Moment } from "./types";

const accentClasses: Record<Moment["accent"], string> = {
	orange: "from-primary-container to-primary",
	blue: "from-secondary-soft to-secondary",
	green: "from-tertiary-soft to-tertiary",
};

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
		<div className="space-y-8">
			<section>
				<h1 className="font-bold text-2xl tracking-[-0.03em]">家庭时光</h1>
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
							className={`relative min-h-48 overflow-hidden rounded-[2rem] bg-gradient-to-br p-4 text-white shadow-card ${
								accentClasses[moment.accent]
							} ${index === 0 ? "col-span-2 min-h-64" : ""}`}
							key={moment.id}
						>
							<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
							<Camera
								aria-hidden="true"
								className="absolute top-6 right-6 opacity-20"
								size={index === 0 ? 92 : 58}
							/>
							<div className="relative flex h-full min-h-inherit flex-col justify-end">
								<p className="text-xs opacity-90">{moment.date}</p>
								<h3 className="mt-1 max-w-[85%] font-bold">{moment.title}</h3>
								<button
									aria-label={`收藏 ${moment.title}`}
									aria-pressed={moment.favorite}
									className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur"
									onClick={() => toggleFavorite(moment.id)}
									type="button"
								>
									<Heart
										aria-hidden="true"
										fill={moment.favorite ? "currentColor" : "none"}
										size={19}
									/>
								</button>
							</div>
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
