import {
	domAnimation,
	LazyMotion,
	m,
	useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import "./pretext-reveal-title.css";

let pretextModule: Promise<typeof import("@chenglou/pretext")> | undefined;

const loadPretext = () => {
	pretextModule ??= import("@chenglou/pretext");
	return pretextModule;
};

export function PretextRevealTitle({ text }: { text: string }) {
	const rootRef = useRef<HTMLSpanElement | null>(null);
	const reducedMotion = useReducedMotion();
	const [lines, setLines] = useState<string[] | null>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || reducedMotion) return undefined;

		let disposed = false;
		let observer: ResizeObserver | undefined;

		const prepareLayout = async (width: number) => {
			try {
				const { layoutWithLines, prepareWithSegments } = await loadPretext();
				if (disposed) return;

				const styles = window.getComputedStyle(root);
				const fontSize = Number.parseFloat(styles.fontSize) || 42;
				const lineHeight = Number.parseFloat(styles.lineHeight) || fontSize * 1.1;
				const letterSpacing = Number.parseFloat(styles.letterSpacing);
				const prepared = prepareWithSegments(
					text,
					`${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`,
					Number.isFinite(letterSpacing) ? { letterSpacing } : undefined,
				);
				const result = layoutWithLines(prepared, Math.max(1, width), lineHeight);
				setLines(result.lines.map((line) => line.text));
			} catch {
				if (!disposed) setLines(null);
			}
		};

		const start = () => {
			if (typeof ResizeObserver !== "function") {
				void prepareLayout(root.getBoundingClientRect().width);
				return;
			}
			observer = new ResizeObserver(([entry]) => {
				if (entry) void prepareLayout(entry.contentRect.width);
			});
			observer.observe(root);
		};

		if (document.fonts?.ready) {
			void document.fonts.ready.then(() => {
				if (!disposed) start();
			});
		} else {
			start();
		}

		return () => {
			disposed = true;
			observer?.disconnect();
		};
	}, [reducedMotion, text]);

	return (
		<span
			aria-label={text}
			className="pretext-reveal-title"
			ref={rootRef}
		>
			{!lines || reducedMotion ? (
				<span className="pretext-reveal-title__fallback">{text}</span>
			) : (
				<LazyMotion features={domAnimation} strict>
					<m.span
						aria-hidden="true"
						className="pretext-reveal-title__animated"
						initial="hidden"
						transition={{ staggerChildren: 0.035 }}
						viewport={{ amount: 0.8, once: true }}
						whileInView="visible"
					>
						{lines.map((line, lineIndex) => (
							<span className="pretext-reveal-title__line" key={`${line}-${lineIndex}`}>
								{Array.from(line).map((character, characterIndex) => {
									const index = lineIndex * text.length + characterIndex;
									const direction = index % 2 === 0 ? -1 : 1;
									return (
										<m.span
											className="pretext-reveal-title__glyph"
											key={`${character}-${characterIndex}`}
											variants={{
												hidden: {
													opacity: 0,
													x: direction * (10 + (index % 3) * 4),
													y: (index % 3 - 1) * 7,
													filter: "blur(5px)",
												},
												visible: {
													opacity: 1,
													x: 0,
													y: 0,
													filter: "blur(0px)",
													transition: {
														duration: 0.62,
														ease: [0.22, 1, 0.36, 1],
													},
												},
											}}
										>
											{character}
										</m.span>
									);
								})}
							</span>
						))}
					</m.span>
				</LazyMotion>
			)}
		</span>
	);
}
