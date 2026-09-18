# MineBench harness correction — 2026-09-09

The user's reference is the hosted steampunk airship comparison:
https://minebench.ai/sandbox?models=openai_gpt_6_astra%2Copenai_gpt_5_6_luna&promptId=cmk5zdnbr0009kx270qtc8zh3

The earlier local airship used a static one-bone mob study, approximately 48,000
occupied cells, a reduced design context and RGB swatches. Its box-like hull,
stacked balloon bands and thin propeller crosses did not match the reference.
Mechanical checks were incorrectly treated as evidence of visual quality. The
build was below its cap: it was not silently truncated by that cap.

## Final workflow correction

The user explicitly rejected rebuilding the scaffolding in another wrapper.
Use the **complete upstream MineBench app** at `../minebench-upstream`, pinned to
`b256ef5e1a6060e4d69e3be3b40b1e58773831a1`. Its source is unchanged and its locked
dependencies are installed. See [structure-authoring.md](structure-authoring.md).

The existing `/sandbox?mode=import` workspace supplies the prompt builder,
grid/palette controls, JSON and tool-call parsing, execution, validation,
textured viewing, orbit/pan/fullscreen controls, explorer and exports. The
existing `pnpm tool:convert --in <call.json> --out <build.json> --expanded`
converts Luna's JavaScript envelope without a separate adapter. Import works
without provider credentials or database writes. The saved arena/catalog and
provider generation routes retain their upstream setup requirements.

The original `VoxelViewer`, voxel mesher and Faithful face textures remain
intact: `oak_planks`, `oak_log`, `glass`, wool and metal are actual named blocks.
The intermediate local static wrapper and standalone comparison viewer are
retired, along with earlier Rhai and one-bone structure generation defaults.
Their removal is recorded in `structure-retirement.json`. Existing articulated
mob tools, tree bakes, game assets and native validators still serve live content.

## Actual Luna validation

The artist, independent harness reviewer and comparison reviewer were actually
assigned `gpt-5.6-luna` with `max` reasoning. The first detailed draft contained
832,626 cells but failed image review: its balloon buried the machinery and
rigging, propellers had fragmented pale edges, and detached bow cells remained.
The same artist iterated against the visible defects. Revision v8 fixed the
buried construction and detached cells; its overly broad propeller blades still
failed visual review. Revision v9 narrows those blades and passes the upstream
converter with 856,361 expanded blocks and no warnings. The exact v9 tool call
was imported in the unchanged upstream app and captured from six views without
browser errors. The parent and independent Luna max reviewer accept its visual
detail relative to the hosted Luna reference. Clear blade gaps, connected
machinery, a curved detailed wood hull, projecting textile construction and a
furnished glass bridge are visible. The envelope is busier and the hanging
ladders are shorter than the reference; this is comparable detail, not an exact
stylistic copy. See the [image-backed review](../studies/structure_studies/airship-luna/review.md).

The public Luna reference stream delivers 86,135 renderable surface cells,
while its historical generation metric is 662,586 cells. These are different
stages, not conflicting original-volume measurements. The surface payload,
source checksum and original metadata are retained separately. Hosted raw author
JavaScript and the historical accepted inference token allocation are not
published in that metadata. Current source profiles remain available in the
complete checkout. Agent iteration with concept/reference feedback is not a
claim of identical one-shot inference.

The code at the older executor pin used by the mob adapter is text-identical
(line endings normalized) to this checkout's corresponding executor, validator
and palette files. Keep that existing adapter for articulated mobs; do not use
it to invent another static study harness.
