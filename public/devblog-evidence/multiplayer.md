# Shared worlds

Use **Esc > Share World**. Once connected, the invitation is copied to the
clipboard. Send it to a friend who has the same game build. They copy it and
choose **Esc > Join World - Copied Invite**. No port forwarding or UPnP is
required. Sharing keeps your current game mode. Creatures continue moving,
attacking and reacting to players; Survival inventories and crafting stay active.

While hosting, Esc shows the player count, **Copy World Invite**, and
**Stop Sharing**. Stop Sharing revokes that invitation and disconnects guests.
Sharing again creates a new secret and endpoint. While visiting, **Leave World**
returns to the player's own world. Joining/leaving restarts the game after its
normal save/cleanup; a failed local save prevents the transition.
After a dropped connection, **Rejoin This World** reuses the invitation kept in
memory. A revoked invitation requires a new one from the host.

The host must keep the game open. World time continues while menus are open.
Anyone with the invitation can join and build, up to eight concurrent players
including the host. This is a host-owned cooperative world. The invitation grants
access to that world; stopping sharing revokes it. The world runs while its host
is online. An unattended world service, account directory and host migration are
separate product features, rather than requirements for joining over the internet.

## Implemented shared behavior

- Host world seed and matching generator content fingerprint; each client
  renders its own terrain and LODs, including when players are far apart.
- Late-join snapshot of accepted edits, air overrides and currently visible
  generated landmarks. The two edit layers remain separate, so moving between
  regions removes old generated landmarks while preserving player construction.
  Each guest receives only their own inventory and player record.
- Host-ordered building and mining with per-connection request sequences,
  expected-block conflict checks, reach, line of sight, occupied-player
  placement checks, valid materials and existing edit capacity limits.
- No speculative guest block writes. Reliable ordered accepted changes drive
  the same edit upload/invalidation path used in single player.
- Authenticated peer identities, visible interpolated player models, shared
  player presence, chat, and host-owned day/night time.
- The host simulates every player's movement, collision, flight, gravity,
  mining timers, drops, placement costs, inventory operations, crafting,
  equipment, health and respawn. Clients send bounded inputs and transactions.
  Client movement prediction replays unacknowledged inputs without writing
  terrain or awarding items. The host controls game mode, spawning and time.
- The host advances creatures once per fixed tick with all players as possible
  targets. Attacks have personal cooldowns; area attacks and dragonfire check
  each player's exposure, cover and Creative immunity. Clients render replicated
  transforms, animation/controller state, fire and combat effects using local assets.
- Habitat discovery considers the union of player regions. Inactive creatures
  retain their state in a bounded dormant archive, including health and animation
  phases, instead of resetting when their area unloads. Landmarks still obey the
  existing fixed terrain edit capacity and deterministic ordering.
- Saves contain guest edits, identity-keyed inventories, equipment, cursor
  stacks, health, spawn, motion and creature state. Rejoining restores the same
  player. Guests never upload replacement inventory or checkpoint state.
- Checkpoint format 3 reads original format 1 and format 2 saves. New fields have legacy
  defaults. Float round-tripping preserves exact controller and motion values.
- Bounded frames, queues, player counts and request rates. Sequence gaps or
  exhausted queues disconnect/refuse rather than silently diverge. Rejoin sends
  a fresh snapshot. Edits acknowledged only in memory can still be lost if the
  host crashes before its existing 30-second checkpoint.

Clients cannot submit arbitrary positions, health, damage or inventory state.
Survival mining revalidates the target before each player's transaction, preventing
two simultaneous miners from receiving two drops for one block. Crafting validates
materials, space and a real visible workbench when required. Replayed requests
cannot repeat accepted transactions. The host itself remains the trusted authority.

Bounds: eight connected players, 64 durable player identities, 256 active
creatures, at most 80 selected forest candidates and 4,096 dormant creatures.
The global landmark/edit budget can accept fewer candidates. Capacity refusal
preserves existing state. Movement inputs expire after ten ticks without updates;
prediction queues hold at most 32 inputs. Creature snapshots use bounded zlib
compression, with a 32 MiB decoded limit and 4 MiB compressed limit. The executable
80-creature packet scenario guards a 64 KiB encoded-frame budget. Live replication
excludes the dormant archive. These are bounded cooperative sessions, with further
scale requiring explicit capacity and performance work.

## Transport and deployment

Iroh 1.1.0 provides encrypted QUIC connections authenticated by endpoint keys.
It attempts direct connectivity and falls back to an outbound encrypted relay
connection. Dependencies are pinned by Cargo.lock; automatic router mapping
is disabled in our dependency features. References:
[Iroh connections](https://docs.rs/iroh/1.1.0/iroh/),
[relay deployment](https://docs.iroh.computer/add-a-relay).

The default public n0 relays work for development. Their provider recommends
dedicated relays for production and documents public relay rate limits. Set
`MCGPU_RELAY_URL` to an operated Iroh relay's HTTPS URL for production. A
production relay deployment and capacity monitoring are not provisioned by this
change. Internet access to an available relay remains required when direct
connectivity fails.

Additional controls:

| Control | Purpose |
| --- | --- |
| `MCGPU_PLAYER_NAME` | Display name: 1-24 ASCII letters/digits/spaces/hyphens/underscores; default Guest. |
| `MCGPU_NETWORK_PROFILE` | Private local identity directory for separate development players. Windows defaults to `%LOCALAPPDATA%/mcgpu-v3/network`. |
| `MCGPU_RELAY_ONLY=1` | Disable direct IP transport for an actual relay-only test. |
| `mcgpu-v3 --join <invite>` | Command-line join. The Esc menu is the normal entry point. |
| `/share`, `/invite`, `/unshare`, `/join`, `/leave`, `/players` | Optional chat shortcuts. Plain chat text sends to the shared world. |

Do not copy `identity.key` between players; possession identifies the returning
player. It is not an invitation. Guest startup uses an explicitly disabled
Persistence store, regardless of inherited world-directory settings. It never
opens the host's or guest's ordinary world save directory.

## Feature acceptance gate

Run `python tools/multiplayer_check.py --base <feature-base-commit>` before
accepting gameplay changes. Without `--base`, it audits current uncommitted
changes. The command writes logs and `report.json` under `out/multiplayer-audit/`.
CI runs the same gate for pull requests and main pushes.

The gate classifies changed source files against
`docs/multiplayer-contracts.json`, rejects new unclassified modules and missing
scenario names and incomplete contracts, then runs multiplayer, persistence,
player, inventory, creature simulation, edit and desktop/menu
tests and checks every Rust target. `--scope-only` is a quick policy check;
`--internet` adds the real relay-only test. The default suite requires neither
GPU access nor public internet (the encrypted socket checks use loopback).
Every promised scenario must also appear in this run's successful test results.
Helper functions, ignored/filtered tests and an old internet-test log cannot
satisfy that requirement. Scope-only output has its own `scope-report.json` and
cannot overwrite the full acceptance report. A failed run leaves the report
unaccepted rather than retaining an earlier pass.

For every new stateful feature, add focused scenarios that answer:

1. Which authority accepts the request? Can a guest forge state or another
   player's identity, inventory, damage, time or reward?
2. What happens to duplicated, stale, reordered, delayed, refused or concurrent
   requests? Is one accepted effect produced exactly once?
3. Do two clients converge after accepted updates, including separated players?
4. Does a late join see the same state? What happens during disconnect/rejoin?
5. Which state survives host save/reload? Are private records kept private?
6. What bounds memory, traffic and work? What happens at capacity?

Use `Authority`, `Replica`, `Snapshot` and actual production protocol functions
in tests. Add feature-specific conservation, entity or timing assertions rather
than only calling an existing generic test. The audit detects known regressions
and missing policy; it cannot prove an arbitrary new mechanic multiplayer-safe.

Visual verification: `cargo run --bin multiplayershot --locked` renders actual
Esc menu states at three sizes and checks the player renderer's camera-relative
placement and depth occlusion using the software adapter. After building
`mcgpu-v3` and `multiplayer_host_probe`, run
`python tools/multiplayer_smoke.py --wait-gpu 45` for the actual native guest
and headless host over relay-only connections. It verifies Survival mining,
crafting, placement, creature rendering, guest disk isolation and host save/reload.
It takes the shared graphics lock and writes evidence under `out/multiplayer-native/`.
When hardware is occupied, build `multiplayer_client_probe` and run the same
script with `--software`. That uses the production session adapter and creature
scene on a verified CPU adapter, including two rendered replicated states and
the same Survival/save checks. It does not exercise the native terrain GPU path.

## Verification recorded September 12, 2026

The full focused gate against base `d32f21d`, including `--internet`, passed:
37 multiplayer scenarios, the existing player/inventory/creature/save/edit
regressions, 16 desktop/menu tests, six audit negative controls and every Rust
target. The filtered Rust suites completed 154 successful test executions in
total, including the separately enabled public relay test; some filters overlap.
The gate classified all 33 changed source and shader files.

The two-process relay-only session also passed Survival mining, crafting and
placement, replicated creature state and rendering, guest save isolation, and
host save/reload. Both endpoints disabled direct IP transport. Creature images
used the production scene renderer on the verified Microsoft Basic Render Driver
CPU adapter. Esc menus rendered at 1600, 800 and 480 pixel widths; remote player
rendering passed large-coordinate placement and foreground depth occlusion.

Local evidence is under `out/multiplayer-audit/`,
`out/multiplayer/verified-software-smoke.log`,
`out/multiplayer-native/1789210657428392400/`, and
`out/multiplayer-review/`. The final respawn-view reconciliation change was
followed by a successful build, desktop/menu tests, all-target check and another
two-process software session.

The native hardware session could not acquire the shared GPU lock because
another task held it (Windows error 32). That check remains unverified; the CPU
session does not establish native terrain GPU startup. No CPU/WGSL terrain
generator pair was changed, and no hardware performance claim is made.

## Additional edge-case audit

The follow-up audit added 17 focused Rust scenarios and two negative controls for
the audit itself. It found and fixed these gaps:

- Each transport connection now has a distinct session identifier. A delayed
  departure or queued request from a previous connection cannot remove or act as
  a rejoined player. A rejected duplicate connection cannot disconnect the original.
- Closed output queues release even players who disconnect during loading. Queue
  eviction preserves the latest private state before a same-frame reconnect;
  interrupted admission produces cleanup for that exact connection.
- A failed host transport preserves commands accepted earlier in that poll and
  hands the final player state back to solo gameplay. Full private-state queues
  also preserve checkpoint data.
- Attack cooldowns survive save/rejoin. Respawn, mode changes and expired input
  discard old attack edges. Checkpoint format 3 prevents older readers from
  interpreting the new player fields as corruption and reverting to an old save.
- Replication rejects backwards acknowledgements, missing session members,
  inconsistent join poses, leaked private records, unknown command fields and
  invalid chat. Exhausted revision counters refuse updates without wrapping.
- Compatibility fingerprints automatically include new source modules and
  shaders, including gameplay and save adapters.

The additional scenarios exercise 2,048 mixed inventory transactions with replay
attempts and 16 save/rejoins, checking each player's item conservation. They also
cover full durable-player capacity, failed checkpoint writes and retry without
duplicate effects, truncated/invalid transport frames, and incomplete, corrupt,
concatenated or excessively expanding compressed creature data.

These tests establish the stated behavior under the scenarios exercised. They
do not prove the absence of every networking bug or replace future feature tests,
real play sessions on different networks, or production relay capacity testing.

The final follow-up gate against `1df8601` passed with `--internet`: 47 multiplayer
checks, 23 desktop/menu tests, the existing gameplay/save regressions, eight audit
negative controls and all Rust targets. Every declared contract scenario was
confirmed in this run's successful test output. Logs are in
`out/multiplayer/edge-verified-acceptance.log` and `out/multiplayer-audit/`.

The rebuilt two-process relay-only Survival/creature/save session passed again
on the verified CPU renderer, with evidence in
`out/multiplayer-native/1789212289929722700/` and
`out/multiplayer/edge-software-smoke.log`. The native hardware retry still could
not acquire the shared GPU lock (Windows error 32); its log is
`out/multiplayer/edge-native-smoke.log`. Native terrain GPU startup remains
unverified for this change.

## Continued lifecycle and simulation audit

The next audit adds 13 focused regression scenarios to the required feature
contracts. It addresses these additional failure paths:

- Hosting validates the owner record and creature snapshot and reserves the
  owner's durable slot before exposing admissions. Failed preparation leaves
  the original metadata intact. A remote identity cannot claim the owner's slot.
- A joining connection reserves capacity without immediately creating or changing
  a saved record. Failed welcome delivery, invalid snapshots and cancelled loading
  release that reservation. Returning players retain their previous saved mode
  and possessions if admission fails. A stress case cancels 80 different joins
  and then admits another friend without filling the durable player history.
- Loading players enter simulation, public presence and persistence only after
  their first accepted command. Until then they cannot fall, take creature damage
  or block another player's placement. Existing players and creatures continue
  ticking. Invalid requests do not mark a loading player ready.
- Stopping sharing preserves the final host record until consumed, even when
  cleanup runs twice. The desktop consumes that record immediately on stopping,
  and saves departing guest records even after the host handoff has been consumed.
- Rendering can drain local combat cues between simulation and publication, and
  several received creature frames can be replaced before rendering. Separate
  bounded cue queues now preserve those sound/effect events and consume them once.
  A delayed renderer retains the newest 1024 cues; health is authoritative and
  never reapplied from these cosmetic events. Late joins omit historical cues.
- A rejected periodic host input previously returned before advancing simulation.
  Since command rate windows use simulation ticks, reaching that limit could
  permanently freeze the world. Simulation now advances even when input is
  refused. A regression fills the limit, verifies continued world ticks through
  refusal, and then verifies input acceptance after the window resets.

The admission rollback and repeated-stop regressions reproduced failures before
their fixes (`out/multiplayer/audit3-before.log`). The rate-limit regression also
failed on the old path, with the world clock stuck at zero
(`out/multiplayer/audit3-rate-before.log`).

The full gate against `f5c3009` passed with `--internet`: 48 multiplayer checks,
35 desktop/menu tests, the existing gameplay/save regressions, eight audit
negative controls and every Rust target. All 13 additional contract scenarios
were confirmed in successful output from that run. Evidence is in
`out/multiplayer/audit3-acceptance.log` and `out/multiplayer-audit/`.

After rebuilding the game and both probes, the two-process relay-only session
passed Survival mining, crafting, placement, active creature replication/rendering,
private inventory, guest save isolation and host save/reload on the verified CPU
adapter. Evidence is in `out/multiplayer/audit3-software-smoke.log` and
`out/multiplayer-native/1789215050818231700/`.

The native-game retry waited 45 seconds and again could not acquire the shared
GPU lock (Windows error 32). Its log is
`out/multiplayer/audit3-native-smoke.log`. Native terrain GPU startup remains
unverified; this audit changed no terrain generators or graphics shaders.

## Integration with current main

Combining multiplayer `2036c89` with main `5e4e754` adds passing
scenarios for Creative fast flight/prediction and Survival refusal, authored
inventory validation/save/rejoin, and authored combat timing/blend persistence.
The merge preserves main's baked den orientation and the multiplayer dormant
state, and prevents guests from independently generating main's starting ruins.

The initial multiplayer gate stopped at
`habitat_selection_includes_distant_players_and_is_order_independent`: its search
found no populated guest region outside the starting landmark in the existing
seed-7 fixture. Main substantially changed habitat suitability and landmark
selection. This coupled a multiplayer rule to an incidental terrain fixture;
finding a different seed would retain that design flaw. The failed suite
completed 50 passing cases and one failure. Historical logs are in
`out/multiplayer/merge-acceptance.log` and
`out/multiplayer/merge-habitat-failure.log`.

The production den builder now calls the same discovery selector used by the
focused tests. Controlled habitat inputs guarantee positive host, guest and
guest-neighbor cases, and exercise empty regions, optional starting landmarks,
all eight players, reordered/overlapping regions, duplicate homes and integer
coordinate boundaries. A selector that visits only the host's region fails
regardless of which procedural seeds happen to have habitat.

Real terrain integration remains a separate check across seeds 0, 7, 24, 47 and
the maximum u32 seed. It verifies that combined queries equal the union of
individual queries, are order independent and bounded, and return suitable
habitats; empty regions are valid. Existing terrain-specific tests retain their
known seed/location regression fixtures. Future feature guidance in `AGENTS.md`
requires the same separation between multiplayer rules and terrain fixtures.

The corrected integration passed the full gate against `5e4e754` with
`--internet`: 53 multiplayer checks, 39 desktop/menu tests, existing
gameplay/save/terrain-habitat regressions, eight audit negative controls and
every Rust target. All declared scenarios were confirmed in the run's successful
test output, and all 34 changed source/shader files were classified. Evidence is
in `out/multiplayer/merge-seed-independent-acceptance.log` and
`out/multiplayer-audit/`. The focused habitat run is recorded in
`out/multiplayer/seed-independent-habitats.log`.

The rebuilt integration also passed the two-process relay-only Survival,
creature, private-inventory and save/reload session on the verified Microsoft
Basic Render Driver CPU adapter. Evidence is in
`out/multiplayer/merge-final-software-smoke.log` and
`out/multiplayer-native/1789217077279664900/`. The actual Esc menus rendered at
three sizes, with hosting and disconnected layouts inspected; avatar rendering
passed large-coordinate placement and foreground depth occlusion. Render evidence
is in `out/multiplayer-merge-review/`.

The native-game retry remained blocked by the shared GPU lock (Windows error 32),
recorded in `out/multiplayer/merge-final-native-smoke.log`. Native terrain GPU
startup remains unverified. The integration preserves main's terrain generator
and its paired shaders; the CPU session does not establish hardware performance.
