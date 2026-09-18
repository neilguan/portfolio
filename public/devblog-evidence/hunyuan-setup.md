# Local Hunyuan3D image-to-mesh setup

The local Hunyuan3D-2 installation runs inside the existing Ubuntu WSL2
distribution and uses the NVIDIA RTX 3090. It is isolated from the repository's
Python packages.

## Installed locations

- Source checkout: `/home/neil/ai/Hunyuan3D-2`
- Python environment: `/home/neil/ai/Hunyuan3D-2/.venv`
- Hugging Face cache: `/home/neil/ai/huggingface-cache`
- Repository commit: `f8db63096c8282cb27354314d896feba5ba6ff8a`
- Runtime: Python 3.10.21, PyTorch 2.5.1 + CUDA 12.4

The verified route is shape generation with the full
`tencent/Hunyuan3D-2/hunyuan3d-dit-v2-0` checkpoint. Texture generation is not
enabled because Tencent's texture rasterizers require a complete CUDA toolkit
with `nvcc`, which is not installed in WSL.

## Generate a mesh

From PowerShell in the repository:

```powershell
./tools/run_hunyuan3d.ps1 `
  -InputImage ./out/hunyuan3d/inputs/emberwing-conditioning-v1-rgba.png `
  -OutputModel ./out/hunyuan3d/generated/emberwing.glb `
  -Seed 12345 `
  -Steps 50
```

The first run downloads the checkpoint. Later runs reuse the local cache. Each
generation also writes `<output>.json` with the model, seed, timings, mesh
counts, extents, and watertight status.

## Open the local browser interface

```powershell
./tools/start_hunyuan3d_ui.ps1
```

The shape-only interface opens at `http://127.0.0.1:8081`. Stop it with:

```powershell
./tools/start_hunyuan3d_ui.ps1 -Stop
```

Use a foreground-isolated RGBA image. A design sheet containing text, UV
diagrams, or multiple poses should be converted to one clean creature view
before generation.

## Create fixed review renders

```powershell
wsl -d Ubuntu -- env PYOPENGL_PLATFORM=egl `
  /home/neil/ai/Hunyuan3D-2/.venv/bin/python `
  /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/tools/hunyuan3d_render.py `
  --model /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/out/hunyuan3d/generated/emberwing.glb `
  --output-dir /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/out/hunyuan3d/review/emberwing
```

## Reduce the mesh for Blockbench

Hunyuan output is dense. Reduce it before importing it as a modeling reference:

```powershell
wsl -d Ubuntu -- `
  /home/neil/ai/Hunyuan3D-2/.venv/bin/python `
  /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/tools/hunyuan3d_prepare.py `
  --input /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/out/hunyuan3d/generated/emberwing.glb `
  --output /mnt/c/Users/neilg/OneDrive/Documents/minecraft/mcgpu-v3/out/hunyuan3d/generated/emberwing-50k.glb `
  --target-faces 50000
```

The reduced mesh remains a static reference. Minecraft-compatible segmentation,
bone pivots, UV authoring, rigging, and animation are separate downstream work.
