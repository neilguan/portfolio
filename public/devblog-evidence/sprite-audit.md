# Luna-only pixel art: recognition before catalog coverage

This is the September 9, 2026 correction for **new 2D sprite and block-texture
authoring**. Both author and critic use GPT-5.6 Luna, max reasoning. Use the
fixed-workspace/session launcher in `author-sessions.md`. Existing production
art and loaders remain supported; a study never automatically replaces them.

The approved four iron sprites in `studies/item_studies/iron16-reference.png`
remain the style anchor. Their exact source is `tools/dev-cli/src/commands/asset/itemsprite_trial.rs`.
Read `item-sprite-authoring.md` for that palette and historical evidence.
The later 423-item catalog is existing work, not an approved quality template.

## Why the expanded catalog failed

`itemsprite_catalog.rs` selects many shapes and palettes by substring. For
example the default theme does not distinguish wooden, stone and iron tool
materials. A mechanical audit of the 423 exported sprites found **56 groups
of byte-identical pixels**. Some same-family variants may intentionally share
art; unrelated identities and material tiers must be checked explicitly.
Broad coverage, binary alpha, palette consistency and inventory-centering
tests cannot establish that a person can identify each object.

Keep the old generator as a maintenance tool until reviewed replacements
exist. Do not extend the catch-all dispatcher or promote more generic shapes
as complete art. Do not swap the whole runtime set after reviewing a small
crop of a 423-item sheet.

## Source format and drawing method

For 16x16 item sprites, use explicit palette-index rows or bounded integer-grid
pixel commands. Start with the silhouette, holes and connected material masses.
Then add a few purposeful shaded clusters. Author each identity explicitly;
reuse a proven shape only for a declared variant with a deliberate material
palette. No filename-derived random colors or generic fallback object.

`tools/pixel_studio.py` accepts a small JSON study with an `assets` list. A sprite
entry has `name`, `kind: "sprite"`, `size: 16`, `palette` (single-character keys
to `#RRGGBB` or `transparent`) and sixteen `rows` of sixteen symbols. Undefined
symbols, missing rows and empty images fail. An experimental alternative is
ordered `commands` (integer polygons, lines and rectangles). The complete
small-studio schema is in `pixel-studio-contract.md`. Neither representation
is a proven quality improvement until controlled repeated trials pass. The source remains easy for Luna
to inspect and edit without rebuilding Rust or browsing the entire game.

For block textures, use **material-specific periodic geometry**. Planks have
board courses, staggered joints and sparse connected grain; stone has grouped
faces and boundaries. These are not all-purpose random-noise skins. The pilot
tool has `planks` and `stone` recipes, each with four explicit colors and a seed.
A tile entry has `name`, `kind: "tile"`, `recipe`, `size`, `palette` and `seed`.
Unknown material names fail; add a deliberate recipe instead of a fallback.

Tile art is opaque and repeats over surfaces. Item art usually has transparent
background and a readable single-object silhouette. Do not apply an isometric
cube mask to the world's flat texture. Derive a block's inventory cube from its
reviewed face textures so its UI icon and world appearance can stay consistent.
The offline cube projection is a study view; native game material review is
still required, with actual face orientation, lighting and terrain context.

```powershell
python tools/pixel_studio.py build studies/item_studies/my-family.json --out out/pixel-studies/my-family-v1
python tools/pixel_studio.py audit assets/items/authored --out out/pixel-studies/catalog-audit.json
```

Use a new output directory for each revision. The tool writes native PNGs,
unlabeled and labeled boards, an answer key, duplicate/palette diagnostics,
3x3 tile repeats, cube studies and a browser gallery. Output always remains
`accepted: false` pending visual review. There is no promotion operation.

## Review sequence

1. Assign one family of **4â€“8 items**, at most twelve. Supply exact names,
   reference images, distinguishing shape features and forbidden confusions.
   Preserve the first source and first board.
2. View only the unlabeled board first. A fresh Luna critic identifies each
   item at native/2x slot size and notes ambiguity. Compare those answers with
   the separate answer key. Do not tell the critic the identities first and
   then ask whether it can recognize them.
3. Reveal the identities and compare candidate/reference pairs: contour,
   proportions, negative space, material roles, lighting and neighboring icons.
   A generic object of the right color fails when the signature shape is absent.
4. For tiles inspect a 3x3 repeat, offset seams and corresponding cube faces.
   An exactly duplicated edge row is not required for tiling; continuity and
   unwanted repetition must be judged in the repeated view. Check larger flat
   areas as well as one cube. Keep albedo lighting separate from scene lighting.
5. Preserve the independent verdict. Do not send corrections or follow-up
   messages to experimental authors. Update the reusable harness between
   cohorts and launch fresh controlled experiments with the same evaluation.
   Keep failed outcomes; do not lower the recognition bar.
6. Integrate only the exact reviewed assets. Then run existing `inventoryshot`
   and inventory interaction/centering checks. World textures also need native
   material/terrain captures. Record individual approvals; a technical pass or
   one good family does not approve the rest of the catalog.

## Canvas, SVG and online AI options

Canvas and SVG are representations, not stronger art models. Under the user's
Luna-only constraint, the practical route is **Luna-authored pixel data and
material recipes, an exact raster export, and independent blind evaluation**.
Canvas is useful for an interactive pixel editor: native dimensions, integer
coordinates, `putImageData`, and smoothing disabled for zoom. SVG can represent
one rectangle per pixel, but free-form paths and antialiased downsampling do
not provide control over final 16x16 pixels. Aseprite is useful for manual
touch-ups, palettes, tile inspection and scripted export; it does not itself
solve semantic recognition.

Research checked September 9, 2026:

| Approach | Verified capability | Fit under Luna-only constraint |
| --- | --- | --- |
| Hollowflux | OpenAI showcase of an iterative code-authored game/art workflow | Useful process example, not a pixel-art quality benchmark or a model ranking |
| PixelLab | Style/reference-conditioned pixel-art tools, inpainting, animation and tileset tools | External image-model generation; researched only, not selected or called |
| Retro Diffusion | Dedicated pixel images, reference-based generation, animation and tile/tileset APIs | External image-model generation; researched only, not selected or called |
| Aseprite | Native pixel editor with palettes and CLI batch export | Compatible tooling; Luna still authors the art |
| Canvas / explicit raster data | Exact pixel buffers and crisp nearest-neighbor display | Selected representation; no extra generative model |

No comparative trial here establishes a state-of-the-art winner. There is no
reason to buy or call a different image service to implement this correction.
If that constraint changes later, compare the same small labeled test set at
the actual target resolution before adopting a provider; larger attractive
samples do not establish 16x16 recognizability or texture tiling quality.

Sources: [Hollowflux](https://developers.openai.com/showcase/hollowflux),
[PixelLab style tools](https://www.pixellab.ai/docs/tools/style),
[Retro Diffusion API examples](https://github.com/Retro-Diffusion/api-examples),
[Aseprite CLI](https://www.aseprite.org/docs/cli/),
[Canvas pixel buffers](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas),
[Canvas smoothing](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled).
