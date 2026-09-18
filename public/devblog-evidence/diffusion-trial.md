# Luna diffusion texture experiment

This isolated experiment keeps the existing v2 tortoise geometry, camera, lighting, and animation set. Two built-in image generation calls produced the saved shell and detail sheets in `generated/`; `process_textures.py` performs deterministic crop validation and nearest-neighbour resizing to 32px face textures. The processed material set is in `textures/` and is consumed by `versions/v2/`.

Static evidence is in `versions/v2/evidence/` for hero, front, side, and rear views. The model presentation shows stronger connected orange fissures, readable square eyes, orange throat, and pale toe accents. The diffusion source also carries dark microvariation and some asymmetry; this is preserved as generated content and is a known limitation of this small experiment. No third replacement call was needed.
