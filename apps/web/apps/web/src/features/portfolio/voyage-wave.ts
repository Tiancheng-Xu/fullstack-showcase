export function waveHeight(x: number, z: number, time: number) {
  return (
    Math.sin(x * 0.56 + time * 0.82) * 0.105 +
    Math.sin(z * 0.36 - time * 0.54) * 0.072 +
    Math.sin((x + z) * 0.82 + time * 0.31) * 0.035 +
    Math.sin(x * 2.35 - z * 0.7 + time * 1.18) * 0.014
  );
}

function routePosition(progress: number) {
  const bounded = Math.max(0, Math.min(1, progress));
  return {
    x: -8 + bounded * 15.5,
    z: 9 - bounded * 41,
  };
}

export function sampleVoyagePose(progress: number, time: number) {
  const current = routePosition(progress);
  const next = routePosition(Math.min(1, progress + 0.003));
  const epsilon = 0.18;
  const center = waveHeight(current.x, current.z, time);
  const forward = waveHeight(current.x, current.z - epsilon, time);
  const side = waveHeight(current.x + epsilon, current.z, time);

  return {
    x: current.x,
    y: center + 0.16,
    z: current.z,
    pitch: Math.atan2(center - forward, epsilon),
    roll: Math.atan2(side - center, epsilon),
    yaw: Math.atan2(next.x - current.x, next.z - current.z),
  };
}
