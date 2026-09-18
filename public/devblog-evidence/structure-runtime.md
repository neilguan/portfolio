New AI structures use [structure-authoring.md](structure-authoring.md).
The earlier Rhai AI-generation workflow has been retired. This document is only
the compatibility reference for existing recipes, tree bakes and terrain fitting.

# Existing recipe runtime and terrain fitting

For connected ruins and room kits, start with [Cairn Sanctuary](cairn-ruins.md).
That route runs actual pinned MineBench source, bakes modules, assembles seeded
door graphs natively, checks actual clear routes and places sleeping guardians.
It uses the same terrain fitter described below. The rest of this page covers
the existing Rhai route for individual structure recipes.

Structure generators are small sandboxed Rhai programs in `assets/structures/`.
They are source assets, not save data. A recipe runs once when an instance is
placed, emits local voxel geometry, and then the terrain fitter turns it into the
canonical edit overlay used by CPU queries and the GPU generator.

The variant seed is a hash of the recipe source, world seed, and world X/Z
placement. The same inputs reproduce byte-identical edits. Moving the same
recipe one block or changing the world seed selects a different variant. This is
how one tree recipe can describe millions of trees, in the same broad sense that
one stronghold algorithm describes many layouts.

## Choose the runtime path first

The structure harness is for sparse placed instances. It does not make a large
recipe cheap enough to execute for every ambient tree or rock.

- Existing sparse Rhai assets produce the canonical edit overlay at placement.
- For new high-frequency worldgen, first review a static MineBench prototype,
  then translate a representative silhouette set into bounded worldgen data.
  The ambient runtime must not execute Rhai or allocate an edit overlay per
  instance.
- If only the proof of concept was requested, stop after the one named type.
  Additional species and a general bake pipeline are separate scope.

`tree_bake` provides lossless recipe-to-worldgen baking for compact trees. Other
structure types still need an explicit ambient integration design. An ambient
integration task must name its target representation, variant-selection rule,
CPU/WGSL mirror, voxel or mesh budget, and fixed-camera performance gate.

## Legacy recipe API (maintenance only)

All coordinates are integer local coordinates. Local Y=0 is the finished ground
plane; never guess a world Y in a recipe.

```rhai
name("display name");
terrain_fit(blend_radius, clearance, "foundation_block", "fill_block");
surface_material("natural"); // or a block name for plazas/roads
support(x1, z1, x2, z2);

block(x, y, z, "block_name");
fill(x1, y1, z1, x2, y2, z2, "block_name");
line(x1, y1, z1, x2, y2, z2, "block_name");
ellipsoid(cx, cy, cz, rx, ry, rz, "block_name");
shell_ellipsoid(cx, cy, cz, rx, ry, rz, thickness, "block_name");
tapered_line(x1, y1, z1, x2, y2, z2, start_radius, end_radius, "block_name");
connected_line(x1, y1, z1, x2, y2, z2, "block_name"); // thin, face-connected path
crown_pad(cx, cy, cz, rx, rz, "block_name"); // chunky 3-layer pad / 5-layer core
clear(x, y, z);
clear_fill(x1, y1, z1, x2, y2, z2);

let n = rand_int(inclusive_min, inclusive_max);
if chance(numerator, denominator) { /* ... */ }
```

The read-only constants `WORLD_SEED`, `ORIGIN_X`, `ORIGIN_Z`,
`VARIANT_SEED_LO`, and `VARIANT_SEED_HI` are also available. Prefer
`rand_int`/`chance` for ordinary variation. Later voxel calls override earlier
ones; `clear` removes earlier authored geometry rather than placing an air block.

Only names in `src/block.rs::BLOCKS` are valid. The runtime rejects unknown or
air materials, out-of-range coordinates, missing supports, empty output, and any
recipe that exceeds the fixed edit capacities. It has no filesystem, network,
module import, clock, or nondeterministic random source, and it enforces limits
on script operations, recursion, collections, source size, and emitted voxels.

## Terrain fitting

`support` rectangles describe the ground-bearing footprint, not the whole
visual bounding box. Placement samples real terrain before making edits and uses
the median ground height beneath those supports. The recipe's blend radius is a
minimum; terrain whose outer ring is farther from the platform automatically
widens the apron, up to the engine's bounded maximum. It then:

1. cuts or fills the footprint to the chosen plane and installs foundation;
2. clears trees and terrain crossing the declared footprint/clearance;
3. blends every changed apron column with deterministic cubic easing; and
4. makes the final ring exactly equal to the untouched natural terrain.

The easing adds no artificial slope at the platform or the outer seam. Geometry
is applied after fitting, so roots, walls, floors, and buried details win over
the adapter.

The adaptive radius examines every transition column, including interior
convex crests, concave hollows and saddle ridges that return to level ground
before the outside edge. Samples are cached for the complete placement;
radius selection and final fitting see the same unchanged terrain. The bound,
integer cubic blend and exact natural outer seam remain unchanged. Extremely
steep sites still have finite edit capacity; the sparse den population keeps
its existing bounded site selection and rejects oversized secondary sites.

Existing recipe replays retain their independent named-feature, navigation and
terrain checks. New Rhai author packets are disabled in the compact content loop.

## Validate and preview

Run a recipe through many worlds without opening a GPU window:

```text
cargo run --bin structurecheck -- assets/structures/ancient_oak.rhai 64
```

The checker executes every seed twice and requires byte-identical authored
geometry and edit buffers. It counts local geometry separately from terrain
edits, and fails when fewer than half of a sample of at least eight seeds make
distinct geometries. Varying terrain beneath a fixed sculpture is not tree
variety. Use a seed count below eight to check a deliberately static recipe.

To load one in the renderer, set `MCGPU_STRUCTURE` to a `.rhai` recipe (or a
static `.json` blueprint). `MCGPU_STRUCTURE_ORIGIN=x,z` chooses the placement;
the script default is `64,0`. `MCGPU_WORLD_SEED` selects the world. Example in
PowerShell:

```powershell
$env:MCGPU_STRUCTURE = "assets/structures/ancient_oak.rhai"
$env:MCGPU_STRUCTURE_ORIGIN = "64,0"
cargo run --release
```

The same variables work with the headless screenshot tool, which is the fastest
way to review silhouette and the ground seam without opening the app:

```powershell
$env:MCGPU_STRUCTURE = "assets/structures/ancient_oak.rhai"
$env:MCGPU_STRUCTURE_ORIGIN = "0,0"
cargo run --release --bin shot -- out/ancient-oak.png -65 105 -65 0.78 -0.3
```

## Luna authoring brief

Worker assignments for new structures follow `docs/structure-authoring.md`.
This Rust compatibility runtime is not the MineBench executor or an AI
generation harness. Its smaller game limits cannot establish study quality.

## Baking a generator into ambient worldgen

Large recipe instances are appropriate for sparse landmarks, but executing a
script and allocating an edit overlay for every tree in a forest is needlessly
expensive. `assets/structures/ancient_oak.rhai` remains the design source for
the hand-optimized ambient oak family in `src/tree_templates.rs`: its roots, tapered trunk,
branch hierarchy, separated crown masses, and seeded variants are rasterized
into immutable vertical bit columns. Rust and WGSL consume the same tables, so
terrain generation remains a bounded lookup and rotation with no Rhai work or
per-tree allocation.

Existing recipe sources remain provenance for the installed tree bakes.
New geometry must first pass the static visual workflow, then a separately
reviewed conversion and performance budget before ambient installation.


## Compact forest authoring and automatic baking

The ambient catalog contains spruce, birch, old-growth oak, pine, fir, willow,
acacia and poplar. Spruce and birch replace the pre-harness generators. Seven
Luna-authored recipes are automatically baked; the six previously validated oak
stencils are retained unchanged as a manually optimized interpretation of the
large landmark recipe. The full ancient oak recipe exceeds the compact envelope.

Run `pwsh -NoProfile -File ./tree-pass.ps1` to rebuild seven recipe bakes,
check 64 terrain placements per family, run focused tests, and render the
review gallery. `-CheckOnly` verifies committed bakes against their source.
On Unix, use `sh ./tree-pass.sh` or `sh ./tree-pass.sh --check`.

For a single recipe:

```text
cargo run --release --locked --bin tree_bake -- assets/structures/birch.rhai assets/tree_bakes
cargo run --release --locked --bin tree_bake -- assets/structures/birch.rhai assets/tree_bakes --check
```

The baker checks all 64 geometries for replay, bounds, palette, rooted
face-connected wood, attached foliage, 3,500-voxel occupancy and 550
material-aware greedy quads. It requires at least 32 distinct geometries.
It selects six unique height quantiles, ordered into three size pairs, and writes
little-endian fill/log masks plus JSON provenance: source digest, seeds, bounds,
counts and mesh costs. It never clips, rescales or repairs output. A failed pass
writes a separate failure review without replacing accepted masks; trust the
exit status and verify freshness with `--check`.

The envelope is x/z -9..9, y -3..27. `connected_line` provides thin branches with
six-neighbour continuity using a fixed axis order. `crown_pad` provides broad
three-layer leaf masses with a narrower five-layer core. Tiny scattered
ellipsoids cost more to mesh. Sandbox, material and terrain-fit limits apply.

The game includes masks at compile time and uploads the 138,624-byte catalog to
one immutable GPU storage buffer at startup. CPU and WGSL share those exact
columns and generated height metadata. Keeping the large catalog out of shader
constant arrays avoids per-invocation storage expansion. Climate selects family;
separate hash bits select size,
crown and orientation. All 48 forms are reachable, including large minority
species. Trees keep two candidate grids, 19x19 footprints and 32-bit columns.
Pine/fir share spruce materials, willow/acacia share oak, and poplar shares birch.
No runtime scripts, per-tree edits or new GPU passes. Recipe edits require a
rebake and game rebuild.

Review `out/tree-variety/review.html`: all forms have solid and wood-only
isometric views plus front, side and top at a common scale. Numeric acceptance
does not approve appearance. Initial pine, birch and willow passes were returned
for stronger crowns or characteristic draping despite passing numeric gates.

Serialize integration checks under the machine-global GPU lock: `tree_agrees`
checks every form/orientation/boundary column exactly against production WGSL;
`terrainagrees` checks terrain, `gentest` checks geometry and `tree_lod_perf`
checks the fixed-camera performance budget. See `tree-variety-plan.md`.
