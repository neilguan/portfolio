# mcgpu-v3

Maintainer start: [development guide](docs/development/README.md). Developer binaries are now `cargo dev <legacy-name>` or `cargo dev <group> <command>`; old `cargo run --bin <probe>` syntax is historical.

Shared worlds have a renderer-independent command authority in
`src/multiplayer.rs`, encrypted relay-capable transport in `src/multiplayer/`,
and a desktop adapter in `src/shared_world.rs`. The host owns player physics,
inventory transactions, creature simulation and durable state. Guests receive
private player records, layered terrain snapshots, compressed creature state and
ordered accepted changes. Prediction never creates world changes or rewards.
Terrain residency and graphics remain local. See
[multiplayer](docs/multiplayer.md) for the protocol, Esc menu, feature gate and
the authority, replication, reconnect, persistence and capacity contracts.

Voxel engine merging **Voxy**-style GPU-driven LOD rendering with **Cubic Chunks**-style
unbounded-in-Y cubic world storage. Everything that scales with world size runs on the GPU.

Durable world authority lives in `world_save`: versioned seed/clock metadata,
identity-keyed player records, and canonical LOD-0 block overrides. An exclusive
writer checkpoints immutable snapshots independently of GPU rendering; the
desktop game owns it today and a future server can own the same interface.
Generated chunks, ambient landmark geometry, meshes, lighting and LOD residency
remain regenerable. See [world persistence](docs/world-persistence.md) for disk
size, recovery, runtime controls and the remaining entity/networking boundary.

Placed structures now retain a sparse edit pyramid through the terrain LODs,
and active mobs use projected-size visibility. See
[distant landmarks](docs/distant-landmarks.md) for the representation, bounded
allocation and coverage-preserving edit refresh design. Natural terrain is unchanged.

The bounded gameplay collision foundation is documented in
[docs/collision.md](docs/collision.md). It operates on immutable local voxel
snapshots with integer continuous collision and translating assemblies; it does
not alter the GPU generation/residency model described here. The survival
controller described below currently uses the existing local terrain queries;
the integer collision foundation is available for future controller integration.

The independent [classic cloud renderer](docs/classic-clouds.md) provides a
surface-only alternative to Meadow's volumetric clouds. Its fixed periodic mesh
is drawn after the world and mobs, inside the existing scene pass.

## Title menu and startup presentation

The title menu owns normal world selection, invite joining and the isolated
Cairn Depths expedition entry. Selecting an ordinary world does not inherit
expedition mode from the launcher's environment. Existing checkpoints retain
their saved seed; new selections supply their own initial seed.

The event loop owns the loading surface while `State::prepare` runs on a worker.
It redraws the reported milestone, elapsed time and animation using separate UI
buffers. Preparation clones device/queue handles but never presents or
reconfigures the shared surface. The game takes over after preparation finishes.
Save and Quit to Title releases the world lock and relaunches the menu.

Save and Quit to Title flushes the active world before releasing its save lock,
network and world resources. The event loop, native window, GPU and UI renderer
remain alive for the title screen and the next world. A save failure keeps the
current world open. `MCGPU_STARTUP_CHECK=1 MCGPU_TITLE_RETURN_CHECK=1` exercises
startup, same-window return to title, and reopening the world in one process;
use `MCGPU_WORLD_DIR` to point this check at a disposable save.

World and column pipelines share an optional Vulkan pipeline cache persisted
under the local application cache directory (`LOCALAPPDATA/mcgpu-v3/pipelines`
on Windows). It contains only driver compilation data, never world data.
Writes use an atomic replacement and a checksum envelope; incompatible cache
data falls back through wgpu. Shader changes still need compilation. Per-pipeline
log timings distinguish terrain compilation from lighting compilation, including
when both use an already assembled shader module. A warm driver cache can already
make these operations fast, so application-cache reuse alone is not evidence
of a measured speedup.

## Target machine (measured, not assumed)

The optional Meadow shader pack is described in [the rendering extension
design](docs/shader-pack.md). It adds bounded terrain-shadow resources after
world generation and extends scene presentation. Generation, residency, mesh
contents and world-buffer writers remain unchanged; Off retains the prior image.

| | |
|---|---|
| GPU | RTX 3090, 24 GB VRAM, Ampere sm_86 |
| CPU | Ryzen 5 5600X, 6C/12T |
| RAM | 64 GB |
| Backend | **Vulkan** (locked) |

Vulkan beats DX12 on this box where it matters: 4 GB max buffer (vs 2 GB), **48 KB** compute
shared memory (vs 32 KB), and `PIPELINE_STATISTICS_QUERY`. Confirmed present:
`MULTI_DRAW_INDIRECT_COUNT`, `INDIRECT_FIRST_INSTANCE`, `TIMESTAMP_QUERY`, `SUBGROUP`,
`SHADER_INT64`, `PARTIALLY_BOUND_BINDING_ARRAY`.

**The design driver is the CPU/GPU asymmetry.** A 6-core CPU cannot feed a 3090 by meshing
chunks. CPU terrain submission therefore records a fixed number of dispatches,
independent of resident cube counts. Gameplay, edited blocks, visible mob poses,
effects and UI add separate CPU work and uploads. These have capacity limits;
capacity alone does not establish a frame-time guarantee. The [FPS audit](docs/fps-audit.md)
records the measured scaling, incremental edit uploads, dispatch batching and
remaining limits on high-density content.

### Hard limits that shape the layout
- `max_storage_buffer_binding_size` = **2 GB** even on Vulkan → every storage binding must
  stay under 2 GB. Large pools get split across bindings, not grown.
- `max_compute_workgroup_storage_size` = 48 KB → the whole binary-greedy mesher fits in
  shared memory (needs ~12 KB) with room to spare.
- `max_compute_workgroups_per_dimension` = 65535 → dispatch dimensions must be tiled above that.

## World model: cubes all the way down

Render handover now supports a spatial crossfade inside the existing residency
ball. The app enables it by default (F4 toggles comparison); terrain generation
and payload allocation are unchanged. The existing cull passes derive a shared
pixel-threshold interval per cube, consumed by both opaque and water drawing.
The app reconstructs those colour samples in fading regions before drawing the
UI; see [LOD smoothing](docs/lod-smoothing.md) for the additional viewport
targets, resolve, and limitations. The original single-target draw methods
remain available for ownership diagnostics.
See [the LOD transition design](docs/lod-transitions.md) for coverage, burial,
memory cost, and streaming limitations. Binary ownership descriptions below
apply per pixel when the blend is enabled, and directly when it is disabled.

The unit is a **32³ cube**, at every level of detail. A cube at LOD `L` spans `32 << L` blocks.
This single primitive is both halves of the brief: cubes indexed by `(x,y,z)` give Cubic Chunks'
unbounded vertical world; the same cube at coarser `L` gives Voxy's LOD hierarchy.

Residency is a **ball per LOD, written into a toroidal ring**, and the two halves of that are
separate decisions that used to be one.

*Which* cubes are resident is a subdivision predicate. A cube hands its ground to its eight
children when the camera comes within `SUBDIV_SPANS` of it, measured in its own spans, and a cube
is resident exactly when its parent hands down. The coarsest level is a `ROOT_SIDE³` box — the
edge of the world, the one extent that is stated rather than derived — and everything below it is
the children of whatever subdivided.

*Where* a resident cube lives is still pure arithmetic: slot `((c % RING) + RING) % RING` at its
own level, `RING = 32`, a mask because `RING` is a power of two. Lookup is O(1) with no pointer
chasing, no atomics and no fragmentation, and camera movement invalidates a shell instead of
rebuilding a tree.

The ring is now a *superset* of residency rather than a definition of it. Slots outside the ball
are empty, and cost a 32-byte record and nothing else.

### Why residency is a predicate and not a descent

The recursive reading — "resident if the parent subdivides, and the parent is resident, and so on
up" — would need a walk, or a top-down descent that enumerates the tree and a hash table to
address what it found. It needs neither, because the predicate is monotone up the ancestry:

> A parent's box contains its child's, so the camera is never further from the parent; and the
> parent's span is twice as long, so the same distance is half as many spans. `span_distance2`
> can therefore only fall as you go up.

So the parent's term implies every term above it, and `resident_at` is one comparison plus a
root-box test. `DESIGN-residency.md` §4.1 planned Stage 4 as a descent precisely because §4.1
keyed the cut on *screen area*, which is neither monotone nor view-independent; §4.4's correction
— that residency must key on distance in spans, or turning your head evicts the world — is what
collapsed the descent into arithmetic. The two amendments are the same amendment, found a stage
apart.

Three things fall out, all of them load-bearing:

* **Levels nest by construction.** A child exists only because its parent handed down, so the
  coarse level can never cut into the fine level's interior and adjacent cubes never differ by
  more than one LOD. The even-snap on the window origin used to buy this and is gone.
* **A cube is never resident under a parent that is not**, which is what lets `cull.wgsl` walk the
  ancestry of any resident cube without checking that the ancestors exist.
* **Admission is monotone too**, by the same argument one level down: a parent is never in a
  higher priority bin than its child, so a short payload pool cannot admit a child under a refused
  parent.

### Why a ring and not a hash table

Give up the ring and a forward map `(coord, lod) -> slot` has to exist somewhere, which is
`shaders/table.wgsl`: a deterministic parallel hash insert, built, measured, and green. It is not
wired in, and the reason is a number.

The wasted address space is bounded, and what bounds it is not the shape. A ring exactly as wide
as the ball's diameter would be `8 / (4π/3) = 1.9x` its volume at *any* reach, because both are
cubic in it — a constant factor and not a growing one. But `RING` has to round up to a power of
two, and that rounding swings the factor by up to 8x depending on where the reach lands. Measured
at the shipped `RING = 32`: `SUBDIV_SPANS = 4` filled 3352 of 32768 slots per level, **9.8x**, and
`SUBDIV_SPANS = 6` fills 10176, **3.2x**. So the ring was at its *worst* at the reach an earlier
draft of this section called its best — which is why growing the ball 2.75x fitted inside a window
already paid for, and cost quads rather than address space.

What decides it is therefore the absolute number, not the ratio: the whole index is `TOTAL_SLOTS`
32-byte records, **9.4 MB**, at any reach this `RING` can hold. Against that, a table has to be
rebuilt every frame from a key set that changes at its fringe, and a key whose collision chain
changed moves cell — which is a regeneration, of a cube that was perfectly good. `tabletest`
measures it on the renderer's own candidate sets: at load 0.65 a 64-block camera step relocates
**2631** cubes that survived, 3.2% of the world, and a 4096-block step relocates 46%.

About 4 MB — the ring's index against the table's own 5 MB of cells and records — is cheaper than
2631 regenerations a step. The table becomes the right answer at a reach where the rounding stops
being affordable — around `SUBDIV_SPANS = 10`, where `RING` has to jump to 64 and the index passes
85 MiB — and it is sitting there, tested, for that day.

### Render distance: 65536 blocks, and why it is `LOD_COUNT` that buys it

There is no far plane to raise. The projection is `perspective_infinite_reverse` — reversed-Z
with the far plane at infinity — so nothing is ever clipped for being distant, and the view
distance is *exactly* the root box: `(ROOT_SIDE/2) * (CUBE << (LOD_COUNT - 1))`.

That leaves two knobs, and for *distance* they are not close. Widening `ROOT_SIDE` buys it
**linearly for cubic memory**; adding a LOD level **doubles** it for a flat `ROOT_SIDE³` more
cubes. So distance is bought with levels, and the shipped `LOD_COUNT = 9` reaches **65536 blocks**
in every direction — 32x the five-level version.

`SUBDIV_SPANS` is the other knob, and what it buys is the *near* field: every handover happens at
`2 * SUBDIV_SPANS` of the level's own spans, LOD 0's included, so raising it moves every handover
together. It is the only knob for that, and it now *is* one — under the ring the handover was
implied by the window edge, so moving it meant moving every window, which meant `RING` had to stay
a power of two, which meant the only available step was 4x the slots per level. Stating the rule
directly makes it an integer.

It costs 294912 slots of address space holding **85088** resident cubes at `SUBDIV_SPANS = 6`,
and it is affordable only because of the index/payload split. Held the old way — a fixed quad
span, a material block and 4 KiB of occupancy for every slot — that many slots would want 9.7 GB
of quads alone, five times over Vulkan's 2 GiB binding limit and so not merely expensive but
unbuildable. With quads drawn from a 57344-cell pool, and materials *and occupancy* both cut to
one frame's generate budget, it is **1908 MB**, of which 1879 MB is the pool. A slot the ball does
not reach costs its 32-byte record and nothing else, which is the only reason the address space is
allowed to be a loose superset of residency — and is why raising `SUBDIV_SPANS` from 4 to 6, which
grew residency 2.75x into a window already paid for, cost quads and nothing else.

Two things had to be fixed before that coverage was worth anything, and both were found by
measurement rather than by looking:

- **The far field was provably empty.** `terrain_height`'s lowest octave had a 512-block
  wavelength and `octave_weight` fades any octave out once sample spacing reaches half its
  wavelength — so at LOD 8, which samples every 256 blocks, *every* octave was dead and the
  terrain was exactly `SEA_LEVEL`. `frametest` showed the two coarsest levels emitting an
  identical **1632 quads** apiece, the signature of a flat sheet. Five continental octaves
  reaching a 16384-block wavelength now carry the far field, and the per-level quad count comes
  out roughly flat all the way to the edge: **233k** quads at LOD 0 down to **97k** at LOD 8, a
  gentle slope over nine levels rather than a cliff into a flat plane — which is what a healthy
  LOD pyramid should look like.
- **Fog was defined as a fraction of the view distance**, a linear ramp over its last 40%. At
  65 km that ramp started at 39 km, past nearly everything worth looking at, and the clipmap
  edge came back as a hard line. Haze is a property of the air rather than of how much memory
  the clipmap has, so it is now exponential — extinction over a path — scaled so the near field
  stays clear across tens of thousands of blocks while the tail still saturates well before the
  clipmap runs out.

The continental octaves use a **0.7 amplitude ratio, not fBm's 0.5 inverted**. Doubling
amplitude per octave downward from 96 blocks at wavelength 512 asks for 3072 blocks of relief
at wavelength 16384 — not a landscape, a wall. Real relief spectra flatten at continental scale,
and the flattening is what makes a range read as a range instead of a cliff. At 0.7 the
continental field is *gentler* per unit distance than the detail standing on it, around 1:8
against 1:1.3, so it adds long swells rather than making local ground wilder.

The base handed to the material rules is snapshotted after **three** of those five octaves, and
that split is load-bearing rather than arbitrary. The beach rule asks whether the surface is low
relative to its surroundings, so the surroundings must be coarser than every scale still alive
at the current LOD. Taking the whole continental field as the base fails exactly where it
matters: at LOD 8 the detail octaves are all faded out, `h` and the base become the same number,
every column reads as shoreline, and LOD 8 measured **100% sand with no grass at all**.
Snapshotting early leaves two continental octaves standing on the base, and those survive to
LOD 9.

### Generation cost is independent of LOD
A LOD-`L` cube is **not** downsampled from fine voxels — the density function is sampled
directly at stride `2^L`. Cost per cube is therefore constant regardless of the volume it
covers, which is what makes a 65536-block view distance affordable. It also anti-aliases
for free: octaves with wavelength below the sample spacing are skipped rather than aliased.

Landform material selection must not turn that constant-cost column work back into repeated
voxel work. The surface composer evaluates shared climate fields and a feature's province/profile
once per column, then carries generated material-activation bits through `Surface` and `Column`.
Near-surface material phases consume those bits and cached column fields; they do not repeat
domain warping, climate, province, or route noise for every voxel. `build.rs` assigns the stable
bits and rejects paired phases that bypass this path.

Generation also retains the surface composer's climate values for the tile's consumed
columns, avoiding a second climate evaluation. Its 128-thread workgroup processes the
same bounded cube workload with under 22.2 KiB of shared scratch. Meshing converts its
sky propagation bit planes in place into packed final levels before greedy merging,
so repeated face comparisons load one cached level. These caches add no GPU pass or
persistent world state; [terrain-streaming.md](docs/terrain-streaming.md) records the
same-input comparisons, whole-frame measurements and equivalence checks.

Fine LODs 0–2 additionally retain complete immutable procedural Columns in a
297 MiB GPU cache keyed by seed, LOD and full horizontal cube coordinates.
A fixed request table and integer prefix build a canonical preparation list;
one producer fills each missing tile before voxel generation consumes it.
Key mismatches fall back to the original evaluator, and player edits still
apply afterward. The cache changes execution cost only, not residency,
generation budgets or the settled world. It uses a separate two-buffer bind
group; [column-cache.md](docs/column-cache.md) records its layout, equivalence
checks and measured moving-frame gain and settled-frame overhead.

Sampling coarsely does bias the *material* rules, in two separate ways, and both corrections
are in `material_for`:

- **Depth.** The density value at a coarse voxel overstates how deep that voxel is by up to
  `spacing - 1` blocks, which would render whole hillsides as stone. Corrected by
  `max(depth - (spacing - 1), 0)` before the stone/dirt cutoffs.
- **Altitude.** The altitude rules ask where the *surface* is, but `p.y` is only the floor of a
  voxel that can be 512 blocks tall. The height field knows exactly where the surface is, so
  `material_for` asks it and clamps into the voxel — `clamp(h, p.y, p.y + spacing)` — which
  keeps an overhang carved away from the height field reading its own altitude rather than the
  ground's, and reduces to `p.y` within a block at LOD 0. What this replaced was a fixed
  half-cell offset, `p.y + (spacing - 1) / 2`, which measured well at LOD 4 and fell apart past
  LOD 7 because it grows without bound: at LOD 9 it is a 255-block guess, wider than the whole
  span of thresholds it was correcting. On one flat sheet of ground it put LOD 7 at 17.6% sand,
  LOD 8 at 17.6% grass and LOD 9 at 17.6% snow — three levels, three answers, same terrain.
  Residual bias is now **+0.4 blocks**, and 76.5% of shared columns get an identical material at
  LOD 0 and LOD 4 (`mattest`).
- **Beaches are relative, the snow line is not.** Once the land itself moves through several
  hundred blocks, sea level stops being one global plane: each basin has its own floor, and a
  fixed `y < 66` renders every low continent entirely as sand. The beach rule is measured
  against the local continental base instead, and reduces to exactly the old absolute rule where
  that base sits at sea level. Cold, by contrast, really is a property of how high you are and
  not of the ground beside you, so `SNOW_LINE` stays absolute. Across all nine levels the surface
  now comes out 5.7–9.8% grass and 6.2–11.8% sand — no level disagreeing with its neighbours.

## Buffer layout

| Buffer | Depth | Per entry | Purpose |
|---|---|---|---|
| `records` | `TOTAL_SLOTS` | 32 B | coord, lod, cell, mat, quad_count, state |
| `solid` | `TOTAL_SLOTS` | 4 B | has this cube no air in it? Written by `generate.wgsl`, read by cull's buried checks |
| `quads` | `PAYLOAD_SLOTS` | 8 B × 4096 | greedy quads, one allocator cell per non-empty cube |
| `owner` | `PAYLOAD_SLOTS` | 4 B | cell → slot, the other half of the handshake |
| `occupancy` | `MAT_SLOTS` | 4 KB (32³ bits) | `occ[z*32 + x]` = u32 bitmask over **y** — vertical columns, pre-oriented for the mesher |
| `materials` | `MAT_SLOTS` | 32 KB (u8 packed 4/u32) | sampled only for surface voxels |
| `sky_cover` | `MAT_SLOTS` | 8 KB (two u32/column) | positive 3D depth at the cube top plus final opaque mask; both lighting paths share block opacity |

The depths differ because the three kinds of table answer different questions, and that split is
what Stage 3 bought and Stage 4 finished. `records` is the **index**: one entry per slot,
addressed by ring arithmetic, no allocation anywhere, and cheap enough that the address space can
be 3.5x the resident set — and was 9.8x at the reach Stage 4a shipped. `quads` is the **payload**,
and a cube that is all air needs none of it: 44793 of 85088 resident cubes hold quads in a settled
world and `flytest` peaks at 45549 over four flights, so the pool is 57344 cells and a free-list
allocator hands them out. `occupancy` and `materials` are neither — generation writes them and
the same frame's mesh pass reads them, so both only have to be as deep
as one frame's generate budget, which is 256. Sizing them per slot instead would have cost 1.2 GB
and 9.7 GB respectively, to hold bytes that never survive the frame that wrote them — and it is
occupancy moving to scratch that made `RING = 32` possible at all.

Separating occupancy from materials lets the mesher compute all geometry without ever reading
material data — a large bandwidth saving in the hottest pass. Putting **y in the bit index** is
what makes the mesher cheap: a vertical run of solid voxels is a run of set bits in one word,
so extracting +Y faces is `col & ~(col >> 1)` for 32 voxels at once.

**Quad = 8 bytes.** `word0`: x,y,z,w,h (5 bits each) + dir (3). `word1`: material (8) +
four corner occlusion levels (2 bits each) + sky exposure (4) — the baked light, in bits word1
already had spare, so lighting cost the quad no bytes and the frame no pass. Drawn with **zero
vertex buffers**: `vertex_count = 6,
instance_count = quad_count, first_instance = cell_quad_base(cell)`, so the vertex shader pulls
the quad by `instance_index` and recovers the cube with `owner[instance_index >> MAX_QUADS_SHIFT]`
— cells are a fixed `1 << MAX_QUADS_SHIFT` quads apart, so the cell is the top bits of the
instance index and the one indirection is the ownership lookup that the pool made necessary.
`first_instance` as the quad base is why `INDIRECT_FIRST_INSTANCE` matters.

`sky_cover` carries a second word per column containing final `F_OPAQUE` bits,
the same mask the exact light solver consumes. The baked estimate counts those
bits rather than rendered occupancy, so leaves and glass cannot acquire a
stronger shadow when represented by a coarser voxel. The extra 1 MiB is fixed
scratch; generation already derives the mask from the edited block IDs.

Before greedy merging, the mesher also computes lateral sky through that opaque
mask. Four bit planes carry 32 heights at once through six air neighbors,
stopping at walls, cube edges or zero light. The transpose arrays serve as wave
fronts first, then are overwritten with their normal occupancy data. The extra
16 KiB of temporary workgroup data keep branches from turning black outside the
exact-light cache without adding a frame pass or persistent light volume. The
result stays part of the baked merge key. Draw hands over between baked and
exact levels over the outer 32 blocks of cache range, quantized per block face.
`DESIGN-lighting.md` records the distance rules, limitations and measured cost.

`sky_cover` must use the same 3D density as voxel occupancy. Subtracting the cube top from the
nominal 2D surface height looks equivalent, but the surface-density perturbation is what creates
undercuts. At a vertical cube boundary the lower cube then counted imaginary rock while the upper
cube contained air, producing a dark horizontal band every 32 voxels (and black water where an
undercut opened below sea level). Generation therefore samples `terrain_density` once at the cube
top for each column and stores its positive depth. That is one additional density sample beside
the 32 voxel samples already made for the column, remains a pure function of the cube, and makes
the carried cover agree with the geometry on both sides of the boundary.

Corner occlusion follows the opaque mesher's cube-local outside-is-air rule. Its three samples
may cross an in-plane cube edge; those unknown samples contribute no occlusion. Clamping them
back into the cube duplicates edge voxels — the side and diagonal can become the same block —
and added an extra dark edge on the 32-voxel cube grid. The open boundary may omit one voxel of
contact shadow, but it neither invents geometry nor requires a neighbour read.

The mesher retains the packed corner values for ABI stability and diagnostics,
but the default renderer no longer uses ambient occlusion or interpolated corner
light. Each block face receives fixed orientation shading and the integer light
of its adjacent air voxel, including inside a large greedy quad. The vertex
shader resolves the one light-cube key shared by that quad; the fragment shader
reads one packed word using cube-local coordinates. Large world coordinates
never enter this lookup as floats. Low nonzero levels use a cool skylight/warm
block-light palette, while zero in both channels remains exact black.

## Frame pipeline — all five stages on GPU

1. **Residency** (compute) — camera vs clipmap. Takes this frame's admission threshold from a
   histogram of how far every candidate is in units of its own span; releases the cells and
   records of slots the threshold no longer reaches and of cubes whose window has moved on;
   rebuilds the free list; and queues the slots that need generating against the cells they will
   fill. Reserving the cell *before* queueing is what makes an exhausted pool degrade instead of
   break: the only failure mode is "not queued this frame", and the draw rule already answers
   that by keeping the ancestor. At the shipped pool the threshold never bites — 44793 cells of
   57344 are in use — so it is time spent proving there is nothing to decide.
2. **Generate** (compute, *indirect*) — mark column requests, prefix-list cache misses and prepare
   missing horizontal tiles, then density function → occupancy + materials, straight into VRAM.
3. **Mesh list** (compute) — collects the slots whose occupancy just changed into a second queue.
4. **Mesh** (compute, *indirect*) — binary greedy meshing.
5. **Cull** (compute) — one pass writing each slot's hand-down verdict, then frustum + ancestry
   walk + screen-space size; writes `DrawIndirectArgs` + a count. Run twice over the same
   verdicts, once per draw list: a cube's quads are opaque first and water second, so the two
   lists are the two halves of one range and `water_quads[slot]` is the only number that splits
   them.
6. **Draw** — two `multi_draw_indirect_count`s in one render pass. The opaque list writes depth;
   the water list is alpha-blended, depth-testing but not depth-writing, and is drawn after it so
   the seabed it is blended against is already there.

Stages 2 and 4 are driven by `dispatch_workgroups_indirect` off queues the compute passes wrote,
so streaming never round-trips through the CPU. A queue's length lands in the counters buffer as
a plain u32; `encode_indirect` `copy_buffer_to_buffer`s those 12 bytes into a dedicated
`dispatch_args` buffer immediately before the dispatch that consumes them. That copy exists
because a buffer cannot be both the indirect source and a storage binding being written in the
same pass — and it keeps the CPU from ever learning the count. Readback is limited to a small
stats block, read asynchronously several frames late, and never blocks the frame.

### Water optics: one alpha rule, one shared medium

Two problems, and only the first is about the water *surface*.

**Seen from outside.** The pack's water texture carries alpha 0.8, which made a nearly vertical
view too opaque for this world's deep basins while still letting a 60-block ocean at a grazing
angle blend like a puddle. `fs_water` keeps the pack's alpha as authored optical density, scales
that density for gameplay clarity, and re-derives opacity along the slant path:
`alpha = 1 - (1 - a)^(0.36s)`, Beer–Lambert with `s = 1/cos θ`. Nearby top-down water is
therefore clearer, while a long grazing path still converges to opaque and hides distant LOD
terracing.

The slant costs nothing. Every visible water top face lies exactly on `SEA_LEVEL` at every LOD
— coarse levels clamp to the plane rather than to a sampled height — so the eye's height above
that plane is a per-frame constant the fragment already holds in `G.cam_block.y` and
`G.cam_frac.y`, and `in.dist` is already interpolated for aerial perspective. Their ratio is
the secant. No new varying, no new uniform, and nothing added to the quad's material word —
which is the alternative that was rejected: a quantized per-column water depth packed in there
would split the ocean's whole-plane greedy quads, and the quad pool already runs 86% full at
peak.

The same expression works from below, where grazing views saturate — which is what total
internal reflection looks like without modelling it. The rare water face that is *not* on the
sea plane (a flooded cave mouth, a placed block) measures its own plane instead and lands near
the pack's alpha, so the rule degrades to the previous behaviour rather than misbehaving.

**Seen from inside.** `Globals` gains `submerged: f32`, the eye's depth under the water
surface. The CPU fills it from the terrain mirror by asking which block the eye *occupies*,
not by comparing `y` against `SEA_LEVEL`, so a dry air pocket in a cave below the sea reads 0
and a flooded one does not. It stays a pure function of `(seed, camera, edits)` and defaults
to 0.0, which is what keeps every headless harness rendering the frame it rendered before.

`shaders/water.wgsl` holds the medium itself and is included by *both* the world pass and the
background pass. The sharing is the whole reason it is a file: `draw.wgsl` fades geometry
towards the medium over distance and `sky.wgsl` *is* that medium at infinite distance, so two
copies of the constants would appear as a ring at the horizon. Absorption is spectral —
48 / 136 / 320 blocks per channel — because a scalar version rendered a bright tan seabed
behind blue haze. Red still disappears much faster than blue, while the 384-block view range
keeps the generator's two-hundred-block-deep basins navigable instead of crushing them to one
flat colour.

The surface and the volume take **different** halves of that. `underwater_transmission()` is
depth only and applies to a face that has already been lit — including by how much sky it can
see — so the underwater branch runs *after* the daylight term rather than replacing it; a
seabed under an overhang is shaded for the same reason a cave wall is, water or no water.
`underwater_medium()` keeps daylight, because the volume is lit through open sea and its sky
visibility is 1 by construction. Collapsing the two back into one function drains the day from
the background pass, which is the one place there is no face to ask.

**The sampler.** Water alone gets a `Filtering` sampler at binding 7: trilinear, 16×
anisotropic, while every other block keeps `mag_filter: Nearest`. That rule is about pixel art,
and `water_still` is not pixel art — all 256 of its texels are identical until
`ripple_water_tile` writes two sines across them — so point-sampling a smooth procedural field
was an error rather than a style. What it buys is the grazing band *above* the water line,
where the ripple's high-frequency energy drops by 7× to 100×. It is not what fixed the
underwater starburst; the medium did that, and `src/atlas.rs` carries the ablation that
separates them.

### LOD handover: a level gives up its ground only when the next one has it

The obvious rule for which level draws a patch of ground is pure geometry: a cube is skipped
when the next finer window spans all of it. It is wrong, and it is wrong in a way that only a
moving camera shows.

Coverage reacts to the camera instantly; content does not. A step across a subdivision boundary
brings in a shell of new cubes and `GEN_BUDGET` is a per-frame count, so the coarse cube is retired several
frames before its replacements exist. `flytest` measures the result: at walking pace, holes in
**9% of frames, up to 884 cubes at once, the nearest 62 blocks from the camera**, in unbroken
runs of 14 frames. The same rule produces the opposite defect too — a slot whose replacement is
still queued goes on drawing its *previous* cube, a full ring-span away, under whatever level
owns that ground now: **overlaps at 0 blocks**, which z-fight.

So the drawn level is the finest one that is actually there. Two predicates over resident cubes:

```
hands_down(c) = ready(c) and subdiv(c) and children_ready(c) and too_big(c)
owns(c)       = ready(c) and not hands_down(c)
                          and hands_down(a) for every strict ancestor a
```

**Exactly one cube owns any point, on every frame, and the proof needs no assumptions.** Take a
point in the root box and walk the chain of cubes containing it, `a_L` down to `a_0`. Let `m` be
the deepest index with `a_L .. a_(m+1)` all handing down and `a_m` not; `m` exists because
`subdiv` is false at LOD 0, so `a_0` never hands down. Then `a_m` is resident (its parent
subdivided, and that is exactly what residency means), and ready (`hands_down(a_(m+1))` checked
all eight of its children, of which `a_m` is one), so `owns(a_m)` holds. Above `m` nothing owns,
because those cubes hand down; below `m` nothing owns, because the ancestor `a_m` does not.

What that argument does *not* use is worth as much as what it does: no assumption about
generation order, none that a cube is ready only when its parent is, and none that the
screen-space estimate is monotone. The previous rule needed all three — it checked one level up
and leaned on coarsest-first generation and on synchronised window slides for the rest — and each
was a property of the ring that the ball does not have. Under the ball a cube's *uncles* can be
admitted or refused independently of it, and the rule above does not care.

Three things pay for it. Cubes hidden under a finer level are generated even though nothing draws
them — they are the fallback the rule falls back *to*, and they cost an eighth more cubes per
level and not one byte more memory, because the slots were statically assigned already.
`hands_down` is precomputed into a byte per slot by its own pass, because every descendant needs
its ancestors' verdicts and computing them in place would be nine lookups per ancestor instead of
one. And cull reads about seventeen extra records per slot, which is what a defect visible on
every LOD boundary crossing costs.

### Screen-space size: the same handover rule, in the units it was always about

The rule above says *when* a level may hand its ground down. It does not say whether it should.
The clipmap answers that by distance alone — and that is a screen-space rule already, just an
implicit one: the shell radii scale with cube span, so a cube at a handover boundary always
subtends about the same angle. But it is written at one fixed window size and one fixed field of
view, and it cannot notice when either changes. Widen the FOV and every cube shrinks on screen
while the shells stay exactly where they were.

So the test is now stated in its own units. `projected_frac` projects a cube's eight corners,
takes the area of the silhouette, and compares it against `SUBDIV_PX²/(W·H)` — the share of the
framebuffer covered by a square `SUBDIV_PX` pixels on a side. A cube larger than that wants the
finer level; a cube smaller keeps its ground. This is voxy's rule, and `SUBDIV_PX = 128`.

The area is exact for a box under an orthographic view and approximate under perspective: six
cross products fan the silhouette from corners 0 and 7, which is the right partition for most
orientations and slightly wrong for the rest. That approximation is why the test cannot simply
be applied cube by cube.

**Monotonicity is the correctness condition, not accuracy.** The tiling argument needs
`hand_down(c) ⟹ hand_down(parent(c))`: if a cube yields its ground, its parent must have yielded
too, or two levels draw the same patch. Voxy gets this for free by descending the octree from the
root — it never reaches a child whose parent did not subdivide. The cull pass is a flat scan over
slots with no descent to inherit from, so the property is made structural instead, and the draw
rule is where it now lives rather than inside this test: a cube draws only when **every** strict
ancestor hands down, and each ancestor's own screen-space verdict is one of the terms in that
conjunction. The AND-chain that used to wrap `too_big` was the same idea applied one function too
early, and it deleted itself when the draw rule started stating the whole condition.

Two details the walk has to get right. `coord >> 1` on a signed vector is an arithmetic shift,
hence floor division, hence the octree parent — including at negative coordinates, where
truncating division would name the wrong cell. And a box straddling the near plane has no
meaningful projected area, so it returns `1e30`; that is monotone too, because `w` is affine in
position and therefore minimised at a corner, so a straddling child implies a straddling parent.

**What it buys, measured.** `lodtest` sweeps the threshold at five cameras; onscreen cubes and
quads, test off → 128px:

| camera | onscreen cubes | quads |
|---|---|---|
| spawn, 1600×900, 70° | 10053 → 10053 | unchanged |
| high over terrain, 1600×900, 70° | 5782 → 5621 (−3%) | 690803 → 676965 (−2%) |
| same spot, **800×450** | 5782 → 2305 (−60%) | 690803 → 213751 (−69%) |
| same spot, **110° FOV** | 9574 → 5620 (−41%) | 1570446 → 877822 (−44%) |
| same spot, **10° FOV** | 371 → 371 | unchanged at *every* threshold |

(Measured after terrain landed and before the authored-tree rewrite. The current
spawn row is 10176 cubes and 5139802 quads at both test-off and 128px; the shape
of the result did not move, while content-dependent absolute counts did — see
AGENTS.md §7.1.)

The first two rows are the point of the setting, not a disappointment in it. At the window and
FOV the shells were tuned for, the threshold now agrees with them **exactly** — it takes nothing,
because 128 was chosen as the largest value at which it takes nothing. That is what makes the
shells the thing deciding the near-camera image, which is the whole reason `SUBDIV_SPANS` is
the knob it is.

The middle two rows are why the rule is stated in pixels at all. Halve the window or widen the
field of view and the same 128 sheds two-fifths to three-fifths of the drawn cubes — neither of
which is something a distance shell can see, since a shell radius knows nothing about how many
pixels a block is worth. The threshold is idle at the reference window and immediately useful
away from it.

The distribution says the same thing from the inside. At the reference window the drawn cubes
run from 60px to 196px across the p05–p95 band with a median of 103 — a spread the shells
produced, with the 128 cut sitting *above* the median rather than clipping it. Whenever the
threshold has been the binding constraint the signature has been the opposite: every level
bracketed just under the cut, at both 512px and 192px, which is what a rule cutting alone looks
like.

**And what it cannot buy.** The 10° row is the limitation, stated plainly: at spyglass FOV, 488
cubes at 442–910px fill the screen and no threshold changes anything, because the clipmap's cut
is *already* as deep as its windows reach. The test can only ever hold a cube coarser than
geometry would have drawn it; it has no finer level to ask for. So this is a cost knob that now
responds to resolution and field of view, not a sharpness knob. Making it one needs demand-driven
residency — a cube resident because the screen asked for it rather than because it is within a
radius — which needs an eviction key, which has to be deterministic. That is a larger change than
this one.

The walk measured **21µs** on a 290µs steady-state frame, about 7%, and nearly every slot paid
it: the early exit it had then — `covered_by_finer(parent)`, since deleted along with the rest of
the ring's residency — held for all but the top level, so almost every slot walked its full chain.

It no longer measures at all. After the scan passes were rebuilt the frame came down, and the two
configurations now differ by less than the run-to-run spread — +2µs, +2µs, −7µs over three runs,
and **4µs** on the 317µs frame Stage 4b ships. Nothing in `cull` changed, so the walk's own cost
cannot have, which means the harness stopped being able to see it: `frametest` measures
`max(CPU recording, GPU execution)`, and it reports **110µs of that 317µs frame as CPU command
recording**, about 7µs for each of the fourteen passes. The walk is somewhere under 10µs and this
harness cannot say where. That is worth knowing before reading any other line of the breakdown as
a GPU cost.

Two harness lessons, and the first one is why the second is stated so carefully.

`frametest` used to time the two configurations in blocks — every repetition of "off", then
every repetition of "on" — and best-of-four was supposed to absorb the clocks spinning up. It
does not absorb the clocks *drifting*, which they do over a run, and the drift is monotone in
time rather than noisy, so best-of-N keeps all of it. The reading was **−171µs**: the wrong sign,
and eight times the size of the real effect. Alternating the two within each repetition makes the
same drift land on both equally, and the number fell to 21µs and pointed the right way. The
whole-frame figure moved too, 537µs to 245µs, so the old absolute numbers were inflated across
the board and not only the difference between them.

And a difference that is real can still stop being measurable when the thing it is a fraction of
gets faster. The pair of rows is still the right shape — identical commands, one uniform apart,
so their difference is pure GPU — but a pure-GPU difference is invisible once the GPU is not what
the frame is waiting for. The recording line exists to say when that has happened.

### Occlusion: the buried case, exactly and without history

Voxy calls `isCulledByHiz()` *inside* its traversal, so last frame's depth buffer decides what
exists this frame. That is temporal feedback and it would break determinism outright. What can be
had without it is the case that needs no depth buffer at all: a cube with **no air in it**
contributes exactly its six boundary faces, and a boundary face is visible only if something can
get to the other side of it to look. So a solid cube whose six neighbouring boxes are drawn solid
too cannot be seen from anywhere, and dropping it changes no pixel.

**"Drawn solid" is the whole difficulty.** Asking the neighbour at the cube's own level is not
sound: under a real cut the levels meet all over the frame, so the box across a face may be
coarser than this cube — one box covering it and more — or finer, several boxes covering it. The
question has to be put to whatever actually owns that ground, and the tiling argument above
answers it in one pass. Scan the neighbour's ancestry **from the root down**; the first level that
does not hand down is the level that owns it, because everything above it did. If that level is
below this cube's, no single box covers the face and the answer is no — which gives up exactly the
camera-facing direction, where the finer level is drawn, and that is a LOD seam, the worst place
to be wrong.

**Solidity is stated, not inferred, and the proxy it replaced was wrong in both directions.**
`quad_count == 6` looks like it should mean "solid": a solid cube meshes to its own six faces,
greedily merged one per side. But greedy merging clips a run where the material changes, so a
solid cube of mixed rock emits ten to two hundred quads and was being missed; and a flat plateau
cutting the cube emits a full top, a full bottom and four partial sides — six quads, and not
solid. `frametest` had been using that proxy as its sealed classifier since Stage 1, and its
census moves with the correction: **38482** solid cubes rather than 37856, and **28536** sealed
rather than 32704. The generate pass states the answer instead — it already evaluates every voxel
and writes one word per slot, including air cubes; cull reads that durable result for its buried checks.
That reduction is an AND of integers, associative and commutative, so its order is not a choice
anything can depend on.

**The one place the argument fails is inside the rock.** It assumes the viewer is outside; put the
camera 400 blocks underground and the faces it elides are the ones you are looking at, from
within. `burytest` found this by rendering from down there and getting a quarter of the screen
back as sky. The guard is one lookup: the camera is always at the centre of the ball, so the LOD-0
cube containing it is always resident, and *"the finest cube containing the viewpoint has no air
in it"* is precisely *"the viewpoint is inside the rock"*. A cube not yet ready counts as inside,
which switches the test off during a fill rather than guessing.

**Held to the only standard that matters.** An argument is not a measurement, so `burytest`
renders the same settled world twice from the same camera — once with the test off, once with it
on — and compares the framebuffers byte for byte. **0 of 1,440,000 pixels differ**, at five
cameras and on every one of 60 frames of a moving flight. That is a stronger check than the
coverage tests can make: `flytest` and `alloctest` ask whether the *owning* set tiles the ground,
which this deliberately breaks, since an elided cube leaves its ground undrawn on purpose. Only
the image can say whether that mattered. It also checks that the CPU mirror picks the same slots,
that solidity holds up against the quads themselves — a solid cube's quads must total exactly
`6 × 32 × 32` voxel-faces, however they merged — and that a second settle elides the same set.

**What it is worth, and what it is not.** It takes **66.9% of draw calls** at spawn and **4.75% of
quads**, and 62% of draw calls averaged over a flight. The gap between those two numbers is the
whole character of the thing: the cubes it removes are the small ones, so it is a draw-call saving
far more than a triangle saving. Timed on the render pass alone:

| camera | draw pass, off → on | second run |
|---|---|---|
| spawn, looking out | 662µs → 619µs (**−6.5%**) | −6.3% |
| spawn, looking down | 320µs → 75µs (**−76.7%**) | −77.1% |
| high over terrain | 635µs → 625µs (−1.6%) | −0.1% |

Looking down is the case it was made for — most of what is in the frustum is underground — and it
takes 91% of the draw calls and 66% of the quads there. On the horizon it is a few percent, and
the third row is stated with both readings because it is *not* a measurement: −1.6% and −0.1% is
the run-to-run spread of the same comparison, so at that camera the saving is somewhere at or
below the noise. It costs about **15µs** of the 390µs compute frame, which the first two rows pay
for several times over and the third does not clearly pay for at all.

The measurement worth more than the saving is the *scale*: the draw pass costs 620–660µs against a
390µs compute frame. Drawing is what this renderer waits for, which is the precondition
`DESIGN-residency.md` set on whether depth-buffer occlusion is worth its cost in determinism.

### Meshing: 192 slices, no atomics

A cube's surface is partitioned into **192 fixed slices** — 6 face directions × 32 planes. One
thread meshes one slice serially with binary greedy merging; the 192 per-slice counts are then
exclusive-scanned in slice order by a single thread (192 adds, cheaper than a parallel scan at
this size and trivially deterministic); then every thread writes its quads at its scanned base.
Nothing is appended, so no `atomicAdd` decides where a quad goes and the quad list comes out in
the same order on every run.

A cube that holds water walks **384**: the same six-by-thirty-two partition again, over the water
set instead of the opaque one. The two sets are disjoint halves of occupancy — `water_occ` is the
water subset, so opaque is the difference — and the scan runs across the whole range in slice
order, which is what puts every water quad after every opaque one and lets one `u32` per slot
split the payload into the two draws. Whether the second half runs is an OR over the cube's own
water bits, so it is a property of the cube's contents and not of scheduling, and the buffer stays
byte-identical run to run. Almost every cube in the world has no water and pays nothing.

### Watertight by construction

**Outside a cube is air.** Nothing is read across a slot boundary and nothing is assumed about
the neighbour, so each cube meshes into a *closed surface* around its own opaque set — including
the faces lying in the cube's own boundary plane.

Water is the one set this rule is not applied to, and deliberately. Its boundary faces would be
*blended* rather than buried, so an "outside is air" wall would draw a dark vertical band into the
ocean every 32 blocks at every LOD. It does not need the rule either: water's extent is the fixed
`SEA_LEVEL` plane rather than a field, so the voxel across any boundary is either more water or
the terrain that displaced it, and both want the face culled — the terrain's cube emits its own
face there. Water therefore assumes "outside is occupied" everywhere except a top boundary at or
above the sea plane, which is the ocean surface itself. `SEA_LEVEL` is a constant and the cube's
top is arithmetic, so this is still a local rule and the mesh is still a pure function of
`(coord, lod, seed, edits)`. What it gets wrong is a cave meeting water exactly on a cube
boundary: the water pane there is culled and the neighbouring rock shows through instead. A
missing pane, not a hole.

This is what makes the clipmap seamless, and it is a proof rather than a heuristic. Two cubes at
different LODs put their surfaces in different places, so a cube that culled its boundary faces
against a *predicted* neighbour would leave a gap wherever the prediction and the real neighbour
disagreed — which is everywhere the LOD changes. A union of closed solids cannot be seen
through, whatever the neighbour turns out to be, and the argument does not depend on the
neighbour being resident, on the two cubes agreeing about culling, or even on the ±1 LOD
invariant above.

The price is a buried wall of quads on each shared boundary, which greedy merging flattens to a
handful. Measured over the settled view: **quads 170414 → 209538 (+23%)**, see-through pixels
**5422 → 27 (a 99.5% reduction)**. It also makes meshing a pure function of one cube's own
occupancy, which is a *stronger* determinism property than the design it replaced — an earlier
version generated a one-voxel neighbour shell into the cube's own slot to get the same purity,
and that shell is now deleted rather than left as dead weight.

The obvious follow-up — a cube whose six same-level neighbours are all full is invisible from
anywhere, so drop it from the draw list — was measured and **not** built, because the numbers do
not support it. `slot_of` is pure arithmetic, so the neighbour lookup is six shifts and the test
can be exact rather than conservative; a neighbour outside its level's own window falls back to
its parent, since the windows nest. Settled at spawn under a real projection, the cut is 821
cubes, 223 of them are soundly elidable, and those carry **1338 quads of 124417 — 1.08%**. They
free no memory either: slots are statically assigned, so an elided cube is still generated,
meshed and resident. The predicate is a good one, but it belongs where it decides *residency*
rather than drawing; `DESIGN-residency.md` §3 records the full measurement and moves it there.

Two traps in measuring this, both of which produced a much better-looking number first.
`frametest` settles with `subdiv` at zero and every frustum plane at zero — deliberate, and what
the rest of that file wants — so its draw list is every solid cube in the table, nine levels
stacked on the same ground, 2808 of them; scored against that, elision looks like it saves an
eighth of the world. And asking the neighbour's *own* level is not sound: under a real cut the
levels meet all over the frame, and a coarse cube reading solid says nothing about whether all
eight of its children do, so eliding on its word opens a hole exactly at a LOD seam. The sound
form asks whichever cube in the drawn set actually covers that ground, at whatever level it
covers it. Soundness costs 40 of 263.

## Non-goals for the first milestone
Editing and entities. The spine has to prove out first.

Lighting and transparency have since landed, and both landed inside the existing passes rather
than as new ones — water as a second sweep of the planes the mesher already builds, light as
bits `word1` already had spare and one extra sweep of each plane. Neither is a milestone the
spine had to wait for; both were affordable *because* it had proved out.

## Mob content boundary

`src/mobs.rs` is the data and identity foundation for entities. It deliberately does not join
mob work to terrain generation or cube meshing. Instead it discovers independently authored
`assets/mobs/**/*.mob.json` packages, rejects malformed or unsafe content, sorts definitions by
namespaced resource ID, assigns a stable 64-bit type ID from that name, and emits one canonical
catalog. Directory traversal order is never content.

The package points to a code-drawn texture generator, independent box-UV layout, model profile,
behavior profile, spawn policy, and creative brief. Concept art is an authoring reference only;
the production texture remains the generator source. This preserves the established hybrid:
Pebble's explicit box-UV/output contract with Hollowflux's semantic layers, limited palette, and
small drawing vocabulary. `src/mob_skin.rs` centralizes the bounds-safe canvas, coordinate-hashed
fills, box-UV painter, preview primitives, and PNG output; each generator contains only its
authored palette, semantic paint layers, and model-specific review assembly. Concept-only packages
are allowed so Luna can explore broadly before
the selected designs pay the cost of production skin authoring.

An individual mob's cosmetic identity is a pure function of `(world seed, stable mob type,
world-space spawn anchor, authored slot)`. The slot belongs to the spawn recipe and is not an
append index or discovery order. `mobcheck` validates this layer and writes its ignored compiled
catalog under `out/mobs/`.

`src/mob_model.rs` validates baked rigid-bone models: arbitrary named joint
hierarchies, tapered boxes, triangle panels, exact UV coverage and conservative
pose-independent bounds. `src/mob_render.rs` uploads static geometry once and
poses visible instances through a bounded storage buffer. It uses consistent
right-handed yaw, outward face winding, 32-bit mesh indices, uniform instance
scale, nearest texel sampling and camera-relative f64-to-f32 positioning. Mob
depth shares terrain's reversed-Z attachment; opaque mobs draw before water.

Native clips support bounded optional translation and positive nonuniform scale
alongside rotation. Old rotation-only JSON remains valid. Scaled normals use
matrix cofactors; conservative bounds include animated translation and scale.
`creature_runtime.py` adaptively linearizes authored curves and compares bone
matrices, vertices and landmarks with the independent `creaturepose` binary.

`tools/mob_recipe.py` is the small offline code-drawing vocabulary. Per-package
Python recipes own shape and semantic paint; the game consumes only checked
JSON/PNG artifacts. Profile lofts and hollow shells give authors coherent forms
with automatic surface UVs while baking to the same rigid triangle format.
`mobmodelcheck` independently checks these artifacts and `mobpreview` renders
the actual shared shader, including neutral material, turning/gait poses and
an optional sequence driven by the interpolated runtime simulation.
Close-up and extreme-pose inspection frames expose eye occlusion and joint
seams. Integrator-owned pose-review data adds decoded-eye symmetry, eye
visibility and sampled clothing-coverage rays to the independent checker.
`tools/mob_batch.py` regenerates multiple seeds, compares hashes, serializes GPU
review and keeps candidates separate from promoted production artifacts.
With `--motion`, it assembles the rendered frames into an MP4 when FFmpeg is
available, reporting a frame-only result otherwise. Encoding occurs outside
the GPU lock. These offline review tools add no game-loop work.

The dragon stress specimen adds endpoint-oriented closed segments and a
double-sided membrane option to the recipe vocabulary. Preview framing uses
posed geometry, with one fixed envelope per recorded sequence, and rejects
clipped full-model frames. Integrator-owned anatomy profiles select any bones
for close-ups. Optional surface-visibility probes work in any joint-local
direction; the humanoid paired-eye contract remains available. `--stress`
exports an orbit/pose-sweep MP4 separately from the gameplay-simulation `--motion`
clip. Per-frame bounds/framing and sequence-source manifests accompany the
videos; candidate reports identify exact checked artifact paths and hashes.

`src/mob_sim.rs` owns the bounded 20 Hz entity state machine and swept voxel
collision. This state is intentionally dynamic, separate from pure terrain;
its replay inputs are stable spawn identities, block edits and player positions
per tick. Wandering, looking, optional proximity fleeing, block stepping,
ledge/water avoidance and gravity share one reusable profile. Query exhaustion
rolls back a step; render stalls retain simulation time debt. There is no
per-species engine callback or per-frame script execution.
Head tracking uses a fixed-tick damped response; position, yaw, head angle,
gait phase and gait weight interpolate together at render time. Walk/idle
weights blend without reducing the recipe's authored animation amplitudes.

`src/mob_scene.rs` resolves a bounded cast from the catalog and batches
instances by appearance. The default is one Tideglass plus seeded forest
Cinder roosts. `src/mob_spawn.rs` discovers at most one tree-covered dry roost
per 768-block region; a nine-region neighborhood streams into a fixed batch.
MCGPU_MOBS can select other baked recipe packages without a Rust edit.
The explicit `/spawn dragon` (also `/summon dragon`) command lazily opens one
fixed 16-instance debug batch, even when the selected cast omits dragons. Its
identities and lifetime are separate from streamed forest roosts; it retains
the same AI and damage rules and reserves space for the ambient population.
`/time day|night` sets noon/midnight on the rendering clock while preserving the
moon phase. `/tp <biome>` searches existing climate, surface materials and tree
coverage on a bounded background job; `commands/biomes.rs` resolves a clear
landing against current voxel edits before moving the player. `/biomes` lists
supported destinations. Coordinate `/tp` and landform `/locate` remain available.
Help and command feedback appear only in response to player commands.
General ambient populations, combat/trading, linkage/IK, arbitrary collider shapes, dynamic voxel-light
sampling and entity shadows remain separate integrations. Model capacity is not
a claim that those creature mechanics already exist. See docs/mob-authoring.md
for explicit active-instance, geometry, texture and query budgets.

`src/mob_combat.rs` adds the data-configured `core:melee_guard`: dormant, awake,
approach, committed sweep/slam, recovery, hurt, stagger, return and held death.
Player strikes use body/ray range, voxel cover and a fixed cooldown. Enemy damage
occurs once at a validated impact beat with locked facing and bounded arc/range/
height/cover checks. Unavailable terrain rolls back damage and cues with the
entity. Events drive the existing translucent pipeline's bounded debris, ground
telegraph and contact shade, plus bounded procedural audio voices.
`creature_arena` is an opt-in edit fixture; `creature_pilot` drives actual
Player/Simulation inputs offline. `creaturecheck` supplies independent scenarios.
The finish pipeline binds these results to captures and a separate art decision.
See `docs/creature-playtest.md`.

`src/mob_flight.rs` adds the reusable `core:aerial_guard` profile: perched,
takeoff, powered/gliding patrol, threat display, pursuit, warning, breath,
recovery, return and landing. Its configuration owns
territory size and timings. Flight collision uses the same bounded terrain
queries and complete-tick rollback. The manual perch search includes tree
crowns. A downward expanding cone tests eye/body samples and voxel line of
sight; the fire does not damage through solid cover or outside the territory.
`Player::dragonfire` sets exposed Survival health to zero and clears motion,
while Creative retains its existing immunity. `src/encounter.rs` tracks the
specific dragonfire death presentation and offline preview event. The app locks
movement, closes chat/inventory/settings and restores the safe spawn on R/Enter.

Baked rotation tracks use a twelve-clip vocabulary with strict bounded keys,
smooth interpolation and validated loop/transition endpoints. Locomotion clips
crossfade; breath and steering bank are additive channels. `RigAnchor`
and the mesh renderer share bone evaluation, so fire originates at the posed
mouth. `src/mob_fire.rs` uses a fixed allocation for 48 flame billboards per
active entity in the existing scene render pass, including the LOD smoothing
attachments. The HUD draws in main's depth-free presentation pass. It adds no terrain generation,
block destruction, dynamic lighting or extra terrain GPU pass.

`mobpreview --motion` records twenty-four seconds for an aerial guard, with the
actual death event in its trace, plus a world-fixed camera and depth-tested
review grid. `MCGPU_SHOT_ENCOUNTER=takeoff|patrol|fire|death` enables a separate
integration mode in `shot`, using actual terrain, MobScene and the game's HUD.
The tested authoring and recovery procedure is `docs/astra-mob-workflow.md`;
the Cinder integration evidence is `docs/cinder-flight-validation.md` and
`docs/cinder-ai-validation.md`.

## Player interaction boundary

`inventory.rs` stores the player's fixed-size inventories, equipment, recipes,
and survival/creative mode. `player.rs` asks the existing terrain query facade
for bounded local collision and ray casts and writes accepted edits through
the established overlay. These modules do not change terrain generation or
world residency. `inventory_ui.rs` caches overlay geometry and appends its draw
to the existing native-resolution presentation/UI pass, alongside chat. See
`docs/inventory-and-modes.md` for behavior and focused validation.

## Determinism

Same seed and same inputs must produce bit-identical GPU buffers, on every run and
regardless of frame pacing. On a GPU that is a design constraint, not a code-style
preference — five common techniques are ruled out by it.

**1. No atomic-ordered appends.** `atomicAdd` on a cursor produces a correct *set* in an
arbitrary *order*. Every list (generation queue, mesh queue, quad list, draw list) is instead
built as mark to a fixed slot, exclusive prefix scan, scatter. Output order is ascending slot
index on every run, and the scan total replaces the atomic counter.

The rule is about the *return value*, not about the instruction, and it is worth being exact
because the residency histogram breaks the letter of "no atomics" and not the spirit. An append
is nondeterministic because the index a cube lands at is whichever slot it won, so the list
records arrival order. `hist_count` discards what its `atomicAdd` returns: all it computes is
how many threads hit each bin, and a sum of ones over u32 is associative, commutative and
cannot overflow at this size, so the histogram is bit-identical whatever order the adds land in.
There is no ordering to leak because nothing about it is ordered. The same line separates a
prefix sum, which may be parallel, from a compaction's placement, which may not.

**2. No cross-cube reads anywhere in the pipeline.** Meshing a cube normally needs its
neighbours' occupancy to cull boundary faces, which makes the result depend on which neighbours
happened to be resident — an ordering dependence *and* a read/write race. Here the mesher reads
only its own slot and treats everything outside the cube as air (see *Watertight by
construction*), so meshing is a pure function of `(cube coord, lod, seed)`. This removes the
whole race class rather than synchronising around it.

**3. Fixed-order float arithmetic.** Floating-point addition is not associative, so anything
whose result is stored uses a fixed loop order. No subgroup or wave reductions feed stored
data; they are permitted only for pure-performance work whose result cannot vary.

**4. Work budgets are counted, not timed.** A frame generates a fixed maximum number of
cubes. If the budget were "as many as fit in 2 ms", world state would depend on wall clock
and machine load. World evolution is a function of frame index only; `dt` affects camera
motion, and in replay mode `dt` is fixed too.

**5. No allocation policy with a memory.** The payload pool is the one place in the pipeline
that hands out a resource, and most ordinary ways of doing that are disqualified here: LRU,
last-rendered timestamps, age and atomic append order all make the cell a cube gets depend on
what happened in previous frames or on which workgroup got there first. Instead, a cell is
released exactly when the handshake `records[s].cell == c && owner[c] == s` stops holding, which
is a statement about present world state and nothing else; free cells are collected in ascending
cell order; and queue positions take them in `queue_slot` order. Both orders are total and
fixed, so the whole assignment is a function of world state alone. Eviction never had to be a
*decision* — the window geometry already decides when a cube stops being the cube its slot
should hold, and that is the only reason a cell is ever given up.

Distance from the camera is the one key on that list that is *not* disqualified, and it is what
decides which cubes get cells when the pool cannot hold them all. It is not history: it is a
function of camera position, evaluated fresh every frame. `hist_count` bins every candidate by
distance to the nearest point of the cube in units of the cube's own span, `hist_cut` prefixes
the bins and reads off the last one the pool can afford, and a slot outside that bin holds
nothing — cell, record or both. No cube is ever compared against another, no tie is ever broken,
and the boundary bin goes in whole or out whole. The bin is integer arithmetic on the squared
distance (`firstLeadingBit` plus five bits below it), so there is no `log2` in the one place
where a one-ULP disagreement would change which cube is resident.

Two details make that a *closed* rule rather than a nearly-closed one. The candidate set counts
slots the threshold declined to build, because nothing knows whether an ungenerated cube has
geometry and a threshold that assumed the best would confirm itself; with that term the settled
cut solves `#{cubes nearer than t with geometry} <= cap` and has one fixed point. And release is
per *slot*, not per cell, because an air cube holds no cell and would otherwise sit outside the
threshold still owning its ground. Both are checked: `alloctest` settles a deliberately starved
pool cold and again after walking four cubes out and back, and gets the same digest.

**Verified, not asserted.** `cargo test` runs `tests/determinism.rs`, which drives the real
pipeline headless and hashes occupancy, materials, quads and per-cube records **keyed by world
position rather than by slot** — a run is free to place a cube in a different slot; it is not
free to disagree about what is at a coordinate. It checks four independent ways for the claim to
be false: run-to-run, path independence (wander away and return), pacing independence (per-frame
budget 8 vs 256, which changes the schedule by an order of magnitude), and idempotence (120
extra frames at a settled camera must not move a byte). The frame counter is uploaded and
advanced every frame exactly as the windowed app does it, because holding it at zero would
quietly excuse a generator that varied with frame index — verified by mutation: adding
`f32(G.frame) * 1e-6` to the density makes the test fail. A determinism claim without a test
that can fail is worth nothing.

## Checking tools

`src/bin` holds the standing checks; all are headless and none need a window.

| | |
|---|---|
| `frametest` | the residency leaves tile the root box exactly once; GPU records match the CPU-predicted residency; convergence, path independence, run-to-run digests |
| `flytest` | the same partition, but every frame of a moving camera: no ground undrawn, none drawn twice, and the CPU mirror of the draw rule checked against the count the cull pass actually emitted |
| `lodtest` | how big each drawn cube actually is on screen, and what the screen-space threshold takes, swept over five cameras and seven thresholds |
| `gentest` | one cube end to end: greedy quads tile the visible face set exactly, slot purity, dispatch-order independence |
| `alloctest` | the payload allocator: permutation independence, camera-step behaviour, the admission threshold under a starved pool, that a starved world does not depend on the route to it, and that it still tiles space exactly once |
| `tabletest` | the GPU hash table of `shaders/table.wgsl` on its own: correctness, run-to-run and permutation independence, and cell stability across a camera step. Not wired into the renderer — see below |
| `audit` | independent CPU re-derivation of the visible-face set for the whole settled view, compared against the GPU quads face by face |
| `burytest` | the buried test, held to the picture: the same world rendered with it off and on, compared pixel for pixel, at five cameras and every frame of a flight. Also that the CPU mirror elides the same slots, and that solidity survives being checked against the quads |
| `mattest` | surface-material distribution per LOD, and the same ground compared across two LODs |
| `mobcheck` | mob-package schema, asset confinement, duplicate/stable IDs, and canonical catalog output |
| `shot` | one frame rendered offscreen to a PNG |
| `probe` | adapter limits and features |

`audit` is the strong one: it re-implements visibility on the CPU from the same occupancy words
and checks that the GPU's quads tile that set — every visible face covered exactly once, no
overlaps, no quads outside the set. Over the settled view that is **0 holes, 0 overlaps, 0
invalid across 120,122,858 visible faces in 20,800 cubes**, at every one of the nine levels,
with no cube at the 4096-quad cap. Those 20,800 cubes are also every payload cell in use, so
the same run says the allocator handed out one cell per non-empty cube and no cell twice.

`flytest` is the moving counterpart, and the one that catches what a settled world cannot. It
flies four straight legs and turns three times on the spot, re-derives the drawn set from the
records on the CPU, and asks the only question the renderer really asks: is every patch of ground
in front of the camera accounted for exactly once? Over 1800 flying frames and 1080 turning ones
that is **0 holes and 0 overlaps**, and the mirror agreed with the cull pass's own draw count in
every one of those 2880 frames — which is what makes the zero a statement about the shader rather
than about the mirror. Reverting the shaders under the same metric puts holes in 600 of 600
walking frames.

The turns exist because the four flights do not test the rule the flights were extended to
cover. Window origins are a function of position alone, so translation is the only thing the
*clipmap* reacts to — but screen-space handover reacts to orientation too, and perspective
stretches a box at the corner of the frame to roughly 2.8x the area it covers at the centre. A
cube can therefore change level purely by being turned towards, and nothing before this measured
it. Each turn stands still in a settled world and sweeps a full 360 degrees over 360 frames, so
generation cannot explain anything it sees; the zero-threshold run is the control, and it comes
out at exactly **0 changes**, which is what makes the other two readable.

The answer is that the rule pops, and that the popping is the benign kind. At the shipped 128px
threshold a turn moves **24.1 cubes per frame** out of 39,730 selected, covering **2.4% of the
screen on an average frame and 7.4% on the worst** (a union of bounding boxes, so an over-estimate
both ways). The number that decides the design question is the last one: of the 4,347 cubes that
changed level anywhere in the revolution, **not one changed more than twice** — out on the way
round, back on the way back. There is no boundary oscillation, so there is nothing here that needs
hysteresis, and the path-independence property is not under threat.

What it costs is distance, and that cost is what the constants were changed to buy back — twice,
because the first attempt bought nothing. The nearest change now comes at **320 blocks**, out
towards the LOD-0 shell at 384 where the geometry alone would have put it. Before `SUBDIV_PX` came
down the same leg read **91 blocks**, and it read 91 whether `RING` was 8 or 16; lowering the
threshold to 192 moved it to 231, and then raising `SUBDIV_SPANS` from 4 to 6 — which pushed the
LOD-0 shell from 256 blocks to 384 — left it at **231 again**. Both times the threshold was the
binding constraint at every level and widening the shells behind it changed nothing anyone could
see. The second time it was worse than nothing: at 192px behind the bigger shells the same turn
flipped **196.7 cubes a frame** and **29.4% of the screen**, because the shells had bought a world
2.75x the size for a view-dependent rule to churn. The turn at 512px still shows what that looks
like — nearest change **91 blocks**, 21.2% of the screen on an average frame, and **497 cubes
changing level more than twice**. Being turned towards can still pull handover closer than position
alone would, but at the shipped setting it no longer decides it.

The translating legs read the same result from the other side. The cubes the threshold holds
coarse over a walking leg fall from **684 a frame to 32**, from 630 to 26 sprinting and 665 to 78
climbing: on a camera that only moves, the shells now decide essentially everything.

`alloctest` is the payload pool's own harness, and the interesting half of it is the part that
runs the pool *out*. Determinism is easy to demonstrate on a system with room to spare; what has
to be shown is that scarcity does not introduce a tie the code breaks by accident. So it settles
the same world twice under generate budgets of 7 and 256 — a schedule differing by a factor of
36 — and gets the same digest the full-speed renderer gets (`2f08e9894aaec257` when this was
written; `850e436c7e75af0d` on master at `7b68922`, `ef6242494604a9f0` once water is meshed as its
own set, and `a38936ca3ce0e090` at `fd0f9fd` once landforms merged — the value is a fact about the
world, and what the check asserts is that the three budgets agree on it, not what it equals; the
list is here to show how often it moves, so re-measure the base rather than trusting the last
entry), then starves the
pool to the root box's worth of cells and settles it three times: cold, cold again, and once
more after walking four cubes out and back. All three give `72826b23e3f1b78b`. Both the full pool
and the starved one tile the sample region **262144 of 262144 points, exactly once each**.

That third run is the one worth having. Until the admission threshold landed, cells went out in
queue order until the pool ran dry, so which cubes held the last ones depended on the order they
were served in and the route to a camera position leaked into the world — inside the contract,
which names the frame sequence, but only just. The surviving cubes came out
`[0,0,0,0,0,0,0,3072,3712]` by level: the coarse levels kept their ground because generation runs
coarsest-first, the fine ones went unhoused, and the ground under the camera was drawn at LOD 8.
Cut by distance instead they come out `[160,204,196,228,224,224,224,224,4064]` — the same row,
level for level, before and after residency became a ball, which is worth knowing: the threshold
is deciding the same thing about the same geometry either way. Every level
keeps a ball around the camera and gives up its far edge. Both tile space exactly once and
neither has a hole; only one of them puts the detail where you are looking.

The cut is checked from both sides, which is what says the pool holds what the threshold names
rather than whatever got there first: nothing past bin 504 holds a cell (the furthest housed is
bin 503) and nothing inside bin 504 was left ungenerated. 44 of the 4096 cells go unused — the
boundary bin dropped whole rather than split, the alternative being a tie-break.

There is a floor below which that stops being a statement about the allocator. Falling back to an
ancestor requires an ancestor, and the coarsest level has none, so a pool too small to house
*that* level leaves ground nothing can cover. `ROOT_SIDE³` is exactly the floor, and the starved
run uses it — 4096 cells against the 44793 the settled world asks for, so everything above the
coarsest level starves hard, which is the point. (This used to be spelled `SLOTS_PER_LOD`, which
was the same number back when a level *was* the ring; it is eight times too big for that job now.)

`tabletest` is the odd one out: it tests a component the renderer does not use. It was written
when Stage 3 was planned as replacing the ring with a GPU hash table, and measuring it on its own
is what showed the table was not the thing the payload split needed — and then, at Stage 4, what
showed the ring beats it even once residency stops being a ring. That second measurement is the
churn row: **2631 surviving cubes relocated by a single 64-block camera step**, each of them a
regeneration, against about 4 MB of wasted address space for the alternative. It stays green as a
standalone piece against the reach where that trade flips.

Stage 4b is also the one time it caught something the renderer would not have. Its table was
sized at 65536 cells, chosen so a 30912-cube world sat at load 0.47; the ball at
`SUBDIV_SPANS = 6` asks for 85088, which is a load of 1.30 and not a load factor at all. Two
separate capacities had been spelled with the same literal — the table's cells and the per-key
buffers — and only the second one overran loudly. They are `CELLS` and `MAX_KEYS` now.

## Near-field lighting

Lighting is an engine pass after generation and meshing and before culling/draw.
Landform, structure, and edit code only produce block ids. `generate.wgsl`
derives persistent LOD-0 opacity and four-bit emission from the central block
registry after the edit overlay, then marks the containing cube and its 26
neighbours dirty. This is the boundary that lets new terrain regions remain
lighting-agnostic.

Dirty light cubes are compacted in slot order by the same count/scan/emit
machinery as the other GPU lists, capped by `LIGHT_BUDGET`, and solved from a
fixed 15-block halo. The solver carries independent 0..15 sky and block
channels as bit planes. Packed column gathers avoid repeated per-voxel metadata
lookups; four source bit planes replace fifteen emission thresholds, and an
emitter-free halo skips the block-light channel. Scalar writes cover only the
output cube, not its halo. One workgroup owns one result cube and visits levels in
descending order with fixed barriers, so no append order or floating-point
reduction can affect the answer. The completed byte volume is published under
a coordinate key only after the whole solve; a missing or stale key selects the
old baked LOD fallback.

The output cache covers three LOD-0 cubes (96 blocks) around the camera in every direction;
coarser/distant geometry never pays for it. A settled frame still scans the
dirty predicate but launches a zero-sized indirect solve. Day/night and lunar
phase are render-only fixed-tick inputs in `Globals`; content and allocation
passes do not read them. See `DESIGN-lighting.md` for the darkness and edit
contracts.

## Seeded modular ruins

`ruins.rs` adds an opt-in sparse landmark path selected by `MCGPU_RUINS`.
Offline authoring executes original room source in the pinned upstream
MineBench runtime. A compact checked JSON kit contains integer block cells,
cardinal ports, entry/room/terminal roles, weights and guardian anchors. The
native engine loads data and never executes that JavaScript.

Seeded bounded frontier expansion rotates compatible modules onto distinct
tiles, joins neighboring compatible ports into loops, caps unused doors and
ends in a terminal sanctuary. The current cap is 24 rooms within four tiles
of the entry. The kit's bytes, world seed and placement X/Z determine the
layout. An independent occupancy flood checks body clearance from the entry
to every room and guardian; graph connectivity alone is insufficient.

The assembled blocks become an ordinary `structures::Blueprint`. Existing
terrain fitting, smooth boundary treatment, exact capacity accounting and
canonical edit buffers remain authoritative. This changes sparse placement
only; terrain generation, its CPU/WGSL mirror, allocation and GPU interfaces
are unchanged. Tests require byte-identical regenerated layouts and placed
edits, including a steep site and the configured expansion bound.

Room anchors instantiate the accepted Cairn package in the existing fixed-tick
simulation. Each guardian starts asleep and faces its connected arrival route.
Proximity plus line of sight drives awaken, combat and return behavior;
restart reuses the encounter reset path. `ruinscheck` exercises actual room
occupancy and Simulation transitions. The completion runner captures the real
renderer, binds source/binary/evidence hashes and requires explicit art review.
See `docs/cairn-ruins.md` for extension and acceptance commands.


### Organic MineBench landmarks

New natural structures use the real pinned MineBench authoring runtime and
independent sparse-contact/access checks in `tools/structure_author.py`.
The resulting `baked.json` stores lossless vertical material runs for up to 64
variants. `structures::BakedGenerator` validates bounded data once, shares the
catalog through an Arc, chooses a variant from world seed/location, and emits
an ordinary Blueprint. Neither JavaScript nor Rhai runs when a den is placed.
Legacy Rhai assets and ambient tree design/bakes retain their existing routes.

`mob_den::habitat` reads the shared natural surface and climate, admitting wooded
foothills or rocky uplands with a rising rear slope, moderate landing relief,
a dry footprint and an open approach. It tries four cardinal directions.
`Blueprint::rotated` transforms cells and contacts together; the initial dragon
heading and review cameras use that same orientation. A finite search may yield
no site, and no unsuitable fallback is occupied. The existing background batch,
canonical edit overlay, player-edit precedence and fixed edit budgets remain.

The common fitter samples all transition columns when choosing an adaptive
blend, including interior ridges/hollows hidden by an otherwise flat boundary.
Cached natural samples feed its existing integer cubic transition. Optional
vegetation clearance stays inside the minimum blend radius, so the final seam
remains exactly natural. Reviews include curved terrain fixtures, native replay,
actual terrain/encounter captures and a written decision before exact-bake
promotion. See `docs/minebench-organic-structures.md`.

## Gustling and shared particles

Gustling is a native `core:gustling` catalog/controller integration of the existing
v3 encounter. Both single-player and multiplayer call `gustling::step`; each host
20 Hz tick runs three 60 Hz action substeps with bounded voxel sweeps. Unknown
terrain rolls back creature state and every participant outcome. Entity snapshots
persist the action, health and bounded projectiles. `/spawn gustling` is host-only.

`particles` owns a fixed local cosmetic pool, per-owner admission and emitter
limits. `combat_fx` maps authoritative event positions and native Gustling joint
anchors into presets, and uses the existing FireRenderer translucent draw path
for cuboids and rectangular sprites. There is no terrain-buffer writer or added
GPU pass. Exhaustion drops cosmetic particles without delaying gameplay. Pool
state is not saved or authoritative. Native models can opt into shortest-angle
key interpolation and crossfade; the legacy animation behavior stays the default.

## Gustling-reference sky roster

`mob_roster` binds 25 immutable catalog identities to native models and tuning;
`gustling` retains the shared authoritative encounter controller. Authored species
source and generated model/Rust outputs are synchronized by
`tools/mob_roster_build.py --check`. See `docs/sky-roster.md` for ownership, limits,
spawning, transition support and executable acceptance commands.
