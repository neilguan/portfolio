import type { Metadata } from 'next';
import { BlogHeader } from './DevblogTopicPage';
import { devblogTopics } from './topic-data';

export const metadata: Metadata = { title: 'Minecraft engine and asset experiments — Neil Guan', description: 'Engineering notes on mcgpu-v3: GPU terrain, persistent world state, multiplayer authority, and the experiments behind the asset workflows.' };
const routes = [['audio','audio'],['pixelArt','pixel-art'],['structures','structures'],['rigging','rigging']];

export default function Devblog() {
  return <main className="engineering-blog"><BlogHeader/>
    <header className="engineering-title"><p className="engineering-eyebrow">Development log / Rust · wgpu · WGSL</p><h1>Building a voxel engine and the tools to make its content</h1><p className="engineering-dek">The constraints, failed approaches, and revisions behind mcgpu-v3.</p><p className="engineering-date">Neil Guan · Record reviewed September 14, 2026</p></header>
    <div className="engineering-layout">
      <aside className="engineering-toc"><nav aria-label="Article contents"><p>Contents</p><ol><li><a href="#engine">GPU terrain and cubic storage</a></li><li><a href="#state">Persistence and multiplayer</a></li><li><a href="#assets">Asset experiments</a></li><li><a href="#mcp">What MCP does</a></li><li><a href="#verification">Verification boundaries</a></li></ol></nav></aside>
      <article>
        <p className="engineering-intro">I am building a Minecraft-like game with a large visible world and agent-assisted content creation. The engine and the asset tools have different constraints: terrain has to stream and render within hardware limits, while generated content has to look, move, and sound right in the game. A working generator has repeatedly been only the start of that second problem.</p>
        <section id="engine" className="engineering-section"><p className="engineering-number">01 / Engine</p><h2>GPU terrain generation and meshing with 32³ storage cubes</h2>
          <p>The architecture records a specific hardware asymmetry: an RTX 3090 paired with a six-core Ryzen 5 5600X. Feeding that GPU with CPU-meshed chunks would make the CPU an important constraint. The terrain path instead records a fixed number of CPU dispatches and performs the work that scales across resident terrain on the GPU.</p>
          <p>The world combines Voxy-style GPU-driven level-of-detail rendering with Cubic Chunks-style vertical storage. Its unit is a 32³ cube at every level; a cube at level L spans 32 × 2ᴸ blocks. That representation lets distant terrain use coarser data while nearby terrain retains block detail. It also means that coverage, transitions, and residency have to agree as the camera moves.</p>
          <p>The implementation uses Rust, wgpu, and WGSL. The recorded Vulkan choice follows device measurements: a larger maximum buffer and more compute workgroup memory than the tested DX12 path. Individual storage bindings still have a 2 GB limit, so larger pools must be split. These are constraints of the measured target, not a claim that the same backend wins on every machine.</p>
          <p>This design does not make all CPU cost constant. Gameplay, edited blocks, visible creature poses, effects, and UI have their own work and limits. The architecture explicitly distinguishes the fixed terrain-dispatch path from those additional costs.</p>
          <p className="engineering-sources"><span>Source record</span><a href="/devblog-evidence/engine-architecture.md">Architecture, device measurements, and representation</a></p>
        </section>
        <section id="state" className="engineering-section"><p className="engineering-number">02 / World state</p><h2>Save canonical edits and keep shared authority independent of rendering</h2>
          <p>Saving a large procedural world does not require serializing every generated chunk or mesh. The persistence layer stores the seed and world metadata, player records, creature checkpoints, and canonical block overrides—including air left by mining. Natural terrain and render data regenerate, then the saved changes enter the ordinary upload and invalidation path.</p>
          <p>This keeps durable state separate from the camera’s current terrain residency. It also creates a boundary the multiplayer implementation can use: the host owns gameplay and accepted changes; each client owns its local graphics and terrain residency. Prediction cannot award items or commit speculative world edits.</p>
          <p>There are consequences to that separation. Save formats need explicit migration, changed blocks must survive regeneration, and reconnecting players need consistent state even if their renderer has loaded a different set of cubes. The persistence and multiplayer records describe those contracts and the remaining limitations rather than inferring correctness from a single-player session.</p>
          <p className="engineering-sources"><span>Source records</span><a href="/devblog-evidence/world-persistence.md">Persistence format and recovery</a><a href="/devblog-evidence/multiplayer.md">Host authority, replication, and reconnect</a></p>
        </section>
        <section id="assets" className="engineering-section"><p className="engineering-number">03 / Asset experiments</p><h2>The decisions behind sound, pixels, structures, and creatures</h2>
          <p>I tried multiple representations and tools rather than arrive at a single asset pipeline upfront. The pages below follow the actual experiments. A rejected route stays in the account because its failure explains the next choice.</p>
          <div className="engineering-chapters">{routes.map(([key,slug],i)=><a href={`/devblog/${slug}`} key={key}><span className="engineering-number">0{i+1} / {devblogTopics[key].label}</span><h3>{devblogTopics[key].title}</h3><p>{devblogTopics[key].dek}</p><span className="engineering-read">Read the experiment record →</span></a>)}</div>
        </section>
        <section id="mcp" className="engineering-section"><p className="engineering-number">04 / Skills and tool interfaces</p><h2>Skills preserve the workflow; MCP exposes the tools to carry it out</h2>
          <p>I used skills to carry useful decisions from one experiment into the next. The creature-texture-library skill describes the box anatomy, shared image sheet, PixelOE conversion, and face crops. The creature-encounter-lab skill guides motion in a representative encounter. These instructions give the agent a concrete process instead of requiring me to explain the same expectations each time.</p>
          <p>MCP supplies operations within that process. Stable Audio exposes local generation, Freesound supplies source-search information, and Aseprite exposes layers, frames, palettes, and exports. A useful tool call changes what the agent can control. With Aseprite, it can revise a spell effect on its own layer while preserving the character underneath.</p>
          <p>Token use also shaped the setup. MCP-assisted sourcing avoided repeated page navigation, while audio processing and large working files stayed local. I wanted the agent to spend its effort choosing and revising the asset, with the tools handling the mechanical work.</p>
        </section>
        <section id="verification" className="engineering-section"><p className="engineering-number">05 / Verification</p><h2>Match each claim to the check that can actually support it</h2>
          <div className="engineering-table-wrap"><table><thead><tr><th>Claim</th><th>Relevant evidence</th><th>What it does not establish</th></tr></thead><tbody>
            <tr><td>A file is usable by a tool</td><td>Format, dimensions, schema, or import checks</td><td>Visual identity or audible quality</td></tr>
            <tr><td>A structure matches the target</td><td>Reference and candidate in matched views</td><td>Playable terrain placement</td></tr>
            <tr><td>A creature has authored motion</td><td>Clips, transitions, and pose records</td><td>Terrain contact or native behavior</td></tr>
            <tr><td>A critic detects differences</td><td>Identical-input and known-change controls</td><td>Reliable judgments beyond the tested cases</td></tr>
            <tr><td>A feature works in shared play</td><td>Authority, reconnect, and replication scenarios</td><td>Correctness inferred from solo play</td></tr>
          </tbody></table></div>
          <p>The records include results at different stages. Cinder has an accepted static model and a replayable motion study; that does not establish its native controller integration. The audio bank has provenance and level checks; those do not approve every recording by ear. The airship has an accepted static review; those images do not show a playable location.</p>
        </section>
        <footer className="engineering-article-footer"><a href="/">Back to portfolio</a></footer>
      </article>
    </div>
  </main>;
}
