export type TechnologyParticlePosition = {
	x: number;
	y: number;
	z: number;
	phase: number;
	scale: number;
};

export function createTechnologyParticleLayout(count: number): TechnologyParticlePosition[] {
	return Array.from({ length: count }, (_, index) => {
		const arm = index % 2;
		const step = Math.floor(index / 2);
		const armLength = Math.ceil((count - arm) / 2);
		const progress = armLength <= 1 ? 0 : step / (armLength - 1);
		const radius = 2.15 + Math.pow(progress, 0.9) * 12.85;
		const angle = arm * Math.PI + progress * Math.PI * 4.4 + 0.16;
		const depth =
			Math.sin(progress * Math.PI * 5.2 + arm * 1.7) * (1.4 + progress * 4.8) +
			(arm === 0 ? -0.65 : 0.65);
		return {
			x: Number((Math.cos(angle) * radius).toFixed(3)),
			y: Number((Math.sin(angle) * radius * 0.58).toFixed(3)),
			z: Number(depth.toFixed(3)),
			phase: Number((angle + progress * 0.9).toFixed(3)),
			scale: Number((1.08 - progress * 0.3 + (step % 3 === 0 ? 0.12 : 0)).toFixed(3)),
		};
	});
}
