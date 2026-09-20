# Dashboard visual regression ledger

Production publication is not complete merely because unit tests and build pass. Before each Dashboard release, inspect the local preview at desktop (1440 and 1536 px) and mobile (375 and 390 px), run the reviewed BackstopJS browser gate, then read back the production URL. Do not approve new reference screenshots without reviewing the rendered change. The current visual gate is BackstopJS/Puppeteer, not Playwright, and is not part of the standard CI verify job.

| ID | Previously observed issue | Focused retest |
| --- | --- | --- |
| VR-01 | Resume text occupied only the left portion of a wide desktop card, leaving an empty right column. | On `/dashboard` at 1440 and 1536 px, check that the introduction and core-capabilities block each fill at least 90% of the card content width; inspect the focused resume screenshot. |
| VR-02 | Hero two's-complement image was too small, then oversized or clipped around its outer number ring. | On `/dashboard` at 1440, 1536 and 390 px, inspect the full ring, legibility, ship, title and their spacing. |
| VR-03 | Babylon icon assets disappeared in the technology map or open-source scene, and duplicate icons appeared. | Visit `/dashboard#technology-map` and `/open-source` after hydration; inspect every icon and ensure duplicate instances are absent. |
| VR-04 | Knowledge-map module alignment, gaps and skill icon sizes drifted on desktop. | At 1440 and 1536 px, inspect left/right alignment, six default skills per module, tile spacing and icon scale. |
| VR-05 | Hero could remain a static image after switching away to another Chrome tab before hydration completed. | Leave the tab immediately during first load, return, and confirm the Babylon scene activates. |
| VR-06 | Project index rendered an ARCHIFY preview twice per project. | On `/projects`, inspect each project: only the architecture module contains its ARCHIFY preview. |
| VR-07 | Evidence architecture diagrams were clipped on mobile despite claiming horizontal scroll. | At 375, 390 and 430 px, confirm image width is at least 1024 px, the container scrolls to the diagram's end, and the page itself has no horizontal overflow. |

VR-01 and VR-07 have deterministic browser geometry/interactivity assertions in the Backstop onReady gate. VR-01 also has a source-class regression test in the standard Vitest suite. VR-02 through VR-06 remain manual visual/interactivity checks until dedicated automated coverage is added; a green unit-test result must not be treated as visual approval. Reference images must be reviewed after a page redesign instead of silently retained or blindly approved.
