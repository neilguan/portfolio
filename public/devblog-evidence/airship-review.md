# Luna airship v9 review — 2026-09-09

**Accepted for the requested static visual study.** The parent and independent
GPT-5.6 Luna max reviewer judge the construction detail comparable to the public
Luna airship reference. This is a visual judgement from matching views, not a
claim of an identical one-shot model experiment or game-ready placement.

Both builds were imported into the complete, unchanged MineBench app at
`b256ef5e1a6060e4d69e3be3b40b1e58773831a1`. The same Faithful textures, mesher,
viewer and ordinary orbit/pan/reset/fullscreen controls were used. The reference
faces the opposite X direction, so its camera was rotated 180 degrees to align
bow/stern semantics. Full original captures are under
`out/upstream-airship-review/v9/` (candidate) and
`out/upstream-airship-review/final/` (reference; candidate files there are v8).
The capture records report no browser errors. Compact copies below are
1280 by 800 pixels and smaller than 200 KB each.

| View | Candidate | Reference | Observation |
| --- | --- | --- | --- |
| Hero | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-hero.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-hero.jpg) | Rounded dominant balloon, connected wood hull, visible machinery and glass bow bridge. |
| Side | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-side.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-side.jpg) | Clear air gaps between swept brass blades; coherent hub, axle and guard. |
| Front | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-front.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-front.jpg) | Mirrored engines and a continuous curved bow; balloon partly occludes bridge at this angle. |
| Rear | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-rear.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-rear.jpg) | Attached rudder, layered stern and engine braces; no visible disconnected accents. |
| Detail | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-detail.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-detail.jpg) | Plank/log relief, portholes, rivets, envelope ribs, clasps and fabric stitching remain readable. |
| Interior | [v9](../../../out/chat-previews/upstream-airship/v9/candidate-interior.jpg) | [Hosted Luna](../../../out/chat-previews/upstream-airship/final/reference-interior.jpg) | Glass encloses an actual furnished bridge volume with floor, controls, lanterns and roof beams. |

The candidate's envelope is busier and more striped, its hull is deeper, and its
ladders hang less far than the reference. Those are visible design differences;
no decisive omission from the prompt remains. The earlier near-solid propeller
disks were a blocker and were revised before acceptance.

The official `tool:convert` command validates 856,361 expanded blocks without
warnings. The source hash and exact imported envelope are in `provenance.json`.
That count supports reproducibility, not the visual verdict. The reference's
86,135 delivered surface blocks and historical 662,586 generated blocks describe
different processing stages and are not directly comparable volume measures.
