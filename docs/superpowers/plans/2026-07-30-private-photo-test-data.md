# Private Photo Test Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate privacy-safe local “家庭时光” test data from real photos, grouping similar images while preserving every original and keeping all private assets out of Git and Cloudflare.

**Architecture:** A macOS-only Swift CLI uses ImageIO and Vision locally to read capture time, compute visual similarity, classify broad scene cues, select covers, strip metadata from working copies, and write a JSON catalog. The React application optionally loads that catalog in local development and falls back to committed placeholder data whenever the private catalog is absent.

**Tech Stack:** Swift 6.3, Vision, ImageIO, CoreGraphics, Foundation, React 19, TypeScript, Vitest, pnpm 11.17.0.

## Global Constraints

- Read photos only from the explicit albums `23天上门照` and `自己拍的`.
- Never modify or delete source photos.
- Never upload photos or generated descriptions to an external model or service.
- Prefer EXIF `DateTimeOriginal`; do not use filesystem timestamps as capture time.
- Preserve all similar photos in a group and select one cover.
- Generated photos, JSON, absolute paths, GPS metadata, and private descriptions must remain untracked.
- The public preview must continue to work with safe placeholder data.
- Do not perform face identity recognition or infer names, locations, health conditions, or unseen events.

---

## File Map

- `tools/photo-catalog/Package.swift`: Swift package and executable/test targets.
- `tools/photo-catalog/Sources/PhotoCatalogCore/Models.swift`: catalog data contracts.
- `tools/photo-catalog/Sources/PhotoCatalogCore/CaptureDateResolver.swift`: trusted capture-time parsing.
- `tools/photo-catalog/Sources/PhotoCatalogCore/PhotoAnalyzer.swift`: local Vision feature print and broad classification.
- `tools/photo-catalog/Sources/PhotoCatalogCore/PhotoGrouper.swift`: deterministic similarity grouping and cover selection.
- `tools/photo-catalog/Sources/PhotoCatalogCore/CatalogWriter.swift`: metadata-free working copies and JSON output.
- `tools/photo-catalog/Sources/photo-catalog/main.swift`: CLI argument parsing and orchestration.
- `tools/photo-catalog/Tests/PhotoCatalogCoreTests/`: unit tests with generated, non-private fixtures.
- `apps/web/apps/web/src/features/nurture/private-moments.ts`: optional catalog loader and validation.
- `apps/web/apps/web/src/features/nurture/moments-content.tsx`: private-photo cards with placeholder fallback.
- `apps/web/apps/web/src/features/nurture/types.ts`: local photo and moment types.
- `apps/web/apps/web/src/features/nurture/__tests__/private-moments.test.ts`: loader tests.
- `apps/web/apps/web/src/features/nurture/__tests__/moments-content.test.tsx`: UI fallback and private-data tests.
- `.gitignore`: private generated asset exclusions.
- `package.json`: local generation and privacy-check commands.

---

### Task 1: Capture-time resolver and catalog contracts

**Files:**
- Create: `tools/photo-catalog/Package.swift`
- Create: `tools/photo-catalog/Sources/PhotoCatalogCore/Models.swift`
- Create: `tools/photo-catalog/Sources/PhotoCatalogCore/CaptureDateResolver.swift`
- Create: `tools/photo-catalog/Tests/PhotoCatalogCoreTests/CaptureDateResolverTests.swift`

**Interfaces:**
- Consumes: `URL`, optional ImageIO property dictionary, and filename.
- Produces: `CaptureDateResult(date: Date?, source: CaptureDateSource, confidence: CaptureDateConfidence)`.

- [ ] **Step 1: Write failing date tests**

Test these exact cases:

```swift
@Test func prefersExifOriginalDate() throws {
    let result = CaptureDateResolver.resolve(
        filename: "IMG_20260723_111516.jpg",
        exifOriginal: "2026:07:23 11:14:00",
        cameraDate: nil
    )
    #expect(result.source == .exif)
    #expect(result.confidence == .high)
    #expect(result.iso8601 == "2026-07-23T11:14:00")
}

@Test func parsesCameraFilenameWithoutFilesystemFallback() throws {
    let result = CaptureDateResolver.resolve(
        filename: "IMG_20260723_111516.jpg",
        exifOriginal: nil,
        cameraDate: nil
    )
    #expect(result.source == .filename)
    #expect(result.confidence == .medium)
    #expect(result.iso8601 == "2026-07-23T11:15:16")
}

@Test func marksWechatFilenameAsLowConfidence() throws {
    let result = CaptureDateResolver.resolve(
        filename: "微信图片_20260704014234_503_38.jpg",
        exifOriginal: nil,
        cameraDate: nil
    )
    #expect(result.source == .wechatFilename)
    #expect(result.confidence == .low)
}

@Test func neverUsesFilesystemTimestamp() throws {
    let result = CaptureDateResolver.resolve(
        filename: "35.JPG",
        exifOriginal: nil,
        cameraDate: nil
    )
    #expect(result.date == nil)
    #expect(result.source == .unknown)
}
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
swift test --package-path tools/photo-catalog --filter CaptureDateResolverTests
```

Expected: non-zero exit because the package and resolver do not yet exist.

- [ ] **Step 3: Implement the contracts and resolver**

Define:

```swift
public enum CaptureDateSource: String, Codable {
    case exif
    case cameraMetadata = "camera-metadata"
    case filename
    case wechatFilename = "wechat-filename"
    case unknown
}

public enum CaptureDateConfidence: String, Codable {
    case high
    case medium
    case low
}

public struct CaptureDateResult: Equatable {
    public let date: Date?
    public let source: CaptureDateSource
    public let confidence: CaptureDateConfidence
    public var iso8601: String? { /* local-time ISO string without inventing a zone */ }
}
```

Parse EXIF with `yyyy:MM:dd HH:mm:ss`, camera filenames with `IMG_yyyyMMdd_HHmmss`, and WeChat filenames with `微信图片_yyyyMMddHHmmss`. Do not accept filesystem dates.

- [ ] **Step 4: Run resolver tests**

Run:

```bash
swift test --package-path tools/photo-catalog --filter CaptureDateResolverTests
```

Expected: all resolver tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/photo-catalog
git commit -m "feat: resolve trusted photo capture dates"
```

---

### Task 2: Local visual analysis, grouping, and cover selection

**Files:**
- Create: `tools/photo-catalog/Sources/PhotoCatalogCore/PhotoAnalyzer.swift`
- Create: `tools/photo-catalog/Sources/PhotoCatalogCore/PhotoGrouper.swift`
- Create: `tools/photo-catalog/Tests/PhotoCatalogCore/PhotoGrouperTests.swift`
- Create: `tools/photo-catalog/Tests/PhotoCatalogCore/DescriptionBuilderTests.swift`

**Interfaces:**
- Consumes: `AnalyzedPhoto` values containing relative path, album, capture result, dimensions, Vision feature print, broad labels, and quality score.
- Produces: `[PhotoGroup]` sorted by capture time, with `coverPhotoId`, title, description, and member photos.

- [ ] **Step 1: Write failing grouping tests**

Create synthetic `AnalyzedPhoto` values and verify:

```swift
@Test func groupsVisuallySimilarPhotosFromSameAlbum() {
    let groups = PhotoGrouper.group([
        fixture(id: "a", album: .day23, seconds: 0, distanceSeed: 0.02),
        fixture(id: "b", album: .day23, seconds: 20, distanceSeed: 0.03),
        fixture(id: "c", album: .day23, seconds: 25, distanceSeed: 0.72)
    ])
    #expect(groups.count == 2)
    #expect(groups[0].photos.map(\.id) == ["a", "b"])
}

@Test func neverMergesAcrossAllowedAlbums() {
    let groups = PhotoGrouper.group([
        fixture(id: "a", album: .day23, seconds: 0, distanceSeed: 0.01),
        fixture(id: "b", album: .selfShot, seconds: 0, distanceSeed: 0.01)
    ])
    #expect(groups.count == 2)
}

@Test func choosesHighestQualityPhotoAsCoverWithoutDroppingMembers() {
    let group = PhotoGrouper.group([
        fixture(id: "a", quality: 0.55),
        fixture(id: "b", quality: 0.91)
    ]).first!
    #expect(group.coverPhotoId == "b")
    #expect(group.photos.count == 2)
}
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
swift test --package-path tools/photo-catalog --filter PhotoGrouperTests
```

Expected: compile failure because analyzer and grouper are absent.

- [ ] **Step 3: Implement local Vision analysis**

Use `VNGenerateImageFeaturePrintRequest` for visual distance and `VNClassifyImageRequest` for broad, non-identifying scene cues. Keep only allowlisted labels such as baby, person, portrait, sleeping, smiling, blanket, indoors, and outdoors when confidence is at least `0.35`.

Compute a deterministic quality score:

```text
quality = 0.45 × normalizedPixelCount
        + 0.25 × nonBurstBonus
        + 0.20 × editedPhotoBonus
        + 0.10 × validOrientationBonus
```

Do not run face recognition or persist Vision feature vectors in generated JSON.

- [ ] **Step 4: Implement deterministic grouping and descriptions**

Group within the same album when:

```text
featureDistance ≤ 0.18
and
(captureTimeDistance ≤ 15 minutes or one path is under 精修5张)
```

Ambiguous distances `0.18 < distance ≤ 0.24` go to `review-required.json` rather than being merged.

Build warm descriptions from verified labels and album context. Examples:

```text
title: "第 23 天的小小纪念"
description: "安静躺着的小模样，被镜头温柔地保存下来。"
```

If labels are uncertain, use:

```text
title: "这一天的温柔瞬间"
description: "把这一刻好好收藏，留给未来慢慢回看。"
```

- [ ] **Step 5: Run analysis tests**

Run:

```bash
swift test --package-path tools/photo-catalog
```

Expected: all tests pass without reading private photos.

- [ ] **Step 6: Commit**

```bash
git add tools/photo-catalog
git commit -m "feat: group and describe local photos"
```

---

### Task 3: Privacy-safe catalog generation

**Files:**
- Create: `tools/photo-catalog/Sources/PhotoCatalogCore/CatalogWriter.swift`
- Create: `tools/photo-catalog/Sources/photo-catalog/main.swift`
- Create: `tools/photo-catalog/Tests/PhotoCatalogCore/CatalogWriterTests.swift`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: `--source <directory>` and optional `--output <directory>`.
- Produces: metadata-free JPEG working copies plus `moments.generated.json` and `review-required.json`.

- [ ] **Step 1: Write failing writer tests**

Use a generated image fixture and verify:

```swift
@Test func writesOnlyRelativePathsAndStripsMetadata() throws {
    let output = try CatalogWriter.write(groups: [fixtureGroup()], to: temporaryDirectory)
    let json = try String(contentsOf: output.catalogURL)
    #expect(!json.contains("/Users/"))
    #expect(json.contains("/private-test-data/photos/"))
    #expect(try outputPhotoHasNoGPS(output.photoURLs[0]))
}
```

Also verify that a source album outside `23天上门照` and `自己拍的` is rejected.

- [ ] **Step 2: Run writer tests and confirm failure**

Run:

```bash
swift test --package-path tools/photo-catalog --filter CatalogWriterTests
```

Expected: compile failure because `CatalogWriter` is absent.

- [ ] **Step 3: Implement writer and CLI**

The CLI must:

1. Require `--source`.
2. Enumerate only the two allowed child directories.
3. Analyze photos locally.
4. Write normalized JPEG copies through ImageIO without copying EXIF dictionaries.
5. Emit relative source identifiers, never desktop absolute paths.
6. Write ambiguous and unreadable files only to the ignored local review file.

Add scripts:

```json
{
  "photo:data": "swift run --package-path tools/photo-catalog photo-catalog",
  "photo:test": "swift test --package-path tools/photo-catalog",
  "photo:privacy-check": "node scripts/check-private-photo-safety.mjs"
}
```

- [ ] **Step 4: Add private-data ignore rules**

Add:

```gitignore
apps/web/apps/web/public/private-test-data/
**/moments.generated.json
**/review-required.json
```

- [ ] **Step 5: Generate the local catalog**

Run:

```bash
pnpm photo:data -- --source "$HOME/Desktop/🍊" --output "apps/web/apps/web/public/private-test-data"
```

Expected:

- 78 source photos considered.
- only the two allowed albums appear.
- every source photo belongs to exactly one group or the review list.
- no source photo is modified.

- [ ] **Step 6: Commit code without private output**

```bash
git add .gitignore package.json tools/photo-catalog
git status --short
git commit -m "feat: generate private photo catalogs locally"
```

Expected before commit: no file under `private-test-data` is staged.

---

### Task 4: Optional local catalog loader

**Files:**
- Modify: `apps/web/apps/web/src/features/nurture/types.ts`
- Create: `apps/web/apps/web/src/features/nurture/private-moments.ts`
- Create: `apps/web/apps/web/src/features/nurture/__tests__/private-moments.test.ts`

**Interfaces:**
- Consumes: `fetch("/private-test-data/moments.generated.json")`.
- Produces: `loadPrivateMoments(): Promise<LocalMoment[] | null>`.

- [ ] **Step 1: Write failing loader tests**

Verify:

```ts
it("returns validated local moments when the catalog exists", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify(validCatalog), { status: 200 }),
  ));
  await expect(loadPrivateMoments()).resolves.toEqual(validCatalog);
});

it("returns null when the private catalog is absent", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
  await expect(loadPrivateMoments()).resolves.toBeNull();
});

it("rejects absolute source paths", async () => {
  const unsafe = catalogWithSourcePath("/Users/example/private.jpg");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify(unsafe), { status: 200 }),
  ));
  await expect(loadPrivateMoments()).resolves.toBeNull();
});
```

- [ ] **Step 2: Run loader tests and confirm failure**

Run:

```bash
pnpm --dir apps/web/apps/web test -- private-moments.test.ts
```

Expected: failure because the loader does not exist.

- [ ] **Step 3: Implement types and loader**

Add the `LocalPhoto` and `LocalMoment` fields from the design spec. Validate JSON using existing Zod, reject absolute paths and URLs outside `/private-test-data/`, and return `null` on `404`, malformed JSON, or safety validation failure.

- [ ] **Step 4: Run loader tests**

Run:

```bash
pnpm --dir apps/web/apps/web test -- private-moments.test.ts
```

Expected: all loader tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/apps/web/src/features/nurture
git commit -m "feat: load private moments in local development"
```

---

### Task 5: Render grouped local photos with safe fallback

**Files:**
- Modify: `apps/web/apps/web/src/features/nurture/moments-content.tsx`
- Create: `apps/web/apps/web/src/features/nurture/__tests__/moments-content.test.tsx`

**Interfaces:**
- Consumes: `loadPrivateMoments()` and committed `initialMoments`.
- Produces: local photo cards when the catalog exists; existing gradient placeholder cards otherwise.

- [ ] **Step 1: Write failing UI tests**

Verify:

```tsx
it("renders a private moment cover and member count", async () => {
  vi.mocked(loadPrivateMoments).mockResolvedValue([localMomentFixture]);
  render(<MomentsContent />);
  expect(await screen.findByText("第 23 天的小小纪念")).toBeInTheDocument();
  expect(screen.getByText("共 3 张")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "第 23 天的小小纪念" }))
    .toHaveAttribute("src", "/private-test-data/photos/cover.jpg");
});

it("keeps placeholder moments when private data is absent", async () => {
  vi.mocked(loadPrivateMoments).mockResolvedValue(null);
  render(<MomentsContent />);
  expect(await screen.findByText("阳光下的温暖时光")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run UI tests and confirm failure**

Run:

```bash
pnpm --dir apps/web/apps/web test -- moments-content.test.tsx
```

Expected: failure because `MomentsContent` does not load private moments.

- [ ] **Step 3: Implement local photo cards**

Load the catalog in `useEffect`, preserve the existing favorite interaction, and render:

- cover image with descriptive alt text;
- display date;
- group title and description;
- photo count;
- placeholder gradients if local data is absent.

Use `object-cover`, fixed aspect ratios, and lazy image loading to keep the existing mobile layout stable.

- [ ] **Step 4: Run Web checks**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands exit zero both with and without `private-test-data`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/apps/web/src/features/nurture
git commit -m "feat: show grouped local photo moments"
```

---

### Task 6: Privacy and end-to-end verification

**Files:**
- Create: `scripts/check-private-photo-safety.mjs`
- Create: `scripts/__tests__/check-private-photo-safety.test.mjs`
- Modify: `apps/web/README.md`

**Interfaces:**
- Consumes: Git index, generated JSON, generated working copies, and source directory.
- Produces: zero exit only when no private output is tracked and no unsafe path/GPS field appears.

- [ ] **Step 1: Write failing privacy-check tests**

Use temporary Git fixtures to verify the checker fails for:

- a tracked file under `private-test-data`;
- JSON containing `/Users/`;
- JSON containing `GPSLatitude`, `GPSLongitude`, or `location`;

and passes for an ignored, relative-path-only catalog.

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test scripts/__tests__/check-private-photo-safety.test.mjs
```

Expected: failure because the safety checker is absent.

- [ ] **Step 3: Implement the safety checker**

The checker must inspect `git ls-files`, scan generated JSON when present, and report only safe relative filenames—never secret values or full desktop paths.

- [ ] **Step 4: Document local use**

Document:

```bash
pnpm photo:test
pnpm photo:data -- --source "$HOME/Desktop/🍊"
pnpm photo:privacy-check
pnpm dev
```

State explicitly that GitHub and Cloudflare use placeholder data.

- [ ] **Step 5: Run complete verification**

Run:

```bash
pnpm photo:test
pnpm photo:privacy-check
pnpm test
pnpm typecheck
pnpm build
git status --short
git ls-files 'apps/web/apps/web/public/private-test-data/**'
```

Expected:

- every command exits zero;
- final `git ls-files` prints nothing;
- private local output exists but is ignored;
- no source photo checksum changes.

- [ ] **Step 6: Commit**

```bash
git add scripts package.json apps/web/README.md
git commit -m "test: guard private photo fixtures"
```

