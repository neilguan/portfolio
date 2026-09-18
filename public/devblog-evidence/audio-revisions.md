# Game audio — September 14, 2026

## Revision 7: retire Mossmaw's door-like creaks

All eight roles using the Creaking Wood recordings (590153–590159) now use
close leaf movement, twig snaps and short wood-fiber cracks. Idle/recovery
gestures are shorter; all Mossmaw sources play at their recorded pitch. The
asset audit rejects those retired creak IDs for Mossmaw. The 238-clip bank now
uses 121 CC0 sources. New MCP searches returned HTTP 502; this correction uses
already downloaded, credited recordings. Perceptual acceptance remains subject
to in-game listening rather than source titles or automated audio opinions.

## Revision 6: mob source identity and action fit

Replaced 34 mismatched role assignments: generic monster reactions on air,
ember and water creatures now use their physical materials; Nightfang death
uses a canine reaction, tortoise uses a reptile call, and drake uses its own
reptilian recordings. Attack contacts use impacts rather than leather creaks.
Removed the blanket secondary body layer from creature clips: this previously
added the same stone crash, fire crackle or leather creak to unrelated actions.
All 160 role files remain distinct; the complete bank uses 127 CC0 sources.

Repeated wing movement no longer plays during drake gliding/return glides or
Gustling dives/falls. Transition whooshes remain separate. This is a source and
routing correction based on the creature/action definitions, not a claim that
an audio model has perceptually approved the results.

## Revision 5: remove the drone and restore audible local birds

The persistent filtered land/cave beds are no longer played. Quiet land uses
local wildlife and action sounds; water beds remain contextual, with a 900 Hz
high-pass, 6.5 kHz low-pass and 0.006 RMS ceiling instead of a narrow low band.
This supersedes the earlier continuous air-bed design.

Canopy discovery now samples every two blocks and confirms two adjacent leaves
around a hit, so a small crown between the old four-block columns is detected.
The search is bounded to 968 primary and 5808 neighbor queries every three
seconds, with nearest-source pruning. Calls start after two seconds of suitable
habitat, recur every 8–18 seconds, and use higher asset and distance gains.
Dry land, daylight, roof, height and real-canopy restrictions remain; ocean and
underwater do not activate birds. Regression checks include a compact crown
missed by the old grid and silent continuous beds on ordinary forest land.

## Revision 4: full-bank timing and mix pass

All 238 clips were revised from the preserved Revision 3 baseline. The bank now
uses 134 credited CC0 sources. Strong late contacts are moved toward the start
of short effects, with room for a smooth decay. Three new dirt recordings replace
weak takes. Placement remains 160 ms, breaking 250 ms, and steps 220 ms.
Role-specific RMS ceilings restrain sustained creature calls, movement, menus
and supporting layers; all ten creatures retain sixteen distinct clips.

Jump takeoff combines the material under the player's previous grounded position
with a quiet clothing brush, ending within 170 ms. Both local and shared-player
paths use the same presentation helper; water uses the swim cue. This does not
change movement authority, messages, persistence or reconnect behavior.

Ambient beds now have 22.8-second finished loops and a 1.2-second seam crossfade.
Longer leaf texture replaces the short repeating forest rustle. Existing low-bass
limits, quiet ambient ceilings and canopy/daylight/water rules remain enforced.
Bird calls are quieter and remain separate from every ambient loop.

`out/audio-critique/full-bank/audition/index.html` contains all 34 before/after
groups and four constructed scene comparisons. These are not live gameplay
recordings. The baseline API critiques covered the bank, but GPT-Audio and
GPT-Audio-1.5 failed identical-audio or known-level comparison controls. Their
subjective claims are not an acceptance gate. Changes use source context,
measured timing/levels and runtime routing; full perceptual approval remains
unverified. Baseline and revised snapshots preserve the exact compared files.

Validation: all 238 files pass provenance, format, peak, per-role RMS and
low-rumble limits; all 13 focused audio tests pass (physical output test remains
ignored). The multiplayer acceptance gate passes against
`fb5b4fcf68190aed7993cbdcdf5657f2536bb420`, including game/menu tests and all-target
compilation. All eight constructed before/after scene mixes stay below clipping.

## Revision 3: Freesound replaces runtime generated audio

Follow-up tuning: the jump is now a 100 ms clothing brush, 450 Hz high-pass,
with a 0.12 peak instead of 0.36. Ambient loops use 250–600 Hz high-pass filters
and a 0.012 RMS ceiling. This removes the bass-heavy ocean/underwater texture
and lowers continuous backgrounds about 4–12 dB depending on the bed. The
asset audit rejects jump/ambient clips with more than 1% energy below 180 Hz,
and rejects ambient levels above that RMS ceiling.

All 238 embedded runtime clips now come from `assets/audio/freesound/`.
This supersedes the generated asset sources described in the historical notes
below, including the old player swing, swim, jump, damage and death clips.
The existing action, material, multiplayer and habitat routing is preserved.

The bank contains 160 creature clips (16 per species), 50 material clips,
five menu/pickup clips, eleven player/compatibility effects and twelve habitat
clips. Footsteps use three separate takes per surface. Placement stays at
160 ms and breaking at 250 ms. Creature roles use appropriate source
performances and quiet material layers rather than a shared generic voice.

The installed `johnkimdw/freesound-mcp-server` supplied source search metadata.
All 131 selected sources are CC0. `assets/audio/freesound/CREDITS.md` identifies
each uploader and source page; `manifest.json` records source licenses,
preview URLs, source hashes, excerpt positions, speed, levels, filtering and
output hashes. These are Freesound high-quality previews, not original uploads.
Unmodified downloads are retained locally in `out/freesound/sources/`.

`tools/import_freesound.py` rebuilds the bank using the sibling Freesound
environment's Python, NumPy, SciPy, SoundFile and HTTPX. Source metadata can be
recovered from the shipped manifest without repeating searches. The independent
`tools/check_freesound.py` audits coverage, source credits, formats, duration,
levels and distinct creature/footstep clips. `out/freesound/listen.html` is the
comparison page. The prior generated assets remain as historical working files
but are no longer embedded by the runtime audio modules.

Ambient wind uses the uploader's plain wind version, explicitly excluding the
hawk version. Forest texture uses quiet close leaf foley; water and cave beds
are filtered. Bird calls remain separate and require actual nearby canopy,
dry suitable land and daylight; entering water or losing that habitat stops
the call. No bird-call source is mixed into any ambient loop.

The global Codex server is named `freesound`. Its launcher is
`../freesound-mcp-server/start-codex.ps1`, which reads the Windows user
`FREESOUND_API_KEY` without saving it in the game or server configuration.
The upstream console entry references a missing `main` function, so the
launcher uses the working `freesound_mcp_server.freesound` module instead.
Both tool discovery and authenticated search through that stdio launcher
were checked. `set-api-key.ps1` updates the key through a hidden prompt.

Validation: the bank audit passed for all 238 files. The 12 focused audio tests
passed, followed by the normally ignored physical output test using the new
stone, placement and drake wing clips. The edited Rust modules pass formatting;
the repository-wide formatting check reports pre-existing differences in other
modules. Playback device completion and source metadata are verified; this is
not a claim of an independent listening review of every recording.

## Revision 2: local wildlife and full species banks

The initial three-voice-per-species approach is superseded by
`assets/audio/creatures-v2/`: 16 independently generated clips for each of the
ten current species. The bank includes two idle takes, alert, windup, two attack
contacts, two movement takes, armor, two hurt takes, stagger, death, two species
specials and recovery. Repeated idle, impact, movement and hurt events alternate
actual recordings.

Existing combat events select warning, impact, damage and defense sounds. Live
creature states select breath, takeoff, spit, dive, tuck, flare, grab, shake,
guard, rally and recovery where that creature implements the action. Unsupported
gameplay is not invented to make a sample play. Join/resume establishes motion
history silently; repeated render frames do not replay an event. Source queues
remain presentation-only and bounded to 96 nearby emitter histories.

The old `forest_birds.wav` is no longer a looping runtime asset. Every ambient
bed is replaced with a generated physical air/water texture from `habitat-v2`,
finished with a four-pole 900 Hz low-pass to strongly suppress stray high tonal
content. There is no intentional birdsong or insect track in those loops.

Bird calls use a separate, stoppable positional source. The listener must be
on dry, suitable land, in daylight, near the ground and outside a built roof.
At least three sampled real leaf blocks must exist within 14 blocks; climate
alone cannot create a source. There are at most 125 block queries every three
seconds. A selected source block is rechecked before playback and while active.
Ocean, submersion, height, roof, distance or canopy loss stops the bird voice.
Three short call recordings rotate with 12–27 second gaps, after an initial
ten-second quiet period. Generated calls do not repeat as a five-second loop.

`tools/finish_creature_audio.py` retains raw masters in `out/audio-v2/masters`,
records finishing in the bank directories and creates `out/audio-v2/listen.html`.
Set `MCGPU_AUDIO_TRACE=1` to log the active bed mask, individual creature roles,
and each bird source's position and distance in the normal game log.

The following notes document the first material/UI pass; the revision above
supersedes its creature and wildlife selection details.

Generated with the connected Stable Audio 3 Medium MCP. Exact prompts, seeds and
requested durations are in `assets/audio/generated.json`; final clip lengths,
onset trims, levels and fades are in `assets/audio/cohesive/processing.json`.
Generated masters are preserved locally in `out/audio-cohesion/masters/`.
`tools/finish_audio_assets.py` reproducibly finishes these masters and builds
`out/audio-cohesion/listen.html` for comparing the sounds.

## Sound direction

Close, modestly weighted foley with immediate response and short tails. Placement
is a single compact contact (160 ms); breaking is a fracture and tiny debris
release (250 ms). Footsteps last 220 ms, with three separately generated takes
per surface and restrained playback pitch variation. Mining uses a quieter,
75 ms contact from the target material; walking uses the ground material.

| Material | Character |
| --- | --- |
| Stone | Low mineral tok and grit |
| Dirt | Soft packed-earth thud and loose grains |
| Grass/leaves | Cushioned contact and vegetation rustle |
| Sand | Soft granular scrape |
| Gravel | Angular pebble clicks |
| Wood | Warm hollow knock and fibers |
| Snow | Muted powder crunch |
| Glass/ice | Small crystalline contact |
| Metal | Restrained metallic clink |
| Mud/clay | Damp sticky squelch |

Block names select one of these materials; sandstone stays stone, and ores
stay stone rather than sounding like fabricated metal. Unknown blocks use stone.
Legacy generated swing, swim, jump, player hurt and death cues remain available.

## Context and coverage

- Ocean terrain cannot activate forest birds, plains wildlife or night insects.
  A separate bird-free ocean bed supplies water and wind. Shore, mountain, cave,
  desert and underwater beds retain their environmental selection and fades.
  Bird beds stop at night; all wildlife beds stop immediately when the listener
  is submerged or moves into an incompatible environment.
- Player walking, swimming, jumping, landing, mining, placing, breaking, attack,
  damage and death use generated sound. Landing uses the contacted surface.
- Title and settings menus have generated navigation/confirmation feedback.
  Inventory opening, closing, slot interactions, crafting clicks, harvesting,
  and local loose-item collection have distinct short feedback.
- The ten current named creature species have separate vocal textures and
  dedicated hurt/death clips. Existing authoritative presence, awakening,
  windup, impact, armor, footstep, hurt, stagger and death events select sound.
  Creature footsteps sample the ground beneath that creature. Noncombat flying
  creatures and the cartographer can emit sparse local calls. Wing strokes are
  synchronized with flight clips and limited to 48 blocks, replacing the old
  640-block reach.
- Creature and block sounds are stereo-positioned and attenuated with distance.
  All runtime sound now shares the game volume/mute control; the old independent
  combat output device is no longer constructed by the game.
- Single-player edits play after success. Host actions capture the previous
  material; fixed-tick mining captures player targets before changes. Guests
  capture the previous material before applying a validated edit. No new
  protocol fields or gameplay mutations are introduced. Refused/replayed edits
  and joining snapshots do not trigger block sounds.

The mixer allows 24 simultaneous one-shots, at most 16 creature events per frame,
and 64 pending accepted block cues. A full queue drops excess audio, never gameplay.
Sounds are presentation only and are not persisted in saves. The listening page
previews dry assets; distance, volume and simultaneous ambience affect the live mix.
