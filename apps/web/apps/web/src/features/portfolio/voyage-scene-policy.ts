type VoyageSceneConditions = {
  reducedMotion: boolean;
  viewportWidth: number;
  webglAvailable: boolean;
};

export function shouldEnableVoyageScene({
  reducedMotion,
  viewportWidth,
  webglAvailable,
}: VoyageSceneConditions) {
  return !reducedMotion && webglAvailable && viewportWidth >= 768;
}

export function getVoyageDevicePixelRatio(
  viewportWidth: number,
  devicePixelRatio: number,
) {
  return Math.min(devicePixelRatio, viewportWidth < 768 ? 1 : 1.5);
}

export function advanceVoyageReadiness(frames: number, frameReady: boolean) {
	const nextFrames = frameReady ? frames + 1 : 0;
	return { frames: nextFrames, ready: nextFrames >= 3 };
}

export function hasWebGLSupport() {
	if (typeof document === "undefined") return false;
	if (
		typeof window === "undefined" ||
		!("WebGLRenderingContext" in window)
	)
		return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}
