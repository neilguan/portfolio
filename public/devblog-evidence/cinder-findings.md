# Cinder motion revision

This pass addresses dangling flight feet, the sideways-spread death pose, preview choppiness and variable locomotion speed. Geometry remains the approved sharp model. The original ground actions other than death retain their motion; walk and run now receive full-frame previews.

Flight feet now draw up near the upper-leg joints and rotate the claws back. Takeoff and landing use smoother easing, while the neck and tail add small follow-through motions. The death pose lowers the torso with legs bending underneath instead of rotating them sideways. It remains an authored collapse, not a ragdoll simulation.

Flight, takeoff, hover, glide, landing, death, walk and run are rendered at every source frame (24 fps). Other retained previews remain at 8 fps and are labelled accordingly. Playback above normal speed necessarily advances those source frames faster; the game should evaluate the rig at its own render rate.

The speed controls select walk or run and set playback rate from the authored travel distance and duration. Slow is 0.7, normal 1.4 and fast 3.2 scene units per second; a slider permits 0.4–4. These are study-space values, not a game speed cap. Travel and footfalls scale together in the preview.

`tools/creature_success/locomotion-speed.mjs` supplies rate calculation, a smooth walk/run blend weight and phase advance from measured distance. Its checks cover stride distances, zero movement, rate synchronization and blend bounds. This module is not wired into the native game. Video playback switches gaits; it cannot demonstrate skeletal blending, collision-limited movement or terrain contact. Those remain integration work.

`rig-check.json`, `replay-check.json`, `flight-continuity.json` and `death-clearance.json` retain mechanical evidence. Endpoint pose matching does not prove velocity continuity. Clearance samples evaluate the authored meshes against the review floor, not against arbitrary terrain or each other.

The saved flight loops and connecting endpoint poses agree within numerical precision. All replayed foot targets are within 0.00001 scene units. The final death pose clears the review floor by about 0.057 scene units. The unchanged starting stance has an existing overlap of about 0.0124 scene units; the report preserves that discrepancy rather than claiming zero penetration throughout. The original ground actions other than the explicitly revised death match the previous sampled poses.
