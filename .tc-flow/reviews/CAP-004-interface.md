# CAP-004 Interface Review

## Backdrop domains flow

`TechnologyParticleBackdrop` imports `CAPABILITY_DOMAINS` from `capability-map-data.ts`. After the viewport, reduced-motion, WebGL, animation-frame, and idle gates pass, it dynamically imports `mountTechnologyCapabilityParticleScene` and calls it with:

1. The backdrop canvas.
2. `CAPABILITY_DOMAINS`.
3. An `onReady` callback that changes the backdrop state to `active`.

The scene flattens `domains.flatMap((domain) => domain.nodes)`, so the current backdrop receives all capability nodes contained in those domains.

## CapabilityNode icon fields

The Babylon scene currently consumes two node fields:

- `id`: used in Babylon texture, material, and plane names.
- `iconSlug`: converted to `/assets/portfolio/tech-icons/${iconSlug}.svg`.

Other `CapabilityNode` fields are not used by the particle renderer.

## URL icon support

The current implementation does not directly support arbitrary icon URLs. It always adds the local `/assets/portfolio/tech-icons/` prefix and `.svg` suffix.

Remote images would additionally require `image.crossOrigin = "anonymous"` before assigning `src`, a server that returns suitable CORS headers, and an `onerror` fallback. Without that, uploading the image into a WebGL texture may fail. Local static repository icons are the safer option.

## Minimum files for repository icons

1. `apps/web/apps/web/src/features/portfolio/technology-capability-particle-scene.ts`
   - Introduce a narrow particle-node contract or icon-source resolver.
   - Accept a direct `iconSrc` while preserving the existing `iconSlug` local-asset behavior.
   - Add remote-image CORS and load-failure handling if remote URLs are allowed.
2. `apps/web/apps/web/src/features/portfolio/technology-particle-backdrop.tsx`
   - Import or receive the open-source repository data.
   - Map repository IDs and icon sources into the particle-scene input and pass those domains/nodes instead of `CAPABILITY_DOMAINS` for this backdrop.
3. Static icon assets under `apps/web/apps/web/public/` only if the recommended local-asset approach is used.

`open-source-index-content.tsx` does not need a business-code change because it already mounts `TechnologyParticleBackdrop`.
