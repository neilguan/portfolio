# Independent Luna static review — v2

## Verdict

**REVISE** for the limited static concept-replication checkpoint.

The candidate preserves the requested sharp, simple Minecraft-like construction and the overall tortoise read: broad low shell, four blocky feet, centered front head, orange underside, and restrained semantic parts. The remaining mismatch is concentrated in palette/marking fidelity, face readability, and the supplied side-view identity rather than a need for more geometry detail.

## Evidence reviewed

- Original concept: `out/simple-tortoise-study-20260912/references/simple-concept.png`
- Current v2 renders: `out/luna-procedural-concept-test/versions/v2/evidence/{hero,front,side,rear}.png`
- Compact matching previews: `out/luna-procedural-concept-test/previews/{concept,hero,front,side,rear}.jpg`
- Texture atlas and 32 px semantic texture manifest: `out/luna-procedural-concept-test/textures/atlas.png`, `manifest.json`

No animation or native integration was reviewed.

## Prioritized implementation edits

1. **Bring the shell/leg palette and lava marks back toward the reference.** The current shell is nearly black with a red-dominant, high-contrast pixel-noise field; at gameplay size the thin red edges and scattered dark flecks read as random circuitry. Keep the 32 px programmer-art treatment, but move the base toward the reference's warm charcoal-brown, suppress isolated speckles, and redraw the major shell veins as fewer coherent 2–4 px bands with a dark-orange edge and a bright orange/yellow core. Match the large front, side, and rear branch paths visible in the concept. Keep leg markings sparse and orange rather than adding more small red fragments.

2. **Make the face read as the same simple front head.** In the front and hero renders the eyes are tiny orange squares high on a nearly uniform dark slab, so the face loses the reference's broad muzzle and clear eye placement at gameplay size. On the front head face, enlarge each eye to roughly 20–25% of head width, keep a 1–2 px dark inset border, and place both at the upper half with equal margins. Add the reference's distinct lighter horizontal muzzle/cheek band below the eyes without bevels or extra armor detail; preserve the rectangular head shape.

3. **Correct the side-view identity and neck connection.** The supplied side reference has the head on the right and tail on the left, while the current `side.png` presents head-left/tail-right; make the side camera/model orientation agree with the named reference view. In that same view, replace the thin detached-looking orange neck strip with a short, continuous tapered neck volume descending from beneath the shell into the head, while retaining the orange belly wedge under the front half. The expected result is a readable head-to-shell transition and the same front/rear identity across all four views.

## Positive constraints to preserve

- Keep the hard-corner cuboid/trapezoid silhouette and broad simple masses.
- Keep the warm orange underside and the small tail rather than adding detail.
- Keep the blocky feet and light toe tips; only simplify their noise and recolor as needed.
- This verdict covers static appearance only; it does not approve animation or native integration.

