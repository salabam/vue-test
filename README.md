# Image Editor

Small non-destructive image editor built for a printing-industry style workflow: upload, crop 1:1, adjust brightness/contrast/saturation with a live preview, optionally apply a filter, and export.

## Stack

- Vue 3 (`<script setup>`, TypeScript)
- Vuetify 3
- Pinia
- Cropper.js **v2.1** (the web-components rewrite, not the old v1 constructor API — see note below)

## Running it

```bash
npm i
npm run dev
```

## Key decisions

### Cropper.js v2 is a different library than most tutorials assume

Cropper.js v2 dropped the old `new Cropper(img, options)` constructor API entirely. It's now a set of native **Web Components**: `<cropper-canvas>`, `<cropper-image>`, `<cropper-selection>`, `<cropper-grid>`, `<cropper-crosshair>`, `<cropper-handle>`, `<cropper-shade>`. You mount them declaratively and drive them through element properties/methods (`$zoom()`, `$toCanvas()`, `$reset()`, ...) instead of the old `getCroppedCanvas()`/options-object approach. Almost all blog posts and AI answers online still describe v1, which is the "half a day stuck" problem mentioned in the brief.

Practical implications this project handles:
- `vite.config.ts` tells the Vue compiler to treat any `cropper-*` tag as a native custom element (`isCustomElement`), so it doesn't try to resolve them as Vue components.
- `cropperjs` is imported once for its side effect (`import 'cropperjs'` in `main.ts`), which registers the custom elements globally.
- `<cropper-selection>`'s `x/y/width/height` are in **canvas/screen space**, not original-image pixel space. `CropperStage.vue` derives the natural-image-space crop rect itself from `getBoundingClientRect()` ratios between the image and the selection (the same technique used in Cropper's own "limit boundaries" examples). This is what makes the crop rect resolution-independent and safe to serialize.
- Export uses `cropperSelection.$toCanvas({ beforeDraw })`, the v2 replacement for `getCroppedCanvas()`.

### The operation model (how edits are represented)

```ts
interface EditState {
  crop: { x: number; y: number; width: number; height: number } | null // px, ORIGINAL image space
  adjustments: { brightness: number; contrast: number; saturate: number } // 100 = neutral
  filter: 'none' | 'grayscale' | 'sepia'
}
```

This lives in the Pinia store (`stores/editor.ts`) alongside the untouched original `File`/object URL. Nothing ever writes into the original image — the store just holds "how to redraw it," which is what makes the editing non-destructive: Reset just means clearing this state back to defaults, and "hold to view original" just means overriding the applied filter with `none` for the DOM preview.

### One filter string, two consumers

Brightness/contrast/saturation/filter are all expressed as a single CSS `filter` string (`brightness() contrast() saturate() grayscale() sepia()`), built once in `utils/filterString.ts`:

- **Preview**: applied as `style.filter` directly on the `<cropper-image>` element — instant, GPU-composited, no per-frame recompute.
- **Export**: the exact same string is set as `context.filter` inside `$toCanvas`'s `beforeDraw` hook, which Cropper.js runs right before it draws the cropped region onto the export canvas.

Using one function for both guarantees the exported pixels match what was on screen, with no separate "export renderer" to drift out of sync with the live preview.

### Bonus: filter + JSON operation manifest

One filter was implemented as required at minimum, plus greyscale and sepia (two, for a bit of headroom).

The JSON export (`store.buildManifest()`) shape:

```json
{
  "version": 1,
  "source": { "name": "photo.jpg", "width": 4032, "height": 3024 },
  "operations": [
    { "type": "crop", "x": 400, "y": 200, "width": 2000, "height": 2000 },
    { "type": "adjust", "brightness": 110, "contrast": 95, "saturate": 130 },
    { "type": "filter", "name": "sepia" }
  ]
}
```

Design intent:
- `operations` is an **ordered list**, so replaying it is a straight fold over the array: draw the original, apply the `crop` op (a plain `drawImage` with `sx/sy/sw/sh` — no scaling ambiguity since coordinates are already in original-image pixels), then draw the result onto a second canvas with `context.filter` built from the `adjust`/`filter` ops using the *same* `buildFilterString()` function the app itself uses. That last point matters: replay and live export share the same filter-string builder, so a replay should reproduce the exported image pixel-for-pixel (modulo browser-specific filter rounding).
- `crop` is optional (omitted if the user never touched the crop box, i.e. export uses the full image).
- `source` isn't required to perform the replay (the crop coordinates are already absolute), it's there so a replay tool can sanity-check it's being pointed at the right original and warn on a mismatch.
- The schema is intentionally flat/ordered rather than a single "settings object," so it's straightforward to extend later (e.g. adding a `rotate` op) without breaking older manifests — an unrecognized `type` can just be skipped by an older replayer, or replay can bail loudly if it encounters an op it doesn't understand.

## Follow-up fixes after initial review

- **"Apply operations JSON" button** (`ExportPanel.vue` + `utils/replay.ts`): loads a previously exported manifest and replays it — crop, then filter — directly against the currently loaded original, downloading the reproduced image. It deliberately never touches the live Cropper.js selection/state; it's a standalone proof that the manifest alone (plus the original file) is enough to reproduce the export, using the same `buildFilterString()` the live preview/export use.
- **Removed the dark letterboxing around the image**: `<cropper-canvas>` was previously a fixed 480px-tall box regardless of the image's own aspect ratio, so most images left large empty margins that Cropper.js fills with its own dark background — that's what read as "everything looks darkened, I can't see the brightness/contrast changes." The canvas now sizes itself to the loaded image's aspect ratio (`aspect-ratio: width / height`, capped at `65vh`), and its background is explicitly overridden to a light neutral colour instead of Cropper's default. The `background` (checkerboard) attribute was also dropped since it wasn't adding anything for opaque photos.
- **Image panning**: the canvas-level handle changed from `action="select"` (draw a brand-new crop box) to `action="move"` (drag to pan the image itself). Since the crop box is fixed at 1:1 and auto-created on load, "draw a new box" wasn't useful — being able to drag the image underneath a fixed/resizable crop frame is. The selection's own internal handles are untouched, so you still have two independent gestures: drag *inside* the selection to move the crop box, drag *outside* it to pan the image underneath.

## Trade-offs / things I'd revisit with more time

- **Rotation** was explicitly out of scope per the brief, so it isn't wired up, though `<cropper-image rotatable>` would be a small addition later — the operation manifest schema is already shaped to add a `rotate` op without breaking changes.
- **Undo/redo** isn't implemented — only reset-to-original. The store shape would support a simple history stack of `EditState` snapshots if that were needed.
- **Selection `change` handling** commits on every pointer-move event rather than being throttled/debounced. Fine at this scale; on very large images or slower devices I'd debounce the `getBoundingClientRect()` reads.
- I didn't add a replay tool (e.g. a small CLI/script that consumes the JSON manifest and regenerates the image) since it wasn't required — but the manifest was designed with exactly that in mind, and I'm glad to sketch or build it if useful to see.
