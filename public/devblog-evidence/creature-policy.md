# Working on mcgpu-v3

Maintainer start: [development guide](docs/development/README.md). Developer binaries are now `cargo dev <legacy-name>` or `cargo dev <group> <command>`; old `cargo run --bin <probe>` syntax is historical.

## Multiplayer acceptance

The current shared-world implementation and limitations are in
`docs/multiplayer.md`. Gameplay features must declare authority, replication,
late-join/reconnect, persistence and capacity behavior in
`docs/multiplayer-contracts.json`, with focused executable scenarios. Run
`python tools/multiplayer_check.py --base <feature-base-commit>` for gameplay,
world-edit, persistence, protocol or menu changes. Never mark a feature shared
based on single-player tests alone. Survival and creatures use the host-owned
fixed-tick simulation. Extend their multiplayer scenarios with every new mechanic;
never hide or freeze a gameplay system to make networking appear to pass.
Contract scenario names must appear among this run's successfully executed tests;
helper functions, ignored cases and stale logs cannot satisfy the acceptance gate.
Test multiplayer rules with controlled positive and empty world inputs; do not
make protocol or multi-player discovery coverage depend on a particular seed
containing a natural feature. Exercise the production selector, not a duplicate
test algorithm. Keep real-terrain checks across seeds separate, and keep fixed
seed/location regressions only when that terrain behavior is the subject.
New shared edits must use Authority commands; guests must never open a world
store or write terrain speculatively. Keep CPU/WGSL terrain and graphics gates
appropriate to the actual change; the multiplayer gate does not replace them.

## Current creature entry point

The current default is `creature-texture-library`: reference -> box-only anatomy
and joint guides -> shared GPT Image material sheet -> PixelOE once -> exact-size
face crops at consistent physical pixel density -> final rig and expressive motion.
Use `assets/creature-library/` for durable versioned materials, crop manifests and
selected creature assets. Skip MineBench and voxel sampling. No tapered/deformed
boxes or bevels. Author self-review is default; independent review only when requested,
with fresh reviewers, a three-candidate cap and one reviewer for the whole motion set.
Preserve static presentation and prioritize lively encounter pacing over exact IK.
`creature-direct-shapes`, `creature-simple-style`, `creature-success-route`,
`creature-authoring` and `creature-review` are archived and are not active skills.
Retain at least 16 meaningful actions for completed mobs and native integration checks.
This supersedes older creature route/model/review instructions below.

Completed mobs still require **at least 16 meaningful, distinct animations**;
see `docs/creature-animation-baseline.md` for species-appropriate roles. Static
shape and Blender animation studies remain intermediate. Native integration
must retain the current Creature Studio preflight and independent runtime,
terrain and multiplayer checks; do not weaken or repin a failing preflight.
The frozen Cinder recipe and CPU replay runner are documented in
`docs/creature-success-route.md`. Replaying an accepted visual study does not
install a playable mob or implement native flight and locomotion controllers.

This is the mandatory operating contract. Read `ARCHITECTURE.md` when changing
engine structure. Read `AGENTS-REFERENCE.md` only when a task touches a recorded
trap, tuned constant, residency, allocation, or performance claim. Terrain
feature workers also read `src/terrain/AGENTS.md`; structure-recipe workers read
`src/structures/AGENTS.md` and `docs/structure-generators.md`. Code-drawn mob
skin workers follow the process in "Mob-skin authoring" below.

New AI structure geometry starts with `docs/structure-authoring.md` and
the complete upstream app at `../minebench-upstream`. First prove the complete visual study using the
actual assigned model and matching reference views; only then apply game
placement constraints. Rhai generation, static one-bone mob studies and
contract-first room/den generation are retired as new-structure defaults.
Existing runtime assets and mob articulation remain supported.

Start mob and existing game-structure maintenance through `tools/content_loop.py` and read
`docs/content-loop.md`. Prepare a worktree-local packet with the full brief,
reference image and applicable independent contract; inspect a focused draft
before complete review. The compact route preserves the existing checks,
graphics lock and deliberate art/promotion decision. After an accepted static
study, natural dens/nests use the game integration route in
`docs/minebench-organic-structures.md`; inspect clay massing before full review.
Existing Rhai assets remain supported. A similar primitive API is not the
pinned MineBench runtime. Do not substitute one route's API for another.

Concept art also comes first for creative game structures and substantial
redesigns. Inspect and show it before authoring, then record its terrain contact,
silhouette, scale and player/creature access. Concepts remain reference only.
For benchmark replication, preserve the exact upstream inputs without adding
an extra concept or game placement constraint.

For original 2D inventory item art, read `docs/item-sprite-authoring.md`. It
records the user-approved 16x16 study, exact palette, pixel authoring method,
and Luna trial in the real UI. Delegated 2D sprite-art workers default to
GPT-5.6 Luna (`gpt-5.6-luna`) with `max` reasoning; follow the sprite-art
workflow below. This is separate from 3D mob-skin UV work.

## Compact images for chat review

- Before loading screenshots, renders or review sheets into chat, create a
  separate compressed preview under `out/chat-previews/` or a temporary folder.
  Keep original captures, production textures and validation artifacts intact.
- Default to at most 1280 pixels on the longest side, preserving aspect ratio
  without upscaling. Aim for 500 KB or less per preview; check dimensions and
  file size before loading it. These are workflow targets, not API limits.
- Use JPEG or WebP at roughly 80-85 quality for ordinary scene previews. Use
  optimized lossless PNG/WebP when transparency, exact colors, text or pixel
  edges matter. Preserve nearest-neighbour scaling for pixel art and UV sheets.
  Local image utilities may resize, crop and compress these review copies.
- Load only one or two relevant previews at a time. Avoid repeatedly attaching
  unchanged images, every animation frame, every seed or full-resolution contact
  sheets. Record findings and paths in text; keep the full gallery on disk.
- For fine-detail checks, load a focused lossless crop at native resolution.
  Split dense review sheets into readable crops rather than shrinking away
  defects. Larger views are appropriate when required to judge a specific issue.
- All required views, seeds and motion checks still need review. Compact copies
  reduce chat payload; they do not replace checks or lower acceptance standards.
- If image review is followed by a request error, preserve a short text handoff
  with the current state and artifact paths. When continuing, load only the
  compact evidence needed next instead of replaying the entire image history.

## Non-negotiable invariants

1. The settled world is a pure function of `(seed, camera)`. It must not depend
   on route, frame pacing, wall clock, dispatch order, or which worker added it.
2. A cube's mesh is a pure function of `(coord, lod, seed, edits)`. Terrain and
   meshing never read a neighbouring cube.
3. GPU output order is deterministic. Build lists with mark, exclusive prefix
   scan, and scatter. Never use an atomic return value as an append position.
4. Stored floating-point work has a fixed evaluation order. Do not introduce a
   parallel float reduction or algebraically rearrange mirrored expressions.
5. Resource exhaustion becomes coarser terrain, never a hole.
6. CPU terrain and WGSL terrain are a paired mirror. Change both halves in the
   same feature and keep expression order aligned.
7. Never make a failing check pass by deleting it, weakening it, widening a
   tolerance, or changing its expected answer without an independently measured
   reason.

If a proposed change needs a cross-cube read, a new GPU pass, an atomic-ordered
append, a history-dependent policy, or a tuned `config.rs` constant, stop and
hand it back for an engine-level design pass.

## Scope and delegation gates

- The user's latest explicit scope wins. Record it in one sentence before
  splitting work. Do not revive older goals, add related species or variants,
  or turn a proof of concept into a general system unless the user asks.
- Default to one integrating agent. Use subagents only when the user explicitly
  requests delegation or names multiple independent deliverables. One requested
  structure is one deliverable and permits at most one recipe worker.
- When delegating original 2D sprite or small UI pixel-art authoring, use
  GPT-5.6 Luna (`gpt-5.6-luna`) with `max` reasoning by default. Honor an explicit
  user model choice. This selects the worker model within the delegation gates
  above; it does not change the integrating agent's model.
- Before starting a structure worker, fill `docs/structure-worker-brief.md`.
  Before starting a landform worker, fill `docs/terrain-worker-brief.md`. The
  brief must name the owned files, visible result, limits, non-goals, and one
  acceptance command. A landform brief also records its locate criterion,
  shared-field reuse, material-tag plan, and integration performance budget. If
  those fields cannot be filled from the request, keep working locally until
  the scope is concrete.
- A worker never spawns another worker. The integrator does not create speculative
  workers for possible follow-up content.
- If the user says to stop agents or work locally, interrupt every worker at once
  and do not relaunch one during that request. Preserve any completed output,
  then continue locally.
- Run the smallest check that can reject the current change. Broaden testing
  once after the implementation is stable; do not repeat identical checks
  without a code change or new failure.

### Landform drafts before validation

Activate this mode when the user explicitly asks for a landform draft batch,
code first / validation later, or unvalidated Luna output. Read
`docs/landforms/DRAFTING.md` and follow its coordinator or worker instructions.
These rules override the mandatory acceptance brief, READY-job preparation,
performance baseline, new-test authoring, test execution, visual review and
pre-commit validation requirements for **isolated draft branches only**,
including the Luna full-gate policy below and the terrain worker contract.
They do not change engine invariants, ownership, or promotion requirements.

- The coordinator prepares the user-requested jobs, reserves unique identities
  in its batch branch, commits a common worker baseline, and queues Luna Max
  workers. Use at most two workers by default, bounded by available agent slots;
  remaining jobs wait. Each concurrent writer has its own branch/worktree.
- The worker writes one paired Rust/WGSL draft within its assignment, preserves
  existing tests and protected bindings, then commits only its owned files.
  Do not run builds, formatters, tests, GPU tools, renders or performance probes
  unless the user explicitly includes them. Do not start repair/polish loops,
  spawn workers, edit shared engine code or request Astra review.
- The coordinator collects commits and short metadata without reviewing every
  diff. Keep going through the requested queue; a missing shared capability is
  recorded on that job rather than stopping unrelated jobs. Preserve drafts
  separately; do not combine them into runtime code or merge them into main.
- Return a batch manifest with each job's baseline, identity, owned paths,
  branch/worktree, commit, actual model/effort, dependency notes and deferred
  checks. Mark produced drafts `UNVALIDATED` and unfinished jobs `INCOMPLETE`.
  A completed draft is not an accepted landform. No Astra validation is required
  to finish the drafting batch; promotion is a separate, later task.

### 2D sprite-art workflow

The user selected Luna as the default sprite-art subagent after the inventory
trial on 2026-09-08. This covers original block/item inventory icons and similar
small UI pixel-art assets. Read `docs/item-sprite-authoring.md` before assigning
the work; it contains the palette, cube-face template, reference art, and trial
results. The separate 3D mob-skin contract below still governs UV textures.

- Give the worker one bounded asset list, its own worktree, and one owned
  offline generator source. State the dimensions, exact output names, material
  palette, lighting direction, and approved style anchors in its brief.
- Supply geometry guidance up front. For cube icons, use the documented full
  diamond top and distinct top/left/right face template. Luna authors the
  material pixels inside that shape. For other items, describe the silhouette
  explicitly; a palette alone was insufficient in the trial.
- Reuse the documented direct-code method: explicit pixels, purposeful color
  clusters, transparent backgrounds, crisp integer scaling, and visible-bounds
  centering. The authored generator is the source of truth for exported PNGs.
- Request a first renderable pass promptly. The integrating agent may build
  the worker's generator in its own warm build directory, then return the
  actual output for review. Do not share Cargo target directories.
- Inspect the enlarged board and real slot sizes beside approved anchors.
  Give concrete shape/material feedback when needed. Passing grid, palette,
  and alpha checks does not establish visual quality; the trial needed a
  guided revision, and its wood textures still had room for improvement.
- The integrating agent owns UI/runtime changes and final validation. For
  inventory integration, render the actual `inventoryshot` pipeline at large
  and small window sizes, check centering and interactions, and verify that
  integrated PNGs exactly match the generator output. Keep UI layout changes
  within the user's requested scope.

### Structure routing gate

Read `docs/minebench-authoring-quality.md` before new structure geometry.
All new static geometry uses the full upstream MineBench Import/Generate workflow; do not substitute a one-bone mob
rig. Read `docs/structure-authoring.md` before choosing a game integration route.
Game landmarks apply the organic route below after study review. Mechanical checks
do not establish visual quality or hosted MineBench generation parity.

For Cairn-style modular architecture, use the real pinned MineBench bake,
native socket assembly and explicit review route in `docs/cairn-ruins.md`.
This user-selected route supplements the existing Rhai recipes. An explicit
model choice wins; the Cairn ruins artist is Astra. A single assigned JS source
is the artist's ownership boundary, with runtime, manifest checks and acceptance
owned by the integrator. Keep the existing terrain fitter and promotion gates.

Classify a structure request before authoring or delegation:

1. **Sparse placed structure:** first review a real pinned MineBench static
   study. Then use organic placement for dens/nests or the modular importer for
   connected architecture when game integration is requested. Existing Rhai
   assets remain supported for maintenance only; never generate new structures
   through the legacy Rhai authoring path.
2. **High-frequency worldgen:** wording such as “every tree” or “replace the
   default” means the recipe is only a design prototype. The final runtime path
   must be a bounded static/procedural bake with no Rhai execution or edit-overlay
   allocation per ambient instance.
3. **Both:** finish and visually review one recipe prototype first. Treat its
   worldgen bake as a separate integration phase with an explicit performance
   budget. Do not begin additional families while proving the first one.

For a proof of concept, implement exactly one named type unless the user provides
an explicit list. Report which route was chosen in the first progress update.

## Ownership and parallel work

- Work from the `mcgpu-v3` Git repository, not its parent directory.
- Give every concurrent task its own Git worktree. Build output is intentionally
  local to each worktree; do not restore a shared `CARGO_TARGET_DIR` in repo
  configuration.
- Existing uncommitted work belongs to its current worker. Do not edit, move,
  stash, revert, stage, or commit it.
- A landform worker owns one preassigned directory under both
  `src/terrain/features/` and `shaders/terrain/features/`. It does not edit the
  generated registry, shared terrain composer, `build.rs`, or another feature.
- The integrator reserves each landform's order, slug, and seed salt in
  `src/terrain/features/RESERVATIONS.tsv` before creating worker branches.
- Before parallel landform work begins, the integrator records one uncontended
  `tree_lod_perf` fast-flight baseline and the maximum accepted change to its
  generation and total rows. After integration, run the same probe once with
  every worker idle. A feature batch that misses its stated budget is not ready
  merely because the correctness gate is green.
- A structure-recipe worker owns only its assigned `.rhai` file under
  `assets/structures/`; runtime, terrain fitting, and capacity remain integrator
  work. It follows the filled brief and returns after its focused acceptance
  command; it does not start engine integration.
- A mob-skin worker owns only its assigned offline generator source and writes
  generated PNGs to an ignored or temporary output directory. The declarative
  UV layout and independent output checker remain integrator-owned so the code
  that draws a skin cannot redefine what counts as valid. Entity runtime, model
  geometry, texture upload, and asset-layer composition remain integrator work.
- One integrating agent owns cross-feature composition, complete GPU validation,
  performance measurements, and the final commit.
- Do not run GPU harnesses concurrently. They share the physical adapter and
  concurrent runs invalidate timings. `check.ps1`, `check.sh`, and
  `tools/landform_shots.py` acquire the cross-worktree lock; other standalone
  renderer or harness runs must be scheduled by the integrating agent and never
  overlap an integration gate.

## Single sources of truth

- `src/config.rs` generates layout constants and WGSL ABI declarations.
- `src/block.rs` generates block IDs and flags. Block rows are append-only.
- `src/tree_templates.rs` generates tree stencils.
- `build.rs` discovers paired terrain feature phases, emits both registries and
  stable material-mask bits, and rejects feature material code that resamples
  expensive terrain fields in the per-voxel path.
- `src/structures.rs` owns structure placement and terrain adaptation;
  model-authored recipes never duplicate that logic.

Do not restate generated constants in WGSL. Do not hand-edit anything under a
Cargo `OUT_DIR`.

## Landform batch preparation

Start at `docs/landforms/README.md` for the glossary inventory, implementation
routes, known engine prerequisites, and staged Luna workflow. The catalog is a
planning inventory, not a list of ready worker jobs or completed landforms.

Run `python -B tools/landform_preflight.py` for the inexpensive offline authoring
checks. Before dispatching a terrain worker, fill and validate a job with
`tools/landform_job.py`, then generate its packet. After it returns, run the
job's scope check against the assigned baseline, including committed and dirty
changes. These checks supplement the focused terrain, visual, GPU, and
performance acceptance below; passing preflight alone does not approve content.

## Landform screenshots

For material-variety work on existing terrain, follow
`docs/landform-material-workflow.md`. Future delegated passes use GPT-5.6 Luna
at max reasoning for small, explicitly owned material jobs. The coordinator
prepares palettes, blocks, shared helpers, camera/seed fixtures and one baseline,
then owns integration, visual review and serialized GPU checks. Workers reuse
that preparation and run focused CPU checks. A user request to work locally
takes precedence; do not launch Luna workers for that pass.

Run `python -B tools/landform_shots.py` to capture one actual in-engine image of
each of the 20 merged landform additions. The script builds the worktree-local
release `shot` renderer, replays the selected views in
`docs/landforms/drafts/luna-dry-surface-20/screenshot-plan.json`, and runs captures
sequentially using the same temporary
GPU lock as `check.ps1` / `check.sh`. It clears inherited `MCGPU_*` overrides and
sets each scene's world seed explicitly. Do not run another GPU tool outside
that lock while the batch is active.

Outputs live in ignored `out/landform-screenshots/`: 20 numbered 1600 x 900 PNGs,
an `index.html` gallery, `capture-plan.json`, per-image logs, a capture report,
and `landform-screenshots.zip` after every image succeeds. Paths supplied to the
script are relative to the repository root; output must remain beneath `out/`.

- Use `--plan-only` to prepare views without a build or GPU work.
- Use `--resume` to keep successful images with matching camera and renderer
  signatures; a changed plan, changed renderer, or unreadable image is recaptured.
- To adjust framing, edit the saved plan's camera, target, yaw and pitch, then
  run `python -B tools/landform_shots.py --plan out/landform-screenshots/capture-plan.json
  --feature graben --resume` (on one line). `--feature` is repeatable. Target is
  descriptive; the renderer uses camera, yaw and pitch, in radians.
- `--observations out/landform-merge` can choose dry examples from existing
  `landformprobe` reports. `--manifest <json>` generates new views from another
  locate manifest. `--skip-build` is only for a known-current executable.

Inspect every screenshot and reframe obstructed or submerged views. These are
combined-world captures: overlapping terrain can obscure a named landform.
CPU locate strength and successful image output are not visual acceptance.
Do not edit terrain or promote draft catalog status just to obtain screenshots.
Run `python -B -m unittest discover -s tools/tests -p test_landform_shots.py`
after changing this script.

## Mob-package authoring

**Concept art comes first for every new mob and substantial visual redesign,
including prototypes.** Before authoring model geometry, skins, or animation,
generate or obtain a concept image, inspect it, and show it to the user. Record
the reference path and the intended silhouette, proportions, palette, joints,
scale, and gameplay access in the species brief. Follow the image-generation
skill for generated concepts. A text-only brief or an early code model is not
a substitute. Skip this step only when the user explicitly requests code-only
work or supplies an existing concept to follow. Concept pixels remain reference
only; production models and textures are code-authored. The prototype texture
source exception below does not waive this ordering requirement.

For a request targeting Mowzie-style authored cuboids, rigid meshes and full
position/rotation/scale animation, use `tools/creature_author.py` and read
`tools/creature_studio/README.md`. This is the tested offline Creature Studio
route. It preserves the independent engine checker, real renderer, source
snapshots, three-seed review and deliberate production gates. New voxel
sculpture still uses the real pinned MineBench pipeline below. Creature Studio
TRS snapshots remain inspection assets. For playable completion, use
`tools/creature_playtest.py` and read `docs/creature-playtest.md`: native adaptive
TRS export, independent gameplay scenarios, real engine captures and an explicit
art review are all required. Do not infer completion from snapshot validity.
Use standard/guided context labels separately from model reasoning settings;
the user-requested trial used Luna **max** and Astra **low**.

GPT-5.6 Luna at max reasoning is the default new-creature author. Read
`docs/creature-authoring.md` for the canonical concept-to-code and review route.
Runtime integration remains the integrator's job. The older Astra/Cinder study
is historical evidence, not a conflicting model or harness default.

Read `docs/mob-authoring.md` and fill `docs/mob-worker-brief.md` before adding
production mob content. A mob-package worker owns exactly one directory under
`assets/mobs/<namespace>/` and may add
its definition plus reference concept art there. It does not edit `src/mobs.rs`,
`tools/dev-cli/src/commands/mob/mobcheck.rs`, another package, a shared UV layout, or the compiled
catalog under `out/`.

Concept art communicates silhouette, palette roles, and focal features. It is
not production texture source data. Production textures remain code-drawn under
the Mob-skin authoring contract below. A concept may use `concept_only`; a
prototype or production package must name a static, layered, or code-generated
texture source.

Every package pass ends with `cargo run --bin mobcheck --locked -- --check`.
Reserve a unique namespace or explicit ID range before an intentionally large
creature batch so independently authored packages cannot collide.

## Articulated mob recipes

### AI and animation passes

For Creature Studio AI or animation work use `docs/creature-authoring.md` and
`docs/creature-playtest.md`; preserve geometry/skin for motion-only revisions.
For existing Recipe/controller package maintenance use `docs/mob-behavior-review.md` and the
shared review harness automatically. Do not finish with a few extra poses or a
single successful attack. Before authoring, map each requested capability to its
trigger, actual gameplay effect, animation, exit/recovery and acceptance scenario.
Include calm activity, locomotion variants, anticipation, interruption/escape,
recovery and return/rest where the creature supports them. Mark unsupported
mechanics explicitly; an animation is not an implemented ability.

The integrating agent runs:

```text
python tools/mob_review.py <package> --preserve-appearance
```

Use `--preserve-appearance` for AI/animation-only work; omit it when the user also
requests geometry or skin changes, or for a new package. This command builds the
current tools, runs focused regressions, checks actual behavior for three seeds,
and renders clay, anatomy, runtime motion and every declared animation. It writes
`review.html`, behavior traces, a labeled action sheet and video automatically.
Use `--cpu-only` for an explicitly deferred visual pass. CPU-only output cannot
be promoted. Content workers retain the CPU-only `mob_batch.py` route after the
integrator builds the shared tools; this does not expand delegation authority.

New runtime profiles, states or clips must extend the independent behavior
scenarios, action coverage and relevant negative controls in the same change.
Run the candidate rig through the actual controller, including its emitters;
static clip validity cannot prove targeting, damage, cover, escape or landing.
Do not bypass a missing scenario by weakening a validator or dropping a clip.

Inspect the generated action sheet, motion, transitions and anatomical views,
correct concrete defects, then use `mob_promote.py` to install the exact reviewed
bake. This is the integrating agent's visual review, not an additional user
permission gate. Fresh behavior/action evidence is required for promotion; old
visual-only reports remain historical evidence. Runtime/render integration also
needs an actual-world check appropriate to the change; the profile audit includes
terrain launch, while scene/HUD changes still require the existing `shot` capture.

For existing Recipe-package maintenance, use the package-local `recipe.py` path
in `docs/mob-authoring.md`. A bounded requested-model worker may own the model and code-drawn
skin together in that recipe, through the integrator-owned `tools/mob_recipe.py`
API. Runtime/schema/validator changes remain integrator work. This supersedes
the older offline skin-only ownership restriction for recipe-backed models.
Read `docs/tideglass-runtime-brief.md` for the concrete first assignment.

The authored source is code; do not import concept pixels into production.
Use automatic UV packing and named semantic painting layers. Verify source
coordinates through the joint hierarchy, and review the actual GPU-rendered
front, side, back and moving poses. Atlas coverage cannot approve silhouette or
face visibility. Never call a render good merely because it passed UV checks.

Use the paired motif helper for symmetric facial features, with a clear lane
for projecting nose geometry. Cloth foundations must overlap moving joints
through the full pose range while staying within the intended silhouette.
Use `--inspect` for close-up/extreme-pose views and `--motion` for the direct
video harness. `assets/mob_skins/pose_reviews.json`, its registered review
landmarks, and the output checker remain integrator-owned. A recipe worker
must never edit those to pass a failing eye or clothing-coverage gate.

Build shared checkers once per integration batch; content workers run
`python tools/mob_batch.py <owned-package>` without `--render`. The integrator
runs the rendered pass with the GPU lock and handles promotion. Candidate
output stays under `out/`; only the accepted selected seed is regenerated into
`generated/`. Adding a new species using existing shape/behavior primitives
must not require a new Rust generator or renderer branch.

## Mob-skin authoring

Use code-drawn UV skins for Minecraft-style 3D mobs. A Hollowflux-style direct
Canvas sprite is appropriate for a 2D game, but a mob that turns, animates, and
receives 3D lighting needs a texture mapped onto model geometry. Use the hybrid
that has worked here: Pebble's box-UV painter and output contract, with
Hollowflux's semantic layers, limited palette, readable focal features, and
small drawing vocabulary.

`tools/dev-cli/src/commands/mob/villagerskin.rs` is the reference prototype. It is an offline asset
tool, not an entity renderer. `src/mob_render.rs` consumes its validated output;
do not wire skin generation itself into terrain, cube meshing, or the per-frame
GPU path.
`src/mob_skin.rs` owns the shared bounds-safe canvas, coordinate-hashed fills,
box-UV painter, preview canvas/font, argument parsing, and PNG writer. Mob
generators reuse it and keep their palette and semantic painting local.

Clothing, equipment, and silhouette features use declarative
`appearance.layers`, not per-mob renderer branches. Attach each box to a named
model anchor, keep its UVs in an independently declared layout region, and paint
all six faces in the generator. The package definition, UV layout, generator,
and checked-in runtime bake must agree before review.

### Worker brief

For fixed-UV skin maintenance, delegate only when requested and use the user's
selected model (Luna max is the new-mob default). Give the
worker its own worktree and exactly one generator source file. The assignment
must include:

- the target mob and exact texture dimensions;
- every model box's UV origin and dimensions, including overlay boxes;
- whether the deliverable is a base, biome/type, profession/equipment, level,
  emissive, or fully composed texture;
- the intended character, palette roles, focal features, and reference images;
- the seed policy, output directory contract, and required preview views.

For vanilla-style layered mobs such as villagers, keep base skin, biome/type,
profession, and level textures separate when the target renderer composes those
layers. A fully composed texture is acceptable for a standalone prototype, but
must not be described as a drop-in layered asset.

### Painter contract

- The generator source is the authored asset. PNGs are deterministic build or
  inspection artifacts; never use an imported image as hidden source data.
- Build a bounds-safe RGBA canvas around a deliberately small API such as
  pixel, rectangle, seeded fill, line, and box-UV painting.
- Paint named semantic layers: base material first, then face/body features,
  clothing or equipment, contour/seams, and sparse highlights. Keep palette
  roles separate from geometry so art direction can change coherently.
- Shade top, bottom, front, back, and side faces intentionally. A good front
  cannot excuse blank, mirrored-looking, or accidental side and back faces.
- Derive all variation from `(asset seed, UV x, UV y, named salt)`. Never use
  wall clock, ambient randomness, iteration order, or platform-dependent state.
- Keep random texture subordinate to the design. Seeds may vary hue families,
  wear, freckles, seams, or glyph paths without erasing identity or readability.
- Paint every texel sampled by the model and keep every unused texel fully
  transparent. Treat unexpected paint outside the union of model UV faces as a
  correctness failure.
- Preserve hard pixel edges. Generation and previews use nearest-neighbour
  scaling only; do not blur, antialias, or resample the authored texture.
- Write only beneath the output directory supplied on the command line.

### Review and acceptance

Generate at least three representative seeds. The preview must show the raw UV
sheet on a transparency checker and assembled front, back, and side views; use a
real model render too once an entity renderer exists. Inspect every preview at
nearest-neighbour scale for face readability, silhouette, orientation shading,
layer seams, side/back intent, and restrained detail. Record the preferred seed
for a static asset instead of silently changing the generator's default.

Describe model coverage in a JSON layout under `assets/mob_skins/` and run the
independent `mobskincheck` gate against generated PNGs. This deliberately checks
the artifact separately from the generator's own tests, so a shared bug cannot
approve itself. The gate also produces a local `review.html` comparison board.

Every generator has focused tests proving:

- byte-identical RGBA output for the same seed and different output for a
  different seed;
- exact dimensions and buffer length;
- non-transparent coverage for the complete union of sampled UV faces;
- zero alpha for every texel outside that union; and
- validated arguments and no writes outside the requested output directory.

For the reference villager generator on Windows, run:

```text
pwsh -NoProfile -File ./mobskin-pass.ps1
```

On Unix, run `sh ./mobskin-pass.sh`. Both runners format only the owned generator
and checker, run their focused build and tests, generate seeds 0, 7, and 23,
independently validate each raw PNG, and write the ignored comparison board to
`out/mobskin-review/villagerskin/review.html`. Their parameters or environment
variables provide the generator name, artifact stem, layout, output root, and
seed set for future mobs. Keep output roots beneath `out/`.

Offline skin generation requires no GPU gate. Adding or changing entity
geometry, runtime texture composition, texture upload, animation, or rendering
does require an engine-level design pass and the serialized integration gate.

## Verification

### Model-scaled validation

This policy overrides older unconditional full-gate language in
`AGENTS-REFERENCE.md`:

- GPT-5.6 Luna agents run the full serialized `check.ps1` / `check.sh` gate for
  integration work after all workers are idle.
- GPT-5.6 Sol agents and stronger models do not run the full standard gate by
  default. They run the smallest focused checks that can reject their change,
  broadening only in proportion to the actual risk. Run the full gate only when
  the user explicitly requests it.

Individual terrain workers run only focused, non-GPU checks while other workers
are active:

```text
cargo fmt --check
cargo test --release --lib <feature test filter> --locked
cargo check --all-targets --locked
```

The integrating agent also runs `tree_lod_perf` after terrain-feature changes,
using the baseline and budget recorded in `docs/terrain-worker-brief.md`.
Performance measurements are invalid while another worktree uses the adapter.

Structure-recipe workers use `cargo run --bin structurecheck -- <recipe> 64` and
the visual checks in their nested contract. When the model-scaled policy above
requires the serialized gate, run it after all workers are idle:

```text
pwsh -NoProfile -File ./check.ps1
```

On Unix, use `./check.sh`. A terrain feature test must prove that the feature is
live, deterministic, bounded, finite, and filtered appropriately at coarse LODs.
The integration gate must include CPU/GPU terrain agreement and geometry checks.

Before committing:

- `git diff --check` is clean.
- Both halves of every mirror are present.
- No unrelated working-tree changes are included.
- The determinism digest is unchanged, or the intended world change and its new
  measured digest are recorded.
- Performance claims come from an uncontended run and include the harness,
  camera/window, and measured values.

## Map

```text
src/world/                 GPU resources and frame encoding
src/terrain/               CPU terrain mirror by pipeline responsibility
src/terrain/features/      independently owned landform phases
shaders/terrain/           WGSL terrain pipeline
shaders/terrain/features/  paired WGSL landform phases
src/structures/            sandboxed recipe runtime
assets/structures/         independently owned structure recipes
src/mobs.rs                validated mob definitions, catalog, and deterministic identity
src/mob_render.rs          instanced camera-relative articulated mob renderer
src/mob_skin.rs            shared Hollowflux/Pebble code-drawn skin primitives
shaders/mob.wgsl           shared textured mob vertex/fragment path
assets/mobs/               independently authored mob packages and concept references
docs/creature-authoring.md current Luna max creature workflow and session prompts
docs/mob-authoring.md      existing Recipe package maintenance and integration
docs/mob-worker-brief.md   production package ownership and acceptance template
tools/dev-cli/src/commands/mob/mobcheck.rs        canonical mob-catalog compiler and validator
assets/mob_skins/          declarative model UV coverage for offline skin checks
mobskin-pass.ps1/.sh       one-command mob-skin generation and review gate
tools/dev-cli/src/commands/mob/villagerskin.rs    reference code-drawn villager UV skin generator
tools/dev-cli/src/commands/mob/mobskincheck.rs    independent generated-PNG UV and review gate
tools/dev-cli/src/commands/terrain/terrainagrees.rs   CPU/GPU differential terrain check
tools/dev-cli/src/commands/gpu/gentest.rs         generation and exact mesh coverage
tools/dev-cli/src/commands/terrain/mapshot.rs         wide-area terrain diagnostics
docs/terrain-worker-brief.md landform scope, locate, caching, and performance gate
```

The engine's non-goals remain: CPU-side world storage, route-dependent content,
growable GPU pools, and non-cube block geometry.
