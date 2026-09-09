import {
	domAnimation,
	LazyMotion,
	m,
	useReducedMotion,
	useScroll,
} from "motion/react";

export function DashboardScrollProgress() {
	const reducedMotion = useReducedMotion();
	if (reducedMotion) return null;

	return <AnimatedScrollProgress />;
}

function AnimatedScrollProgress() {
	const { scrollYProgress } = useScroll();

	return (
		<LazyMotion features={domAnimation} strict>
			<m.div
				aria-hidden="true"
				className="portfolio-scroll-progress"
				data-dashboard-scroll-progress="true"
				style={{ scaleX: scrollYProgress }}
			/>
		</LazyMotion>
	);
}
