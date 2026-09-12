# Repository icon assets

The open-source repository particle scene and repository cards resolve icons through the explicit manifest in `open-source-data.ts`.

- Downloaded PNG files are the preferred cached organization or repository images.
- Same-key SVG files are deterministic, low-color alternates kept for offline regeneration, visual fallback, and future format negotiation.
- Repositories without a downloaded PNG use their same-key SVG directly.
- The shared local GitHub mark is the terminal runtime fallback when a selected asset cannot load.

No page loads GitHub avatar URLs at runtime.
