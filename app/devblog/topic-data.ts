export type DevblogArtifact = { src: string; label: string; caption: string; kind: string };
export type DevblogStep = { id: string; title: string; paragraphs: string[]; artifacts: DevblogArtifact[]; sources: {href:string;label:string}[]; record: {label:string;text:string}|null };
export type DevblogTopic = { label:string;title:string;dek:string;premise:string;steps:DevblogStep[];currentTitle:string;currentText:string;updated?:string };
export const devblogTopics: Record<string, DevblogTopic> = {
  "audio": {
    "label": "Audio",
    "title": "Local sound generation, Freesound sourcing, and testing the audio critic",
    "dek": "Why I moved from generating cues to sourcing recordings—and why adding an AI listener did not settle the quality problem.",
    "premise": "The game needed short action sounds, creature performances, and ambience that responded to the environment. I wanted an agent to help build that bank without making every new cue an expensive manual search. The experiments changed both where the sounds came from and how I decided whether to use them.",
    "steps": [
      {
        "id": "paid",
        "title": "ElevenLabs: cost and workflow fit for a hobby project",
        "paragraphs": [
          "I wanted to build a bank of game sounds without making every experiment expensive. ElevenLabs was a possible route, but its cost and workflow did not suit the way I wanted to iterate on a hobby project. I moved to local generation so I could try different prompts and models on my own machine.",
          "That led to a Stable Audio MCP server: an interface the agent could call to request a sound and retrieve the generated file. Small-SFX and Medium were two models within this same local workflow."
        ],
        "artifacts": [],
        "sources": [],
        "record": null
      },
      {
        "id": "local",
        "title": "Stable Audio through MCP: Small-SFX and Medium in the same local pipeline",
        "paragraphs": [
          "The local workflow made generating candidates straightforward, but the candidates did not sound right. I tried Small-SFX and the larger Medium model, looking for cleaner, more convincing cues. Increasing model size did not resolve the unwanted background texture that made the sounds difficult to use.",
          "For the birds, I tried more specific prompts: isolated calls, varied distances, longer quiet gaps, and no wind, leaves, hiss, music, or speech. I also varied the seed and requested longer clips. The point of those changes was to get a clean performance I could place in the world, rather than a whole soundscape with elements I could not separate.",
          "The generated bird clip below shows the kind of output I was working with. Once the unwanted sound is mixed into the recording, changing when the game plays it cannot remove that problem. I needed a different source of audio."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/generated-birds.wav",
            "label": "Generated forest birds · historical asset",
            "caption": "The generated bird loop retained in assets/audio/ambient. This file is no longer the runtime wildlife source.",
            "kind": "audio"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "sourcing",
        "title": "Freesound: source clean, studio-quality recordings through MCP",
        "paragraphs": [
          "I chose Freesound to find clean, studio-quality source recordings without the strange background noise I was getting from generation. I wanted a usable isolated sound that could be trimmed and mixed into the game. Searching existing recordings gave me a way to choose that quality directly instead of repeatedly asking a generator to remove artifacts.",
          "The Freesound MCP server helped the agent search and retrieve source information without spending as many tokens navigating pages. The importer then handled downloads and processing locally. This divided the work sensibly: use the agent to choose a suitable performance, and use ordinary tools for cutting, filtering, level adjustment, and export.",
          "The bank eventually moved entirely to sourced recordings. Source pages and processing settings stayed attached to the files so I could replace a weak cue or rebuild an edited one without repeating the search. The existing gameplay triggers could keep using the same sound roles."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/sourced-birds.wav",
            "label": "Sourced bird call · separate positional cue",
            "caption": "A recording from the Freesound bank. Its provenance and processing are in the accompanying manifest; playback here is dry audio, not an in-game capture.",
            "kind": "audio"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "critic",
        "title": "API audio criticism: check identical inputs before trusting comparisons",
        "paragraphs": [
          "Alongside sourcing, I tried using API credits to have an audio model listen to the candidates. I wanted another way to catch the problems I could hear, especially when comparing a large bank of sounds.",
          "That introduced a second question: could I trust the listener? Tests with identical audio and known level changes exposed a problem. GPT-Audio-1.5 described one identical sample as deeper and louder than the other. Its explanation sounded reasonable, but it had invented a difference.",
          "I kept the useful parts of the workflow—source selection, local processing, and checks on timing and levels—but stopped using the model’s opinion as the final quality decision. The sourced clips still needed listening. Moving from generation to recordings solved the source-quality problem more directly than adding another confident model description."
        ],
        "artifacts": [],
        "sources": [],
        "record": null
      },
      {
        "id": "realtime",
        "title": "Realtime 2.1: a new model still had to pass the listening controls",
        "paragraphs": [
          "I revisited the idea with GPT-Realtime-2.1 after discussing GPT-Live. These are different APIs: GPT-Live handles an ongoing spoken conversation with backend delegation, while Realtime lets a developer submit a complete audio clip and request a response. That made Realtime a practical candidate for a local sound-review tool, but API support alone could not establish whether its judgments were useful.",
          "Before integrating it, I ran eight comparisons using existing stone footsteps and quiet water audio. Two pairs were identical. The other six presented a 12.04 dB level change, RMS-matched hard clipping, or three added clicks, each in both A/B orders. Every comparison used a fresh session with anonymous candidates. The model received the actual audio and the comparison prompt, but no filenames, transformations, expected answers, or earlier results.",
          "Only the identical-water comparison met all its expected answers. Realtime was uncertain about the identical footsteps, missed the known level change in both orders, and did not correctly identify which candidate contained the clipping or added clicks. In one direction it called the volume-changed pair the same. None of the six known-change presentations produced the required detection.",
          "This failure differed from the earlier GPT-Audio result. All eight answers had low confidence, and most expressed uncertainty rather than inventing a confident distinction. That is a better way to handle uncertainty, but it still did not provide the dependable feedback I needed for iteration.",
          "I checked the experiment itself before accepting that result. Offline tests verified identical sample data, the measured level difference, RMS matching, click placement, order reversals, and that the transport sent the prepared PCM bytes. The API reported audio input usage and resolved the requested model. Those checks support the client setup; they do not reveal how the model processes audio internally.",
          "I stopped at the trial instead of adding it as a production critic. This was one small experiment with short clips and one prompt, not a general benchmark. It did not test GPT-Live, artistic fit, subtle loop seams, or agreement with human listeners. Source selection, measured audio checks, and listening in the game remain the useful workflow."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/realtime-level-control.wav",
            "label": "Level-change control · anonymous A/B input",
            "caption": "The exact 8.5-second file sent for control 02: A runs from 0–4 seconds, followed by 0.5 seconds of silence, then B from 4.5–8.5 seconds. B is 12.04 dB louder. No separate playback normalization was applied.",
            "kind": "audio"
          }
        ],
        "sources": [
          {
            "href": "/devblog-evidence/realtime-audio-trial.md",
            "label": "Method, results, and limits"
          },
          {
            "href": "/devblog-evidence/realtime-results.json",
            "label": "All eight saved responses"
          },
          {
            "href": "https://developers.openai.com/api/docs/models/gpt-realtime-2.1",
            "label": "OpenAI model documentation"
          }
        ],
        "record": {
          "label": "Local trial · eight comparisons",
          "text": "1/8 met the predefined answers; 0/6 known-change presentations were correctly detected. Most failures were low-confidence abstentions. No production sound assets were changed."
        }
      }
    ],
    "currentTitle": "Use AI to find and process clean recordings",
    "currentText": "The useful division of work became MCP-assisted search, local audio processing, and listening to the result. I can replace a performance without rebuilding the game’s audio system, and I no longer need to make every sound through generation. The Realtime 2.1 follow-up did not earn a place as an automated critic: it missed the controlled changes, so its integration remains an experiment.",
    "updated": "September 15, 2026"
  },
  "pixelArt": {
    "label": "Pixel art",
    "title": "Why Aseprite’s editing tools worked better than generated pixel art",
    "dek": "Code could place pixels, but useful tool calls made it easier to turn those pixels into recognizable textures and animated characters.",
    "premise": "My early sprites were not recognizable enough. I tried generating them through code, then tried image generation and pixelization. The most useful change was giving the agent a proper editing environment: Aseprite still works with pixels, but its layers, frames, previews, and targeted operations let the agent work on the image in a much more useful way.",
    "steps": [
      {
        "id": "procedural",
        "title": "Code-generated sprites failed at recognition",
        "paragraphs": [
          "The early code-generated sprites failed the thing I needed from them: I could not reliably tell what the objects were. A file could have the right dimensions, a limited palette, and clean transparency while its silhouette still failed to communicate the item.",
          "Generating a larger catalog did not fix that. The generator reused shapes and palettes, and the audit found many identical outputs. The deeper issue was not the number of files; it was that the agent could satisfy the pixel format without making a recognizable object.",
          "This made the editing workflow important. Aseprite ultimately uses the same underlying medium—colored pixels—but the available tool calls expose layers, frames, and local changes. I wanted to see whether that structure would help the agent make stronger visual decisions."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/sprite-catalog.png",
            "label": "Early procedural sprite catalog",
            "caption": "The exported catalog. Producing this many files did not make the individual items recognizable.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "diffusion",
        "title": "GPT Image and pixelization: attractive images were difficult to correct precisely",
        "paragraphs": [
          "I next tried generating images with GPT Image and converting them to pixel art, including pixelization research and third-party MCP workflows. GPT Image was very useful for concepts, but turning its output into a final small asset was a different task. I needed control over which details survived conversion and where they landed.",
          "The tortoise texture experiments show that distinction. One pass drew the markings procedurally; another generated texture sheets and cropped them onto the same model. The generated version changed the appearance substantially, but it was still difficult to make a precise correction to a face or marking by asking for another image.",
          "My conclusion was that diffusion did not provide enough feedback for the final pixel-editing work I wanted. I kept using it where it was strong—exploring designs and making material inputs—while looking for a more direct way to author finished sprites and block textures."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/tortoise-procedural.jpg",
            "label": "Procedural texture pass",
            "caption": "The reviewed v2 tortoise, with the dark shell and fragmented markings discussed in the review.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/tortoise-diffusion.jpg",
            "label": "Diffusion texture pass",
            "caption": "The separate texture experiment on the retained v2 geometry. This is the relevant comparison, rather than an unrelated later creature.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "materials",
        "title": "Use generated sheets as a material library for 3D mobs",
        "paragraphs": [
          "One useful branch of those experiments was to generate a large material sheet, pixelize it once, and let the agent choose the parts to use. This reduced the amount I was asking image generation to solve. The sheet supplied colors and surface patterns; the agent supplied the creature’s box geometry and assigned material regions to its faces.",
          "I captured that process in the creature-texture-library skill. The skill guides anatomy and joints, a shared GPT Image sheet, PixelOE conversion, and exact-size face crops. Keeping the converted sheet stable lets the agent reuse a material and adjust a crop without generating the entire appearance again.",
          "This worked as a way to texture 3D creatures. For individual 2D sprites, I still wanted direct control over the pixels and animation frames, which led to Aseprite."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/material-source.png",
            "label": "Material source sheet",
            "caption": "Preserved high-resolution material input from the existing library example.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/material-sheet.png",
            "label": "Pixelized material library",
            "caption": "The converted sheet from which the agent selects regions.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/material-creature.jpg",
            "label": "Reed-antelope material application",
            "caption": "A model presentation from the material-library route, kept separate from the sprite trials.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "aseprite",
        "title": "Aseprite MCP: edit and preview the animation while building it",
        "paragraphs": [
          "I compiled Aseprite and connected it through MCP so the agent could work with layers, frames, palettes, and exports. The important change was the set of operations available to it. It could separate the head, body, staff, and spell effect, inspect a frame, then change one element without replacing everything else.",
          "The fox animation provides a concrete example. The initial flame covered the face. The agent moved the effect outward, added connecting sparks, and changed the anticipation eyes. Because the effect and body parts were separate layers, the correction could preserve the character while improving the action.",
          "The GIFs below show the Luna and Astra studies. Both have animated frames; the Luna version was previously displayed here as a still image. Seeing the loops makes the difference in acting and timing much clearer than a single exported frame."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/astra-fox.gif",
            "label": "Astra · fox spell animation",
            "caption": "Six-frame conjuring loop, including anticipation, flame growth, and recovery.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/luna-fox.gif",
            "label": "Luna · fox spell animation",
            "caption": "The actual six-frame Luna GIF, enlarged with nearest-neighbor scaling.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "comparison",
        "title": "Use Luna for basic block textures and keep Aseprite as the authoring tool",
        "paragraphs": [
          "After these trials, I concluded that Luna was fine for basic block texturing and that the Aseprite route gave me the best results. I did not need to make every texture task a more expensive modeling experiment. A focused brief and useful editing tools were enough for the simpler material work.",
          "The recent texture studies include bricks, a furnace face, diamond ore, and a six-face grass-block UV sheet. The grass study separates its base, grass accents, and dirt accents into layers, with 16×16 faces arranged in a cube net. That is useful editable structure for a block texture, rather than a flattened image that has to be regenerated for each change.",
          "Skills describe the task and style expectations; MCP gives the agent the operations to carry them out in Aseprite. That combination mattered more to this workflow than simply telling an agent to make better pixel art."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/blocks-bricks.png",
            "label": "Luna block study · bricks",
            "caption": "Aseprite export at enlarged pixel scale.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/blocks-furnace.png",
            "label": "Luna block study · furnace",
            "caption": "The front face needs to read as a recognizable block.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/blocks-diamond.png",
            "label": "Luna block study · diamond ore",
            "caption": "Material and ore clusters authored at the final pixel resolution.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/grass-uv.png",
            "label": "Recent grass-block UV study",
            "caption": "Six 16×16 faces, authored with separate base and accent layers.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      }
    ],
    "currentTitle": "Use the stronger feedback loop for the final pixels",
    "currentText": "GPT Image remains useful for concepts and material sheets. Aseprite supplies the layers, animation frames, and targeted editing operations for final pixel work. For basic block textures, Luna working through that toolset was sufficient."
  },
  "structures": {
    "label": "Structures",
    "title": "From a failed custom structure harness to MineBench",
    "dek": "I stopped rebuilding the tooling and used an established voxel-generation benchmark as the foundation.",
    "premise": "This followed a pattern I use in research too: try to understand the problem, find out what other people have already built, and reuse a strong foundation when it exists. Maintaining my own version of every tool was taking work away from the game itself.",
    "steps": [
      {
        "id": "custom",
        "title": "The custom harness did not produce the structures I wanted",
        "paragraphs": [
          "I first tried a custom structure-generation harness, including a GPU-friendly scripting approach. I wanted agents to produce detailed Minecraft-like builds, but my setup generated much simpler results than the benchmark examples I was looking at.",
          "The early airship was the clearest failure: a box-like hull, stacked balloon bands, and thin cross-shaped propellers. The custom representation and simplified viewing setup were not giving me the result I wanted. Continuing to add machinery around that approach meant spending more time rebuilding a toolchain that already existed elsewhere.",
          "I decided to move on to an established harness. The useful next experiment was to work inside a system already built for voxel generation and comparison."
        ],
        "artifacts": [],
        "sources": [],
        "record": null
      },
      {
        "id": "minebench",
        "title": "Reuse MineBench, then adapt it for survival worlds",
        "paragraphs": [
          "I chose MineBench because its source was available and it was an active benchmark. I expected the harness to keep being updated, and its existing purpose was to generate voxel builds and compare the results. VoxelBench did not offer the source access I wanted.",
          "I reused the complete MineBench workflow: its prompts, import and generation path, converter, textures, and viewer. That let me put effort into the actual structure instead of rebuilding those pieces. This is the same approach I often take in research: use what other people have already developed when it solves the problem. Reinventing the wheel was not the useful part of this project.",
          "The images below belong to this MineBench phase. They show the reference, a candidate with overly broad propellers, and the revised build. Once the established environment was in place, I could focus on concrete construction changes rather than the surrounding harness.",
          "MineBench is still a benchmark for showcase builds, so its output is not automatically suited to traditional Minecraft survival worlds. I want to modify it next so terrain fit, traversal, and the kinds of structures a player encounters in survival help shape the generation. The established harness is the foundation for that work."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/airship-reference.jpg",
            "label": "MineBench phase · reference",
            "caption": "The benchmark reference used after switching to the established harness.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/airship-v8.jpg",
            "label": "MineBench phase · candidate",
            "caption": "The candidate before the final propeller revision.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/airship-v9.jpg",
            "label": "MineBench phase · revised build",
            "caption": "The revised airship in the upstream viewer.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/airship-interior.jpg",
            "label": "MineBench phase · bridge interior",
            "caption": "The furnished bridge inside the revised structure.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      }
    ],
    "currentTitle": "Reuse the tooling; spend the effort on the game-specific problem",
    "currentText": "Moving to MineBench let me stop maintaining a parallel structure harness. The next work is adapting that existing foundation to the survival worlds I want to build."
  },
  "rigging": {
    "label": "Creatures and rigging",
    "title": "Hunyuan meshes, Blender reconstruction, explicit rigs, and encounter motion",
    "dek": "The creature work changed representations several times. Each made a different part of the problem controllable—and exposed a different limitation.",
    "premise": "A generated creature image can suggest a coherent body without supplying usable anatomy, joints, textures, or motion. I tried recovering those from a generated mesh, rebuilding them explicitly, and later simplifying the representation to fit the game’s visual style. These were separate studies, not successive screenshots of one finished mob.",
    "steps": [
      {
        "id": "concepts",
        "title": "GPT Image: explore the creature before building its geometry",
        "paragraphs": [
          "GPT Image was particularly useful for concept art. It let me explore creatures with very different silhouettes, materials, and personalities before spending time on a model. The owl, manta, and broader creature sheet below show the range of ideas this opened up.",
          "Those images also gave the modeling work a concrete target. Instead of asking for an interesting creature in the abstract, I could point to its head, body proportions, wings, and material treatment. The difficulty was carrying that design into geometry that could fit the game and animate well."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/owl-concept.jpg",
            "label": "Prism owl · concept",
            "caption": "GPT Image concept used for the creature study.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/manta-concept.jpg",
            "label": "Cloud manta · concept",
            "caption": "A different flying silhouette and material direction.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/gpt-roster.jpg",
            "label": "Creature concept exploration",
            "caption": "A sheet of possible peaceful creatures, used to explore a consistent block-based style.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "hunyuan",
        "title": "Hunyuan3D: use a generated mesh as the starting sculpture",
        "paragraphs": [
          "The local Hunyuan3D-2 setup generated an Emberwing mesh from an isolated image on the RTX 3090. The verified setup was shape-only; texture generation was unavailable because the required CUDA rasterizer tooling was missing. Decimation could make the dense result easier to handle, but did not create bone pivots or separate anatomical parts.",
          "That left the central rigging problem: a fused sculpture had to become a model with intentional symmetry and articulation. The mesh could preserve useful volume and posture while still being a poor direct rigging input. I kept it as a reference while trying more deliberate construction."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/hunyuan.jpg",
            "label": "Emberwing · Hunyuan reference",
            "caption": "Preserved generated-mesh comparison. This is a shape/reference artifact, not an animated game asset.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "explicit",
        "title": "Creature Studio: an in-house setup for building creatures consistently",
        "paragraphs": [
          "Creature Studio was the name for the custom setup I had built in-house. It gave the agent a consistent way to define body parts, joints, surfaces, and poses, then render the result. The purpose was to reuse the same modeling and rigging structure for each creature instead of assembling a different approach every time.",
          "I tried rebuilding the dragon through that setup so its anatomy and moving parts would be explicit from the start. The agent could author mirrored limbs, a separate jaw, and articulated wing panels within the same conventions.",
          "That made the model easier to control, but the first reconstruction lost much of the reference’s character: the head was too simple, the neck too straight, and the wings too flat. I then tried using the Hunyuan mesh as a guide for fitting those shapes. Consistent construction helped organize the work; it did not by itself solve the modeling."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/dragon-studio.jpg",
            "label": "Creature Studio · static comparison",
            "caption": "The preserved pass-04 comparison that exposed the simplified head, neck, and wings.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "fit",
        "title": "Fit clean torso, neck, and head geometry over the Hunyuan guide",
        "paragraphs": [
          "The fitted study used the original mesh as a translucent reference in Blockbench. It followed the curved neck and lowered muzzle instead of rebuilding the animal from the image alone. A coordinate check also found that the body centerline was offset from the mesh bounding-box center; fitting around the box center would have introduced another alignment error.",
          "The result preserved the broad posture better, but remained a coarse fit. Cheeks, throat plates, and scales still needed deliberate construction. This was useful evidence that a volumetric guide could help proportions, not a completed dragon or a finished rig."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/dragon-fit.jpg",
            "label": "Fitted anatomy over the original guide",
            "caption": "Torso, neck, and head study. The original guide remained preserved underneath the new geometry.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "automatic",
        "title": "Blender through MCP: try QuadriFlow before rebuilding topology by hand",
        "paragraphs": [
          "I then installed Blender and tried automatic retopology through the MCP workflow. The agent could call Blender’s operations and inspect the output while Blender performed the geometry work locally. QuadriFlow was the shortcut I wanted to try before spending more effort rebuilding topology by hand.",
          "The attempt worked on a copy of the original mesh. QuadriFlow rejected the dragon, so the next pass used a fine voxel remesh to clean the surface and tried QuadriFlow again.",
          "QuadriFlow also rejected the cleaned dragon even though basic checks described a closed surface with consistent winding. A simple sphere remeshed successfully, which showed that the operation itself was available. That control prevented a tooling failure from being confused with a general claim about the dragon’s geometry.",
          "The voxel cleanup preserved much of the shape, but stayed dense and retained the asymmetry. The bounded automatic route had not produced an animation-ready model, so I moved on to the manual approach instead of treating cleanup as rigging completion."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/retopo-auto.jpg",
            "label": "Original and voxel-cleaned mesh",
            "caption": "The preserved Blender comparison. Automatic retopology did not succeed; this is not an approved topology result.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "manual",
        "title": "Manual head-and-neck retopology with connected loops and shrinkwrap",
        "paragraphs": [
          "The manual route chose edge loops around the anatomy and fitted them to the source surface. Batched scripts kept geometry work local and reduced the overhead of sending individual vertex operations through the agent.",
          "The head-and-neck study produced 540 connected quads with no detected self-intersections. Iteration addressed a pinch below the skull and an overly pointed muzzle. It was a more editable base, but still a plain anatomical shell: eyes, horns, jaw treatment, and layered scales were not supplied by retopology.",
          "This clarified the limit of salvaging the generated mesh. Better topology can support deformation and editing; it does not automatically reconstruct the design features that made the reference appealing. The saved study had no rig yet."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/retopo-manual.jpg",
            "label": "Manual head-and-neck reconstruction",
            "caption": "Preserved comparison of the manual base with the source. The 540-quad result was still visually generic.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "shape-to-rig",
        "title": "Direct shape authoring became practical; articulation became the next problem",
        "paragraphs": [
          "Across the modeling experiments, I realized that Astra could more or less produce complicated shapes in one pass. That changed how much value I expected from reconstructing every model through a dense generated mesh and retopology. Directly authoring the shape was becoming a practical option.",
          "The golem study and flying creatures show the range of forms I was exploring. A strong static shape still leaves a separate design task: decide which parts move together, where the pivots belong, and how the creature carries its weight. A wing needs a folding and flapping structure; a golem needs a stance and body movement that suit its mass.",
          "This is where the work moves from modeling into rigging. The model provides the visible parts. The rig organizes those parts for movement, and the animation gives that movement timing and intent. Keeping those steps explicit made it easier to see whether a problem came from the shape, the joints, or the performance."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/golem-study.jpg",
            "label": "Golem · shape revision",
            "caption": "The saved golem beside a variant revised toward its concept.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/gustling.jpg",
            "label": "Gustling · flying-creature study",
            "caption": "A compact articulated design with separate body and wing parts.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "cinder",
        "title": "Cinder: preserve an accepted shape while revising the rig and motion",
        "paragraphs": [
          "A separate Cinder route reached an accepted static model and then a fresh rig with 21 actions. The selected model had 121 parts, 1,291 triangles, and 32 bones. Those describe this particular accepted asset; they are not quality targets to impose on another species.",
          "The subsequent motion work kept the approved sharp geometry and corrected specific behaviors: feet dangling in flight, a death pose with legs spread sideways, choppy previews, and locomotion speed. Flight feet tuck near the upper-leg joints, claws rotate back, and the death pose lowers the body with the legs folded underneath.",
          "The preserved clips matter here because a still cannot demonstrate those timing changes. The flight and landing previews below use every source frame at 24 fps. The study’s displacement-based playback helper was not yet wired to the native game; video playback cannot prove collision-limited travel or terrain contact."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/cinder-fly.mp4",
            "label": "Cinder · revised flight",
            "caption": "24 fps study preview after the foot-tuck correction.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-land.mp4",
            "label": "Cinder · revised landing",
            "caption": "24 fps landing preview. This demonstrates authored motion, not arbitrary-terrain contact.",
            "kind": "video"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "boxes",
        "title": "Simplify the turtle—and the project’s creature workflow",
        "paragraphs": [
          "The turtle went through several attempts before I settled on the simpler style. The original concept had a detailed armored shell, irregular plates, a heavy neck, and articulated limbs. It looked appealing as concept art, but reproducing it kept drawing the project into more complicated geometry and reconstruction work.",
          "The early versions below show that process. The shell, legs, and neck were repeatedly rebuilt, and the fourth version still broke the shell into a pile of separate rock-like masses. Adding detail was not bringing the whole creature together. Even a closer reconstruction could still look out of place in the game.",
          "I wanted to simplify the entire project as well as improve this one turtle. Restricting creatures to boxes gave me a consistent art style and a smaller modeling problem. Character could come from proportions, texture, and animation without requiring a new approach to complicated geometry for every animal.",
          "The later box-based concept and model show that change in direction. I used GPT Image to explore a design within the simpler style, then captured the anatomy, material-sheet, PixelOE, and face-crop process in the creature-texture-library skill. The goal became making creatures that fit the world through a repeatable workflow."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/turtle-original.jpg",
            "label": "Original turtle concept",
            "caption": "The detailed armor and anatomy that started the reconstruction attempts.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/turtle-early-v2.jpg",
            "label": "Early reconstruction · v2",
            "caption": "An early attempt to build the more complicated turtle.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/turtle-complex-v4.jpg",
            "label": "Reconstruction · v4",
            "caption": "The shell had become separate rock-like masses; this version was rejected.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/turtle-concept.jpg",
            "label": "Later box-based concept",
            "caption": "A simpler target designed around the game’s visual language.",
            "kind": "image"
          },
          {
            "src": "/devblog-evidence/turtle-box.jpg",
            "label": "Box-based model",
            "caption": "The simplified direction carries the character through proportions and texture.",
            "kind": "image"
          }
        ],
        "sources": [],
        "record": null
      },
      {
        "id": "motion-gallery",
        "title": "Animate the whole creature through an encounter",
        "paragraphs": [
          "Once the model and rig were usable, I wanted the animation to show personality and variety. Walking, flight, a breath attack, a tail strike, and a collapse use the same body very differently. The clips below show that range directly.",
          "The creature-encounter-lab skill pushed this further by putting movement into a reactive encounter. Gustling’s dive winds up, folds into acceleration, and opens into a moving pullout. Its spit gathers an inhale before a forward snap and recoil. Head, feet, ears, and tail overlap the main movement so the performance is carried by the whole body.",
          "This also exposed problems that individual pose previews missed. Gustling’s blended fall, landing, and get-up could penetrate the floor even when the isolated actions looked acceptable. The encounter view made those transitions visible while keeping the focus on how the creature behaved."
        ],
        "artifacts": [
          {
            "src": "/devblog-evidence/cinder-walk.mp4",
            "label": "Cinder · walk",
            "caption": "Ground locomotion.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-run.mp4",
            "label": "Cinder · run",
            "caption": "A faster gait on the same rig.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-takeoff.mp4",
            "label": "Cinder · takeoff",
            "caption": "Transition from ground support to flight.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-fire_breath.mp4",
            "label": "Cinder · breath attack",
            "caption": "Attack performance and body pose.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-tail_whip.mp4",
            "label": "Cinder · tail strike",
            "caption": "A different action driven through the body and tail.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/cinder-death.mp4",
            "label": "Cinder · collapse",
            "caption": "Legs fold under the descending torso.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/gustling.mp4",
            "label": "Gustling · reactive encounter",
            "caption": "Flight, attacks, knockdown, and recovery in the browser encounter study.",
            "kind": "video"
          },
          {
            "src": "/devblog-evidence/turtle-motion.mp4",
            "label": "Turtle · motion study",
            "caption": "Animation from the earlier articulated turtle study, before the later box-style direction.",
            "kind": "video"
          }
        ],
        "sources": [],
        "record": null
      }
    ],
    "currentTitle": "Use concepts for direction, boxes for style, and motion for personality",
    "currentText": "GPT Image helps explore the design. Direct shape authoring makes complicated forms practical, while the box restriction keeps the selected creature style consistent. Skills carry that workflow between attempts; rigs and encounter studies turn the static design into a performance."
  }
};
