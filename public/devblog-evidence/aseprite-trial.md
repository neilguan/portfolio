# Ember-fox mage benchmark

Original 64 x 64 sprite; six-frame Conjure loop (840 ms). Seven layers: Tail, Boots, Robe, Staff, Head, Casting paw, Blue fire. Fourteen visible RGB colors, binary alpha, no antialiasing. Palette reserves transparency and fifteen opaque swatches.

Timing: ready 180 ms, anticipation/squint 140 ms, growth 100 ms, peak 160 ms, decay 100 ms, recovery 160 ms. Body parts use integer translations rather than scaling to retain volume; ears and head remain rigid. Tail has a restrained one-pixel follow-through.

Created and revised through the installed Aseprite MCP. Reviewed its 3x horizontal frame exports and 10x peak export. Initial flame obscured the face; moved it seven pixels outward, added connecting sparks, and squinted the anticipation eyes. MCP validation found all seven layers populated across six frames. Pixel inspection counted fourteen opaque colors and alpha values 0/255. Frame 6 to frame 1 differed by only eighteen pixels before the identical connecting spark was added.

Self-critique: clear fox silhouette, warm/cool separation, consistent volume, and a readable flame swell. Character acting is modest; more shoulder rotation and a broader tail arc would strengthen the spell. The outline is heavier around the ears and boots than ideal for fully selective outlining. The staff grip and magic share one paw, so the casting gesture could be more distinct.

Deliverables: ember-fox.aseprite (editable), ember-fox-preview-10x.png (640 x 640), ember-fox.gif (native loop), ember-fox-preview-6x.gif (larger loop), ember-fox-spritesheet.png (384 x 64), ember-fox-spritesheet.json (timing/tag metadata). Review images preserve initial and final feedback evidence.
