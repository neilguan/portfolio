# Realtime audio critique control trial

The first GPT-Realtime-2.1 trial did not justify integrating it as a sound critic.
Eight independent sessions received actual 24 kHz mono PCM audio. Each contained
A for four seconds, half a second of silence, then B for four seconds. No source
names, transformations, expected answers or earlier results were sent.

| Control | Result |
| --- | --- |
| Identical repeated stone footsteps | Uncertain; did not establish equivalence |
| Footsteps with B 12.04 dB louder | Uncertain; described difference as subtle |
| RMS-matched hard clipping on A | Uncertain |
| Three injected 1 ms clicks on B | Uncertain |
| Identical quiet water | Correctly reported indistinguishable |
| Footsteps with A 12.04 dB louder | Incorrectly reported same |
| RMS-matched hard clipping on B | Uncertain; distortion reported same |
| Three injected 1 ms clicks on A | Uncertain |

Only one of eight met the predefined expected answers. This does not mean seven
confident hallucinations: most answers abstained with low confidence. Nevertheless,
none of the six known-change presentations identified the intended change.
All responses reported low confidence. This narrow experiment does not establish
performance with other prompts, longer clips, reasoning settings, or sound types.
Quiet water was deliberately kept at its existing asset level; click controls
test obvious added artifacts, not actual loop-boundary judgment. Timbre, artistic
fit, mix balance, human agreement and subtle loop seams remain unvalidated.

## Reproduce locally

Python dependencies: numpy, scipy, soundfile, websocket-client. Use an isolated
environment and install with `python -m pip install numpy scipy soundfile websocket-client`.

```sh
python tools/realtime_audio_trial.py
python -m unittest discover -s tools -p test_realtime_audio_trial.py -v
# Set OPENAI_API_KEY in the process environment before explicitly opting in:
python tools/realtime_audio_trial.py --run
```

Preparation is offline. `--run` sends at most eight comparisons (68 seconds total
audio), uses a fresh session for each, requests text/function arguments only,
and sets a 1200 output-token cap per response. No microphone, game credentials,
runtime changes, GitHub Actions, automatic retries or model substitutions.
`--limit 1` runs only the first comparison. `--out PATH` selects an experiment
directory; default output is ignored `out/audio-critique/realtime-trial/`.
Do not select production asset directories for outputs.

Completed responses are retained. Attempt markers prevent accidental rebilling
after interruptions; use a new directory only when deliberately rerunning.
The local manifest contains the answer key, source hashes and exact prompt/schema.
Individual result files preserve resolved model, response ID, feedback and usage.
The `summary.json` is generated after all requested comparisons complete.

Three offline tests passed: exact identical PCM pairs and order reversals,
measured 12.04 dB ratio and RMS-matched clipping, injected click samples, exact
PCM transport reconstruction, one requested response, and malformed feedback
rejection. The actual API reported audio input tokens for all eight responses
and resolved the model to `gpt-realtime-2.1`. VAD and input noise reduction were
disabled. This verifies the client setup, not the model's internal preprocessing.

## Why Realtime rather than GPT-Live

Documentation checked September 15–16, 2026:

- [GPT-Realtime-2.1](https://developers.openai.com/api/docs/models/gpt-realtime-2.1)
  accepts audio and supports function calling, but not strict Structured Outputs.
  The harness validates function arguments locally.
- [Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations)
  documents manual audio commit/response generation and function arguments.
- [WebSockets](https://developers.openai.com/api/docs/guides/voice-websockets?api=realtime)
  documents server-side authentication and PCM transport.
- [GPT-Live](https://developers.openai.com/api/docs/guides/live) targets full-duplex
  conversation with backend delegation. This trial needs one completed clip and
  one comparison response, so it tests Realtime instead. It does not test GPT-Live.

The prior GPT-Audio/GPT-Audio-1.5 controls in `docs/audio-cohesion.md` remain valid
historical evidence. Keep this branch as a local experiment; the failed trial is
not an audio approval gate or a reason to revise production assets.
