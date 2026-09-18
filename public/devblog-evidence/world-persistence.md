# Persistent worlds

The interactive game loads its saved world on startup, checkpoints every 30
seconds after loading, and flushes the latest state on normal exit. `/save`
requests an immediate checkpoint and reports completion and total save size in
chat. Save failures appear in chat and logs; failed exit saves return an error.
Abrupt termination can lose changes since the last completed checkpoint.

Persistence is enabled by default. These are runtime environment variables;
changing them requires restarting the game, with no rebuild:

| Setting | Behavior |
| --- | --- |
| `MCGPU_PERSISTENCE=0` | Fresh, temporary session. No world save files are read, created, locked or written, including at exit and through `/save`. Existing saves remain intact. |
| `MCGPU_PERSISTENCE=1` | Load and save normally; also accepts `true`/`false` and `on`/`off`. |
| `MCGPU_WORLD_DIR` | Directory containing one world. Defaults to this worktree's `saves/seed-<eight hexadecimal seed digits>`. A relative override is relative to the launch directory. |
| `MCGPU_WORLD_SEED` | Seed for a new world. An explicit seed conflicting with an existing save is rejected. With a custom world directory and no explicit seed, its saved seed wins. |
| `MCGPU_PLAYER_ID` | Record key, default `local`. Up to 64 characters: letters, digits, hyphens and underscores. Other player records are retained. This is a local development identity, not authentication. |

PowerShell, from this worktree:

```powershell
# Ordinary persistent play.
cargo run --release --locked

# Temporary debug play, including imported structures/arenas and startup probes.
$env:MCGPU_PERSISTENCE = '0'
cargo run --release --locked

# Resume the saved world on the next launch.
$env:MCGPU_PERSISTENCE = '1'
cargo run --release --locked
```

Use a separate `MCGPU_WORLD_DIR` for persistent fixture/arena experiments.
The default directory belongs to this worktree, so building this branch does
not read or modify another checkout's worlds. Copy the entire world directory
while the game is closed to transfer or back up a world. `saves/` is ignored by
Git. Graphics preferences use their existing separate file and remain active
even when world persistence is disabled.

## What survives a restart

- World identity, generator version, seed, and day/night/lunar clock tick.
- All accepted block overrides, including air left by mining, edits at negative
  coordinates, imported authored blocks, and changes to procedural landmarks.
- Per-player position, look direction, respawn location/direction, health/death,
  flight and falling state, game mode, both inventories, equipment, hotbar
  selection, an item held on the inventory cursor, and the shared combat cooldown.
- Active and dormant creature transforms, health, behavior phases, animation
  timing and habitat identities. Format 3 adds the shared player attack cooldown;
  formats 1 and 2 migrate with a zero cooldown. Format 1 also starts with an empty
  creature checkpoint. Older builds refuse format 3 rather than rolling it back.

Natural terrain, ambient landmark geometry and render LODs regenerate from the
seed. Ambient landmarks retain player-edit precedence through the existing
overlay. Restored edits enter the normal GPU upload/invalidation path before
the first visible world is ready. Bootstrap fixtures cannot overwrite restored
block changes.

Creature checkpoints restore the current encounter and reconnect local model
assets. Regenerated habitats reuse saved creature identities instead of spawning
fresh health or resetting their behavior. Offline time advances neither the sky
clock nor creature simulation.

## Disk use

Each checkpoint has a 40-byte header, compact JSON world/player metadata, and:

```text
edit bytes = 3 * changed blocks + 16 * edited 32-by-32-by-32 cubes
```

A block entry contains a two-byte local index and one-byte material ID. Each
cube stores its three signed coordinates and entry count. Only the final
override at a position is saved; repeated edits do not append an endless log.
No generated chunks, meshes, lighting volumes or distant LODs are written.
Flying farther without editing does not increase the terrain portion of a save.

A dense 100-by-100-by-100 block build has 1,000,000 entries in 64 cubes:
**3,001,024 edit bytes (2.86 MiB) per checkpoint**, plus metadata. Keeping both
checkpoints uses about **5.73 MiB**. Widely scattered edits add more cube headers.
At the existing engine limits of 4,194,304 edits and 65,536 edited cubes, edit
storage is at most **13 MiB per checkpoint**, or **26 MiB for both**. Metadata is
bounded at 8 MiB per checkpoint, including compressed creature state; player
metadata is typically a few KB. Creature archives grow with encountered habitats,
up to their declared capacity. Live multiplayer excludes the dormant archive.
Filesystem allocation and external backup/sync history are additional.

These limits are the current gameplay overlay limits, not a permanent-world
scaling solution. Saves do not increase the number of edits that the renderer
can hold. A future larger world needs partitioned authoritative storage and a
bounded streamed render projection, while retaining all edits on disk.

## Authority and recovery

`world_save::Snapshot`, `WorldMetadata` and `Store` contain no GPU handles,
camera-dependent residency data, or graphics preferences. The store accepts an
immutable snapshot after gameplay changes are applied. The desktop adapter
captures at a game update boundary and gives one snapshot to one background
writer; it never queues an unbounded backlog. Capturing the compact edit body
still takes CPU work proportional to edited blocks. Disk writes and checksums
run on the writer thread; loading and final exit flush wait for completion.

There is one world ID, a monotonically increasing checkpoint revision, and a
map of player records by identity. The shared-world host owns these records and
this store, authorizes ordered player commands, and replicates accepted changes.
Guest persistence is explicitly disabled before opening any world directory.
See [multiplayer](multiplayer.md) for authenticated identities, player prediction,
entity replication and focused conservation/reconnect tests. Checkpoint revision
is distinct from network edit revisions and per-player request sequences.

An OS file lock is held for the entire writable session, including saves in
progress; another process cannot open the same world for writing. Process exit
releases the lock automatically, so a leftover `session.lock` is harmless.
The lock is for local processes, not simultaneous copies synced across hosts.

The writer alternates `checkpoint-0.bin` and `checkpoint-1.bin`. It completely
writes and flushes the inactive slot while retaining the current slot. Each
file includes format version, revision, bounded lengths/counts and a checksum
over its header and payload. Startup selects the newest valid checkpoint. A
truncated/corrupt slot produces a visible recovery notice if the other slot is
valid; two invalid slots fail loading without replacing either. Unsupported
formats/generator versions, conflicting identities and seed mismatches also
fail closed. The checksum detects accidental damage, not hostile tampering.
The two slots protect against interrupted writes; they do not replace backups.

When generation changes incompatibly, bump `GENERATOR_VERSION` and provide a
deliberate migration or use a new world directory. Stable block IDs must remain
append-only. Format changes need a versioned reader/migration; do not silently
load an unknown version over the current generator.

## Validation

`cargo test --lib world_save --locked -- --nocapture` exercises actual disk
restart, negative/extreme coordinates, canonical edit ordering, restored upload
invalidation, air edits, player inventories, player isolation, disabled I/O,
exclusive ownership, asynchronous saves followed by newer exit state, damaged
checkpoints, write failures, malformed records, compatibility rejection, and a
million-block storage measurement. `cargo check --all-targets --locked` checks
the interactive startup/update/exit integration and existing tools.

After `cargo build --bin mcgpu-v3 --locked`, run
`python tools/world_save_smoke.py --wait-gpu 180` for the actual native startup,
save-on-exit, seeded edit/player restart, and disabled-mode checks. It uses the
existing graphics lock and isolated files under `out/world-save-smoke/`, leaving
logs and an independent save-format comparison report. Use `--profile release`
with a release build.

Recorded on 2026-09-12 in the separate persistence worktree:

- 13 persistence tests and 14 existing interactive-game tests passed.
- All-target compilation passed. Clippy completed with existing engine warnings;
  no warnings were reported for the new save module or changed exit hook.
- The native smoke check passed all four launches, including exact metadata and
  edit-body equality after restart and unchanged file hashes with saving disabled.
  Initial evidence: `out/world-save-smoke/1789203119047120400/report.json`.
- The optimized game build passed the same four native launches, additionally
  reopening the saved world with its import source unavailable. Final evidence:
  `out/world-save-smoke/1789203797996096300/report.json`.
- The million-block fixture measured 3,001,156 bytes per checkpoint including
  its world metadata, and 6,002,312 bytes for the two checkpoints.
- Formatting passed for all changed Rust files. Repository-wide `cargo fmt
  --check` still reports the pre-existing import order in
  `tools/dev-cli/src/commands/asset/itemsprite_trial.rs`; that unrelated file was left unchanged.
