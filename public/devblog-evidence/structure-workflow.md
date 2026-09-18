# Structure authoring: use the complete MineBench app

Use the full upstream checkout at `../minebench-upstream`, pinned to
`b256ef5e1a6060e4d69e3be3b40b1e58773831a1` from
https://github.com/Ammaar-Alam/minebench. Keep its source unchanged. The user's
September 9 correction is to reuse the complete scaffolding and avoid rebuilding
its prompt builder, model configuration, parser, executor, validator, textures,
mesher, viewer or interface in a separate harness.

The earlier `minebench_study.py` static wrapper and standalone comparison viewer
are retired along with Rhai generation and static one-bone mob experiments.
Do not revive them from old worktrees. Existing mob articulation and native game
loaders/validators remain supported for their current assets.

## Run the existing application

From the shared Minecraft directory, if the checkout is missing:

```text
git clone https://github.com/Ammaar-Alam/minebench.git minebench-upstream
git -C minebench-upstream checkout b256ef5e1a6060e4d69e3be3b40b1e58773831a1
```

From `minebench-upstream`:

```text
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec next dev --hostname 127.0.0.1 --port 3005
```

Open http://127.0.0.1:3005/sandbox?mode=import. The Import workspace works
without a database or provider key. It already supplies the grid/palette controls,
full prompt builder, JSON/tool-call import, validation, textured rendering,
orbit/pan/fullscreen controls, explorer and exports. Its real named blocks use
the upstream Faithful atlas and face/material rules. Brown swatches are not an
acceptable substitute for oak blocks.

For the database-backed arena or direct API generation, follow the upstream
`docs/local-development.md` and `docs/operations.md`. Do not call `dev:setup`
on an existing database casually: upstream documents that it resets its local
Docker volume. Import-based agent work does not need that database setup.

## Author and inspect with the existing workflow

1. Preserve the exact request and reference. Use the upstream Import workspace
   to copy the appropriate prompt for the selected grid/palette. For an exact
   benchmark experiment, preserve its inputs; do not silently add a concept,
   placement budget or another system prompt. Creative game-content work retains
   the project's concept references and subsequent native integration checks.
2. Actually dispatch the requested model and effort. The September 9 artist and
   independent reviewers are `gpt-5.6-luna` at `max`. A model name written into
   JSON does not dispatch that model. The artist owns only its output and design
   notes, not the application or validators.
3. Import the model's build JSON or `voxel.exec` envelope directly in the existing
   Import workspace. For a saved tool call, the upstream CLI already converts it:

   ```text
   pnpm tool:convert --in <tool-call.json> --out <build.json> --expanded
   ```

   This uses upstream execution and validation. Keep the exact input, output,
   warnings, source revision and actual model assignment with the study.
4. Inspect the actual upstream viewer, including both sides, bow/front,
   stern/rear, close construction details and interior/access. Compare the
   reference under the same app, textures and camera policy, aligning semantic
   orientation when the two builds face different directions. Use its existing
   orbit, pan, reset and fullscreen controls; do not build a replacement viewer
   just to automate camera buttons.
5. Have the assigned reviewer record concrete findings for proportions,
   connected secondary construction, tertiary detail, materials and prompt
   fidelity. Send visible defects back to the same artist and repeat until the
   result meets the reference. Passing validation or increasing block counts
   does not establish visual quality. Preserve compact review copies and the
   original captures; record the final judgement honestly.

The hosted provider path and a Codex subagent can differ in exposed inference
controls. Reusing the complete app reproduces the software scaffolding; it does
not prove an identical random generation or historical output-token allocation.
Record these differences without using them as an excuse to simplify the art.

Only after the visual study succeeds, and when game placement is requested,
translate it into the existing organic/module integration route. Keep game
scale, native materials, terrain fitting, support, access, replay and promotion
checks separate from the initial study. No automatic production promotion.

For new native placement, follow [structure site admission](structure-site-admission.md).
The shared terrain survey and atomic placement framework replaces forced deep
foundations as the default. The larger Cairn expedition is its first application.
