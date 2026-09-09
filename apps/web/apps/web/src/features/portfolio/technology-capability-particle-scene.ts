import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import { Scene } from "@babylonjs/core/scene.js";

import type { CapabilityDomain } from "./capability-map-data";
import { createTechnologyParticleLayout } from "./technology-particle-layout";
import {
	advanceVoyageReadiness,
	getVoyageDevicePixelRatio,
} from "./voyage-scene-policy";

export type CapabilityParticleController = {
	dispose: () => void;
	setPaused: (paused: boolean) => void;
	setRange: (range: number) => void;
};

const DOMAIN_COLORS = [
	new Color4(0.08, 0.2, 0.32, 0.78),
	new Color4(0.72, 0.16, 0.15, 0.72),
	new Color4(0.31, 0.42, 0.5, 0.58),
	new Color4(0.08, 0.2, 0.32, 0.24),
];

function createParticleTexture(scene: Scene) {
	const texture = new DynamicTexture("capability-mote", { width: 64, height: 64 }, scene, false);
	texture.hasAlpha = true;
	const context = texture.getContext();
	context.clearRect(0, 0, 64, 64);
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, "rgba(225,238,255,.9)");
	gradient.addColorStop(0.2, "rgba(121,151,255,.5)");
	gradient.addColorStop(1, "rgba(83,67,174,0)");
	context.fillStyle = gradient;
	context.fillRect(0, 0, 64, 64);
	texture.update(false);
	return texture;
}

export function mountTechnologyCapabilityParticleScene(
	canvas: HTMLCanvasElement,
	domains: CapabilityDomain[],
	onReady?: () => void,
): CapabilityParticleController {
	const dpr = getVoyageDevicePixelRatio(window.innerWidth, window.devicePixelRatio || 1);
	const engine = new Engine(canvas, true, {
		alpha: true,
		preserveDrawingBuffer: false,
		stencil: false,
	});
	engine.setHardwareScalingLevel(1 / dpr);

	const scene = new Scene(engine);
	scene.clearColor = new Color4(0, 0, 0, 0);
	const camera = new ArcRotateCamera(
		"capability-camera",
		Math.PI / 2,
		Math.PI / 2.25,
		25,
		Vector3.Zero(),
		scene,
	);
	camera.lowerRadiusLimit = 19;
	camera.upperRadiusLimit = 31;
	camera.wheelDeltaPercentage = 0.012;
	camera.panningSensibility = 0;
	camera.attachControl(canvas, true);

	const stars = new ParticleSystem("capability-stars", 420, scene);
	stars.particleTexture = createParticleTexture(scene);
	stars.emitter = Vector3.Zero();
	const starLayout = createTechnologyParticleLayout(420);
	let nextStar = 0;
	stars.startPositionFunction = (_worldMatrix, positionToUpdate) => {
		const index = nextStar % starLayout.length;
		const position = starLayout[index];
		const trackWidth = (((index * 17) % 11) - 5) * 0.09;
		const tangent = position.phase + Math.PI / 2;
		positionToUpdate.copyFromFloats(
			position.x + Math.cos(tangent) * trackWidth,
			position.y + Math.sin(tangent) * trackWidth * 0.58,
			position.z + Math.sin(index * 1.73) * 0.22,
		);
		nextStar += 1;
	};
	stars.minLifeTime = 900;
	stars.maxLifeTime = 900;
	stars.minSize = 0.055;
	stars.maxSize = 0.18;
	stars.minEmitPower = 0;
	stars.maxEmitPower = 0;
	stars.blendMode = ParticleSystem.BLENDMODE_STANDARD;
	stars.color1 = DOMAIN_COLORS[0];
	stars.color2 = DOMAIN_COLORS[1];
	stars.colorDead = DOMAIN_COLORS[3];
	stars.emitRate = 0;
	stars.manualEmitCount = 420;
	stars.start();

	const nodes = domains.flatMap((domain) => domain.nodes);
	const layout = createTechnologyParticleLayout(nodes.length);
	const iconPlanes = nodes.map((node, index) => {
		const position = layout[index];
		const texture = new DynamicTexture(
			`capability-icon-texture-${node.id}`,
			{ width: 192, height: 192 },
			scene,
			false,
		);
		texture.hasAlpha = true;
		const material = new StandardMaterial(`capability-icon-material-${node.id}`, scene);
		material.diffuseTexture = texture;
		material.useAlphaFromDiffuseTexture = true;
		material.emissiveTexture = texture;
		material.diffuseColor = new Color3(0.82, 0.85, 0.84);
		material.emissiveColor = new Color3(0.24, 0.31, 0.34);
		material.disableLighting = true;
		material.backFaceCulling = false;
		material.alpha = 0.72;

		const plane = CreatePlane(
			`capability-icon-plane-${node.id}`,
			{ size: 1.02 * position.scale },
			scene,
		);
		plane.material = material;
		plane.position.set(position.x, position.y, position.z);
		plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
		plane.isPickable = false;
		plane.setEnabled(false);

		const image = new Image();
		image.decoding = "async";
		image.onload = () => {
			const context = texture.getContext() as CanvasRenderingContext2D;
			context.clearRect(0, 0, 192, 192);
			context.drawImage(image, 20, 20, 152, 152);
			context.globalCompositeOperation = "source-in";
			context.fillStyle = "rgba(18, 52, 68, 0.9)";
			context.fillRect(0, 0, 192, 192);
			context.globalCompositeOperation = "source-over";
			texture.update(true);
			plane.setEnabled(true);
		};
		image.src = `/assets/portfolio/tech-icons/${node.iconSlug}.svg`;
		return { plane, base: new Vector3(position.x, position.y, position.z), phase: position.phase };
	});

	let paused = false;
	let range = 1;
	let elapsed = 0;
	let visible = true;
	scene.onBeforeRenderObservable.add(() => {
		if (paused) return;
		elapsed += engine.getDeltaTime() / 1000;
		for (const item of iconPlanes) {
			item.plane.position.x = item.base.x * range + Math.sin(elapsed * 0.2 + item.phase) * 0.34;
			item.plane.position.y = item.base.y * range + Math.cos(elapsed * 0.26 + item.phase) * 0.26;
			item.plane.position.z = item.base.z * range;
		}
		camera.alpha += 0.00012 * engine.getDeltaTime();
	});

	const render = () => scene.render();
	let readyFrames = 0;
	let readyNotified = false;
	const readyObserver = scene.onAfterRenderObservable.add(() => {
		if (readyNotified) return;
		const frameReady =
			canvas.isConnected &&
			canvas.clientWidth > 0 &&
			canvas.clientHeight > 0 &&
			engine.getRenderWidth() > 1 &&
			engine.getRenderHeight() > 1 &&
			scene.isReady();
		const readiness = advanceVoyageReadiness(readyFrames, frameReady);
		readyFrames = readiness.frames;
		if (!readiness.ready) return;
		readyNotified = true;
		scene.onAfterRenderObservable.remove(readyObserver);
		onReady?.();
	});
	const syncRenderLoop = () => {
		engine.stopRenderLoop(render);
		if (visible && !paused) engine.runRenderLoop(render);
		else scene.render();
	};
	const observer = new IntersectionObserver(
		([entry]) => {
			visible = Boolean(entry?.isIntersecting);
			syncRenderLoop();
		},
		{ rootMargin: "120px" },
	);
	observer.observe(canvas);
	const resize = () => engine.resize();
	window.addEventListener("resize", resize, { passive: true });
	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas);
	resize();
	engine.runRenderLoop(render);

	return {
		setPaused(nextPaused) {
			paused = nextPaused;
			syncRenderLoop();
		},
		setRange(nextRange) {
			range = nextRange;
			camera.radius = 25 / nextRange;
			if (paused) scene.render();
		},
		dispose() {
			scene.onAfterRenderObservable.remove(readyObserver);
			observer.disconnect();
			resizeObserver.disconnect();
			window.removeEventListener("resize", resize);
			engine.stopRenderLoop(render);
			camera.detachControl();
			scene.dispose();
			engine.dispose();
		},
	};
}
