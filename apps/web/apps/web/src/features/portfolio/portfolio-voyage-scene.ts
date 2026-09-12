import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { ArcRotateCameraPointersInput } from "@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput.js";
import { ArcRotateCameraMouseWheelInput } from "@babylonjs/core/Cameras/Inputs/arcRotateCameraMouseWheelInput.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { Effect } from "@babylonjs/core/Materials/effect.js";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";

import {
	advanceVoyageReadiness,
	getVoyageDevicePixelRatio,
} from "./voyage-scene-policy";
import { sampleVoyagePose } from "./voyage-wave";

const SHADER_NAME = "portfolioVoyageOcean";
const SKY_SHADER_NAME = "portfolioVoyageSky";

Effect.ShadersStore[`${SHADER_NAME}VertexShader`] = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 world;
  uniform mat4 worldViewProjection;
  uniform float time;
  varying vec2 vUV;
  varying float vHeight;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float wave(vec2 point, vec2 direction, float wavelength, float amplitude, float speed, float phase) {
    float frequency = 6.2831853 / wavelength;
    return sin(dot(point, normalize(direction)) * frequency + time * speed + phase) * amplitude;
  }

  float waveHeight(vec2 point) {
    vec2 localWind = vec2(.868, -.497);
    vec2 swellWind = vec2(0.0, 1.0);
    return wave(point, swellWind, 34.0, .19, .42, .0)
      + wave(point, localWind, 17.0, .135, .66, 1.2)
      + wave(point, localWind, 8.5, .072, .92, 2.4)
      + wave(point, vec2(.72, .69), 4.2, .034, 1.24, .7)
      + wave(point, vec2(-.34, .94), 2.1, .014, 1.62, 1.8);
  }

  void main(void) {
    vec3 displaced = position;
    displaced.y += waveHeight(position.xz);
    vUV = uv;
    vHeight = displaced.y;
    float epsilon = .14;
    float slopeX = (waveHeight(position.xz + vec2(epsilon, 0.0))
      - waveHeight(position.xz - vec2(epsilon, 0.0))) / (2.0 * epsilon);
    float slopeZ = (waveHeight(position.xz + vec2(0.0, epsilon))
      - waveHeight(position.xz - vec2(0.0, epsilon))) / (2.0 * epsilon);
    vWorldPosition = (world * vec4(displaced, 1.0)).xyz;
    vWorldNormal = normalize(mat3(world) * vec3(-slopeX, 1.0, -slopeZ));
    gl_Position = worldViewProjection * vec4(displaced, 1.0);
  }
`;

Effect.ShadersStore[`${SHADER_NAME}FragmentShader`] = `
  precision highp float;
  varying vec2 vUV;
  varying float vHeight;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform float time;
  uniform vec3 cameraPosition;
  uniform vec3 sunDirection;
  uniform sampler2D bumpTexture;

  void main(void) {
    float horizon = smoothstep(.12, .95, vUV.y);
    vec2 flowA = vUV * 86.0 + vec2(time * .012, -time * .018);
    vec2 flowB = vUV.yx * 137.0 + vec2(-time * .009, time * .014);
    vec3 bumpA = texture2D(bumpTexture, flowA).rgb * 2.0 - 1.0;
    vec3 bumpB = texture2D(bumpTexture, flowB).rgb * 2.0 - 1.0;
    vec3 detailNormal = vec3(bumpA.r + bumpB.g, 0.0, bumpA.g + bumpB.r);
    vec3 normal = normalize(vWorldNormal + detailNormal * .085);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.2);
    vec3 reflected = mix(vec3(.48, .57, .57), vec3(.31, .45, .50), horizon);
    vec3 water = mix(vec3(.31, .49, .51), vec3(.12, .29, .34), horizon);
    vec3 color = mix(water, reflected, .24 + fresnel * .62);
    vec3 reflectedSun = reflect(-normalize(sunDirection), normal);
    float sunGlint = pow(max(dot(reflectedSun, viewDirection), 0.0), 96.0);
    color += vec3(.82, .59, .37) * sunGlint * .82;
    color += vec3(.16, .20, .19) * max(vHeight, 0.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

Effect.ShadersStore[`${SKY_SHADER_NAME}VertexShader`] = `
  precision highp float;
  attribute vec3 position;
  uniform mat4 worldViewProjection;
  varying vec3 vPosition;
  void main(void) {
    vPosition = position;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;

Effect.ShadersStore[`${SKY_SHADER_NAME}FragmentShader`] = `
  precision highp float;
  varying vec3 vPosition;
  void main(void) {
	vec3 direction = normalize(vPosition);
	float altitude = clamp(direction.y, 0.0, 1.0);
	float horizonHaze = pow(1.0 - altitude, 7.0);
	vec3 horizon = vec3(.68, .70, .66);
	vec3 middle = vec3(.52, .63, .65);
	vec3 zenith = vec3(.30, .45, .52);
	vec3 color = mix(horizon, middle, smoothstep(.02, .28, altitude));
	color = mix(color, zenith, smoothstep(.28, .92, altitude));

	vec3 sunDirection = normalize(vec3(-.325, .025, -.945));
	float sunDot = max(dot(direction, sunDirection), 0.0);
	float innerScatter = pow(sunDot, 180.0);
	float middleScatter = pow(sunDot, 34.0);
	float horizonScatter = pow(sunDot, 7.0) * horizonHaze;
	color += vec3(.34, .19, .095) * innerScatter * .38;
	color += vec3(.20, .13, .085) * middleScatter * .30;
	color += vec3(.13, .095, .072) * horizonScatter * .24;
	color += vec3(.09, .07, .045) * horizonHaze;

	vec2 cloudDirection = vec2(
		atan(direction.z, direction.x),
		direction.y
	);
	float cloudBase = sin(cloudDirection.x * 5.2 + sin(cloudDirection.y * 13.0) * 1.7)
		+ sin(cloudDirection.x * 9.4 - cloudDirection.y * 18.0) * .46;
	float cloudDetail = sin(cloudDirection.x * 18.0 + cloudDirection.y * 31.0)
		+ sin(cloudDirection.x * 31.0 - cloudDirection.y * 43.0) * .42;
	float cloudBand = smoothstep(.025, .09, altitude)
		* (1.0 - smoothstep(.62, .82, altitude));
	float cloudShape = cloudBase + cloudDetail * .34 + .18;
	float cloudMask = smoothstep(-.18, .34, cloudShape) * cloudBand;
	float cloudCore = smoothstep(.18, .72, cloudShape) * cloudBand;
	vec3 cloudShadow = mix(vec3(.46, .55, .58), vec3(.70, .73, .70), altitude);
	vec3 cloudLight = mix(vec3(.94, .94, .88), vec3(1.0, .86, .72), pow(sunDot, 5.0));
	color = mix(color, cloudShadow, cloudMask * .68);
	color = mix(color, cloudLight, cloudCore * (.78 + horizonHaze * .12));
	float sunDisc = smoothstep(.9985, .99955, sunDot);
	sunDisc *= 1.0 - cloudMask * .3;
	color = mix(color, vec3(.90, .52, .29), sunDisc * .94);
	gl_FragColor = vec4(color, 1.0);
	}
`;

export type VoyageCameraPreset = "overview" | "follow" | "horizon";

export type PortfolioVoyageSceneController = {
	dispose: () => void;
	setCameraPreset: (preset: VoyageCameraPreset) => void;
};

function createBoatFallback(scene: Scene, root: TransformNode) {
	const hull = CreateBox("fallback-hull", { width: 2.8, height: 0.5, depth: 6.2 }, scene);
  hull.parent = root;
  hull.position.y = 0.35;
  const hullMaterial = new StandardMaterial("fallback-hull-material", scene);
  hullMaterial.diffuseColor = new Color3(0.11, 0.12, 0.12);
  hullMaterial.specularColor = new Color3(0.18, 0.18, 0.18);
  hull.material = hullMaterial;

	const cabin = CreateBox("fallback-cabin", { width: 2.15, height: 1.3, depth: 2.2 }, scene);
  cabin.parent = root;
  cabin.position.set(0, 1.2, 0.3);
  const cabinMaterial = new StandardMaterial("fallback-cabin-material", scene);
  cabinMaterial.diffuseColor = new Color3(0.84, 0.77, 0.63);
  cabin.material = cabinMaterial;
}

async function loadBoat(scene: Scene, root: TransformNode) {
  try {
    const result = await SceneLoader.ImportMeshAsync("", "/assets/portfolio/", "ss_minnow_iii.glb", scene);
    for (const mesh of result.meshes) {
      if (!mesh.parent) mesh.parent = root;
    }
    const importedRoot = result.meshes[0];
    const bounds = importedRoot?.getHierarchyBoundingVectors(true);
    if (bounds) {
      const size = bounds.max.subtract(bounds.min);
      const scale = 8.3 / Math.max(size.x, size.y, size.z, 0.001);
      root.scaling.setAll(scale);
      root.position.y -= bounds.min.y * scale;
    }
    root.rotation.y = Math.PI;
  } catch {
    createBoatFallback(scene, root);
  }
}

function createWake(scene: Scene, root: TransformNode) {
  const material = new StandardMaterial("wake-material", scene);
  material.diffuseColor = new Color3(0.76, 0.9, 0.88);
  material.emissiveColor = new Color3(0.22, 0.43, 0.43);
  material.alpha = 0.34;
  material.disableLighting = true;

	const left = CreatePlane("wake-left", { width: 0.12, height: 7 }, scene);
  const right = left.clone("wake-right");
  for (const [mesh, x, angle] of [[left, -0.42, -0.12], [right, 0.42, 0.12]] as const) {
    mesh.parent = root;
    mesh.position.set(x, 0.03, 3.7);
    mesh.rotation.set(Math.PI / 2, 0, angle);
    mesh.material = material;
  }
}

export async function mountPortfolioVoyageScene(
	canvas: HTMLCanvasElement,
): Promise<PortfolioVoyageSceneController> {
  const dpr = getVoyageDevicePixelRatio(window.innerWidth, window.devicePixelRatio || 1);
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
  engine.setHardwareScalingLevel(1 / dpr);

  const scene = new Scene(engine);
	  scene.clearColor = new Color4(0.66, 0.79, 0.84, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
	  scene.fogDensity = 0.0031;
	  scene.fogColor = new Color3(0.7, 0.8, 0.82);

	  const camera = new ArcRotateCamera("voyage-camera", Math.PI * 0.49, 1.4, 36, new Vector3(0, 0.5, -8), scene);
	  camera.lowerRadiusLimit = 27;
	  camera.upperRadiusLimit = 52;
		camera.lowerBetaLimit = 0.56;
		camera.upperBetaLimit = 1.44;
		camera.inputs.clear();
		camera.inputs.add(new ArcRotateCameraPointersInput());
		const wheelInput = new ArcRotateCameraMouseWheelInput();
		wheelInput.wheelPrecision = 34;
		camera.inputs.add(wheelInput);
		camera.angularSensibilityX = 1500;
		camera.angularSensibilityY = 2100;
		camera.panningSensibility = 0;
		camera.inertia = 0.78;
	camera.attachControl(canvas, true);
	camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");

  const ambient = new HemisphericLight("voyage-ambient", new Vector3(0, 1, 0), scene);
	  ambient.intensity = 0.96;
	  ambient.diffuse = new Color3(0.88, 0.86, 0.78);
	  ambient.groundColor = new Color3(0.31, 0.45, 0.48);

  const sunDirection = new Vector3(-0.38, -0.54, 0.74).normalize();
  const sunLight = new DirectionalLight("voyage-sun-light", sunDirection, scene);
	  sunLight.intensity = 1.55;
	  sunLight.diffuse = new Color3(1, 0.84, 0.64);

	  const sky = CreateBox("voyage-sky", { size: 1000, sideOrientation: Mesh.BACKSIDE }, scene);
	  const skyMaterial = new ShaderMaterial("voyage-sky-material", scene, SKY_SHADER_NAME, {
		attributes: ["position"],
		uniforms: ["worldViewProjection"],
	  });
		const skySunDirection = new Vector3(-.253, .019, -.967).normalize();
	  skyMaterial.backFaceCulling = false;
		skyMaterial.disableDepthWrite = true;
	  sky.material = skyMaterial;
		sky.applyFog = false;
		sky.infiniteDistance = true;
		sunLight.direction = skySunDirection.negate();

		const ocean = CreateGround("voyage-ocean", { width: 1200, height: 1200, subdivisions: 160 }, scene);
	  ocean.position.z = -180;
  const oceanMaterial = new ShaderMaterial("voyage-ocean-material", scene, SHADER_NAME, {
    attributes: ["position", "uv"],
    uniforms: ["world", "worldViewProjection", "time", "cameraPosition", "sunDirection"],
    samplers: ["bumpTexture"],
  });
  oceanMaterial.setFloat("time", 0);
  const waterBump = new Texture("/assets/portfolio/waterbump.png", scene);
  waterBump.wrapU = Texture.WRAP_ADDRESSMODE;
  waterBump.wrapV = Texture.WRAP_ADDRESSMODE;
  oceanMaterial.setTexture("bumpTexture", waterBump);
  oceanMaterial.setVector3("sunDirection", skySunDirection);
  ocean.material = oceanMaterial;

	  const boatRoot = new TransformNode("voyage-boat-root", scene);
	  await loadBoat(scene, boatRoot);
	  createWake(scene, boatRoot);

	const cameraPresets: Record<Exclude<VoyageCameraPreset, "follow">, {
		alpha: number;
		beta: number;
		radius: number;
		target: Vector3;
	}> = {
		overview: {
			alpha: Math.PI * .49,
			beta: 1.4,
			radius: 36,
			target: new Vector3(0, .5, -8),
		},
		horizon: {
			alpha: Math.PI * .34,
			beta: 1.425,
			radius: 46,
			target: new Vector3(2, .65, -14),
		},
	};
	let selectedPreset: VoyageCameraPreset = "overview";
	let cameraBlend = 1;
	let cameraFrom = {
		alpha: camera.alpha,
		beta: camera.beta,
		radius: camera.radius,
		target: camera.target.clone(),
	};
	let cameraTo = cameraPresets.overview;
	const setCameraPreset = (preset: VoyageCameraPreset) => {
		selectedPreset = preset;
		cameraBlend = 0;
		cameraFrom = {
			alpha: camera.alpha,
			beta: camera.beta,
			radius: camera.radius,
			target: camera.target.clone(),
		};
		cameraTo = preset === "follow"
			? {
				alpha: Math.PI * .15,
				beta: 1.22,
				radius: 18,
				target: boatRoot.position.add(new Vector3(0, 1.1, 0)),
			}
			: cameraPresets[preset];
	};

  let elapsed = 0;
	  scene.onBeforeRenderObservable.add(() => {
	    elapsed += engine.getDeltaTime() / 1000;
	    oceanMaterial.setFloat("time", elapsed);
	    oceanMaterial.setVector3("cameraPosition", camera.position);
			sky.position.copyFrom(camera.position);
			const travelProgress = (elapsed * .012) % 1;
	    const pose = sampleVoyagePose(.16 + travelProgress * .64, elapsed);
			boatRoot.position.set(
				14 + (-28 * travelProgress),
				pose.y - .42 + travelProgress * .42,
				2 + (-54 * travelProgress),
			);
			const headingToSun = Math.atan2(
				skySunDirection.x * 1000 - boatRoot.position.x,
				skySunDirection.z * 1000 - boatRoot.position.z,
			);
		boatRoot.rotation.set(pose.pitch, headingToSun + Math.PI * .155, pose.roll);
		if (selectedPreset === "follow") {
			cameraTo = {
				...cameraTo,
				target: boatRoot.position.add(new Vector3(0, 1.1, 0)),
			};
		}
		if (cameraBlend < 1) {
			cameraBlend = Math.min(1, cameraBlend + engine.getDeltaTime() / 850);
			const eased = 1 - Math.pow(1 - cameraBlend, 3);
			camera.alpha = cameraFrom.alpha + (cameraTo.alpha - cameraFrom.alpha) * eased;
			camera.beta = cameraFrom.beta + (cameraTo.beta - cameraFrom.beta) * eased;
			camera.radius = cameraFrom.radius + (cameraTo.radius - cameraFrom.radius) * eased;
			camera.setTarget(Vector3.Lerp(cameraFrom.target, cameraTo.target, eased));
		} else if (selectedPreset === "follow") {
			camera.setTarget(Vector3.Lerp(camera.target, cameraTo.target, .035));
		}
	  });

  const render = () => scene.render();
  let rendering = false;
  const start = () => {
    if (rendering) return;
    rendering = true;
    engine.runRenderLoop(render);
  };
  const stop = () => {
    if (!rendering) return;
    rendering = false;
    engine.stopRenderLoop(render);
  };
  const observer = new IntersectionObserver(
    ([entry]) => (entry?.isIntersecting ? start() : stop()),
    { rootMargin: "120px" },
  );
  observer.observe(canvas);
  const resize = () => engine.resize();
	window.addEventListener("resize", resize, { passive: true });
	start();

	const dispose = () => {
		observer.disconnect();
		window.removeEventListener("resize", resize);
		stop();
		scene.dispose();
		engine.dispose();
	};

	try {
		await new Promise<void>((resolve, reject) => {
			let stableFrames = 0;
			const timeout = window.setTimeout(() => {
				scene.onAfterRenderObservable.remove(frameObserver);
				reject(new Error("Voyage ocean did not become ready in time"));
			}, 12_000);
			const frameObserver = scene.onAfterRenderObservable.add(() => {
				const frameReady =
					canvas.isConnected &&
					canvas.clientWidth > 0 &&
					canvas.clientHeight > 0 &&
					engine.getRenderWidth() > 1 &&
					engine.getRenderHeight() > 1;
				const readiness = advanceVoyageReadiness(stableFrames, frameReady);
				stableFrames = readiness.frames;
				if (!readiness.ready) return;
				window.clearTimeout(timeout);
				scene.onAfterRenderObservable.remove(frameObserver);
				resolve();
			});
		});
	} catch (error) {
		dispose();
		throw error;
	}

	return { dispose, setCameraPreset };
}
