export function PortfolioGithubLink() {
	return (
		<a
			aria-label="Tiancheng Xu GitHub"
			className="portfolio-github-link portfolio-glass-control inline-flex min-h-11 items-center gap-2 border border-[#8d99a3]/45 bg-[#fbf6ea]/30 px-3 font-bold text-[#071d34]"
			href="https://github.com/Tiancheng-Xu"
			rel="noreferrer"
			target="_blank"
		>
			<svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24">
				<path
					d="M12 .8a11.3 11.3 0 0 0-3.57 22c.57.1.78-.24.78-.55v-2.18c-3.18.7-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.11 1.17a10.8 10.8 0 0 1 5.67 0c2.16-1.48 3.11-1.17 3.11-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.36-5.22 5.65.41.36.77 1.05.77 2.12v3.15c0 .31.21.66.78.55A11.3 11.3 0 0 0 12 .8Z"
					fill="currentColor"
				/>
			</svg>
			<span className="hidden xl:flex xl:flex-col xl:items-start xl:leading-tight">
				<strong className="text-[11px] tracking-[0.14em]">GITHUB</strong>
				<small className="font-normal text-[10px] tracking-normal">Tiancheng-Xu ↗</small>
			</span>
		</a>
	);
}
