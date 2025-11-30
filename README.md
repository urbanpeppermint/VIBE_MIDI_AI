# 🎛️ VIBE MIDI (AI)

## AI-Powered Multi-Track Music Mixing for Snap Spectacles

Built on AI Music Gen  template, transforms your AR space into a professional DJ booth. Generate up to **10 simultaneous AI music tracks** using **Google's Lyria model**, then mix them in real-time with an intuitive **MIDI controller-inspired interface** — all through hand gestures in augmented reality.

[![Lens Studio](https://img.shields.io/badge/Lens%20Studio-5.x-yellow)](https://developers.snap.com/lens-studio)
[![Spectacles](https://img.shields.io/badge/Spectacles-2024-00D4FF)](https://developers.snap.com/spectacles)
[![Google Lyria](https://img.shields.io/badge/Google-Lyria-4285F4)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6)](https://www.typescriptlang.org/)

---
## Demo Video

https://github.com/urbanpeppermint/VIBE_MIDI_AI/blob/main/videos/VIBEMIDIDEMO.mov

I wanted to demonstrate what further is possible with the in-hand capabilities on Spectacles.**

### The Gap I Found

When I started exploring AI-generated music on Spectacles, I discovered something interesting:

- **Regular `AudioComponent`?** Plenty of examples. Well-documented. Easy multi-track playback.
- **`DynamicAudioOutput` for AI-generated streaming audio?** Almost nothing. The template played one track. That's it.

But **Lyria generates raw audio data** — you can't use `AudioComponent`. You MUST use `DynamicAudioOutput`. And nobody had documented how to:
- Play multiple `DynamicAudioOutput` streams simultaneously
- Control volume on raw byte arrays in real-time
- Mix AI-generated tracks without crashes or latency

**So I built it.**

### What This Project Actually Solves

| The Problem | My Solution |
|-------------|-------------|
| `DynamicAudioOutput` has no volume property | **Byte-level amplitude scaling** on raw PCM data |
| Multiple streams cause crashes | **10-channel layer pooling** with state management |
| Slider adjustments during playback = crash | **150ms debounced updates** + Play-to-apply pattern |
| No examples for AI audio mixing | **Complete `AudioLayerManager`** — take it, use it |
| Visualizers for dynamic audio? | **Multiple preserved codebases** ready for expansion |

---

## 🎯 What Makes This Different

### `DynamicAudioOutput` vs `AudioComponent`

This distinction matters:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  AudioComponent (Standard)          DynamicAudioOutput (This)   │
│  ─────────────────────────          ─────────────────────────   │
│  • Plays audio FILES                • Plays raw BYTE ARRAYS     │
│  • Has .volume property             • NO volume property        │
│  • Well documented                  • Minimal documentation     │
│  • Many examples exist              • No multi-layer examples   │
│  • For pre-recorded audio           • For GENERATED audio       │
│                                     • Required for Lyria/AI     │
│                                                                 │
│  We built the missing piece: real-time mixing for the right    │
│  side of this chart.                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Core Innovation

```typescript
// This doesn't exist in DynamicAudioOutput:
audioOutput.volume = 0.5; // ❌ NOT A THING

// So we built this:
private applyVolume(audioData: Uint8Array, volume: number): Uint8Array {
    const adjusted = new Uint8Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i += 2) {
        // Read 16-bit PCM sample
        let sample = audioData[i] | (audioData[i + 1] << 8);
        if (sample > 32767) sample -= 65536; // Handle signed
        
        // Apply volume
        sample = Math.round(sample * volume);
        sample = Math.max(-32768, Math.min(32767, sample));
        
        // Write back
        if (sample < 0) sample += 65536;
        adjusted[i] = sample & 0xFF;
        adjusted[i + 1] = (sample >> 8) & 0xFF;
    }
    
    return adjusted;
}
```

**This pattern is now documented and available for the community.**

---

## 🏆 Key Achievements

| Achievement | Impact |
|-------------|--------|
| **10 Simultaneous `DynamicAudioOutput` Layers** | First documented multi-layer implementation |
| **Real-time Volume on Raw Audio** | Byte-level PCM processing at 48kHz |
| **Crash-free Slider Control** | Debounced architecture, tested during video recording |
| **BPM-Synchronized Mixing** | 30 vibes with tempo mapping for beat-matching |
| **Multiple Visualizer Systems** | Preserved codebase for community expansion |
| **MIDI Symbol Interface** | Clean UI without texture dependencies |
| **100% TypeScript** | Zero external assets beyond Snap SDKs |
| **6 Days Development** | Rapid prototyping proof-of-concept |

---

## 🎨 Visualizers We Built

We designed **multiple visualizer systems** and preserved all code for future developers:

| Visualizer | Purpose | File | Status |
|------------|---------|------|--------|
| **DotPoolVisualizer** | 3D particle cloud responding to volume | `DotPoolVisualizer.ts` | ✅ Active |
| **TrackColorManager** | Dynamic color assignment per track | `TrackColorManager.ts` | ✅ Active |
| **CanvasColorMixer** | Blend colors based on track mix ratios | `CanvasColorMixer.ts` | 📦 Preserved |
| **CategoryButtonStyler** | MIDI-style UI theming system | `CategoryButtonStyler.ts` | ✅ Active |

### Dot Pool Visualizer Behavior

```
TRACK LOADED (before interaction):
├─▶ Full dot cloud visible (100%)
└─▶ Indicates track is ready to play

AFTER SLIDER TOUCHED:
├─▶ Dot count reflects actual volume %
├─▶ 0% = minimal dots (track muted)
├─▶ 50% = half cloud active
├─▶ 100% = full pulsing cloud
└─▶ Real-time visual feedback of your mix

VISUAL MAPPING:
    0%        25%        50%        75%       100%
    ·          ·  ·      ·  ●  ·    ● ● ·     ● ● ●
               ·         ·  ·  ·    · ● ●     ● ● ●
                         ·          ·   ·     ● ● ●
```

All visualizer code is **modular** — import what you need into your own projects.

---

## 🎮 How To Mix

### The Workflow That Works

For **best performance and beat synchronization**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: SELECT VIBE                                            │
│  └─▶ This locks BPM for ALL tracks (e.g., "Chill" = 80 BPM)    │
│                                                                 │
│  STEP 2: CHOOSE 2-10 TRACKS                                     │
│  └─▶ Pick Genres OR Instruments (category locks after first)   │
│                                                                 │
│  STEP 3: GENERATE                                               │
│  └─▶ Lyria creates 30-second seamless loops                    │
│  └─▶ Snap3D generates 3D visual per track                      │
│                                                                 │
│  STEP 4: SET VOLUMES FIRST ⚠️                                   │
│  └─▶ Adjust sliders BEFORE pressing Play                       │
│  └─▶ This sets levels without audio processing overhead        │
│                                                                 │
│  STEP 5: PLAY ALL TRACKS (within 1-2 seconds)                   │
│  └─▶ Same BPM = beats will sync naturally                      │
│  └─▶ 30-second loops maintain synchronization                  │
│                                                                 │
│  STEP 6: FINE-TUNE                                              │
│  └─▶ Adjust sliders, then Press Play to apply + re-sync        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why "Set Volume → Play" Instead of Live Volume?

| Approach | Problem |
|----------|---------|
| **Live volume during playback** | Requires reprocessing entire audio buffer on every slider frame (60fps = 60 reprocesses/sec = crash) |
| **Set volume → Press Play** | Process once, play smooth, re-sync beats on replay |

This is a **hardware limitation workaround**, not a missing feature. Future optimizations could enable true live mixing with audio worklets or native DSP.

---

## 🎹 MIDI Visual Language

Clean interface using **Unicode symbols** — no texture assets required:

```
◎ Knob   — Smooth analog controls
           Jazz, Blues, Folk, Classical, Country

║ Slider — Linear fader controls  
           Ambient, R&B, Soul, Classical, Dubstep

▣ Button — Digital trigger controls
           Chiptune, Metal, Punk, EDM, K-Pop

● Pad    — Rhythmic drum pad controls
           Hip Hop, House, Trap, Reggae, Afrobeat
```

### UI Text Examples

```
◎ STEP 1: SELECT VIBE [CH16]

║ STEP 2: LOAD 2-10 CONTROLS
▣ GENRES [CH1-5] OR ● INSTRUMENTS [CH1-4]
◎ VIBE: CHILL @ 80 BPM

▣ GENRES: 4/10 ▶ READY
◎ VIBE: ENERGETIC @ 128 BPM
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                               │
│                 (Hand Gestures / Spectacles)                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SecondaryUIController.ts                       │
│              MIDI-Style Menu & Selection Flow                   │
│         ◎ Vibes → ▣ Genres / ● Instruments → Generate          │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SelectionController.ts                         │
│                Validation & State Management                    │
│          (1 Vibe required + 2-10 Genres OR Instruments)        │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MusicGenerator.ts                            │
│                  AI Content Pipeline                            │
│                                                                 │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│    │  Gemini  │ ───▶ │  Lyria   │ ───▶ │  Snap3D  │           │
│    │ (Prompt) │      │ (Audio)  │      │(3D Model)│           │
│    └──────────┘      └──────────┘      └──────────┘           │
│                            │                                    │
│                            ▼                                    │
│                    Raw PCM Uint8Array                           │
│                      (48kHz Stereo)                             │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AudioLayerManager.ts                           │
│          🔑 THE CORE INNOVATION — 10-Channel Mixer              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Layer 0  ║██████░░░░░░░░░░░░│ 30%   Jazz      [Playing]  │ │
│  │  Layer 1  ║████████████░░░░░░│ 60%   Lofi      [Playing]  │ │
│  │  Layer 2  ║████████████████░░│ 80%   Electronic [Playing] │ │
│  │  Layer 3  ║░░░░░░░░░░░░░░░░░░│ 0%    Piano     [Muted]    │ │
│  │  Layer 4  ║████████████████░░│ 80%   Drums     [Playing]  │ │
│  │  ...      ...                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  • Byte-level PCM volume processing                            │
│  • 150ms debounced slider updates                              │
│  • Layer pooling with acquire/release                          │
│  • Play-to-apply architecture for stability                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VISUALIZERS                                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ DotPoolVisualizer│  │TrackColorManager│  │CanvasColorMixer ││
│  │   (3D Particles) │  │ (Dynamic Colors)│  │  (Color Blend)  ││
│  │      ✅ Active   │  │     ✅ Active   │  │   📦 Preserved  ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Stack

### AI & Cloud Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Google Lyria** | AI music generation (30-sec loops) | [Vertex AI Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music) |
| **Google Gemini** | Prompt optimization & 3D prompts | [Gemini API](https://ai.google.dev/gemini-api/docs) |
| **Snap3D** | Real-time 3D asset generation | [Snap3D API](https://developers.snap.com/spectacles/about-spectacles-features/apis/snap-3d) |

### Platform & Frameworks

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| **Lens Studio 5.x** | Development environment | [Lens Studio](https://developers.snap.com/lens-studio) |
| **Spectacles Interaction Kit** | Hand tracking & gestures | [Interaction Kit](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/get-started) |
| **Spectacles UI Kit** | AR interface components | [UI Kit](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit/get-started) |
| **Remote Service Gateway** | Cloud API communication | [RSG Docs](https://developers.snap.com/spectacles/about-spectacles-features/apis/remote-service-gateway) |
| **DynamicAudioOutput** | Streaming audio playback | Part of RSG package |

### Platform Updates

| Update | Impact | Reference |
|--------|--------|-----------|
| **Snap OS 2.0** | Improved performance, Supabase support | [Reddit Discussion](https://www.reddit.com/r/Spectacles/comments/1o8bqs4/october_snap_os_update_snap_os_20_supabase) |

### Base Template

| Source | What We Extended |
|--------|------------------|
| [AI Music Gen Sample](https://github.com/Snapchat/Spectacles-Sample/tree/main/AI%20Music%20Gen) | Single track → 10-layer mixer with UI |

---

## 📁 Project Structure

```
Assets/
├── Scripts/
│   │
│   ├── # CORE AUDIO ENGINE
│   ├── AudioLayerManager.ts       # 🔑 10-channel DynamicAudioOutput mixer
│   ├── MusicGenerator.ts          # Lyria API + track spawning
│   ├── MusicObject.ts             # Per-track controller + playback
│   ├── MusicPlayer.ts             # Fallback single-track player
│   │
│   ├── # UI & SELECTION
│   ├── SecondaryUIController.ts   # MIDI menu system
│   ├── SelectionController.ts     # Selection state + validation
│   ├── Adder.ts                   # Menu button component
│   ├── PromptObject.ts            # Selection list item
│   │
│   ├── # VISUALIZERS (all preserved for future use)
│   ├── DotPoolVisualizer.ts       # ✅ 3D particle volume display
│   ├── TrackColorManager.ts       # ✅ Dynamic track colors
│   ├── CanvasColorMixer.ts        # 📦 Color blending mixer
│   ├── CategoryButtonStyler.ts    # ✅ MIDI symbol styling
│   │
│   └── # 3D & UTILITIES
│       ├── Snap3DObject.ts        # 3D model display
│       └── ASRQueryController.ts  # Voice input (optional)
│
├── Data/
│   ├── VibesData.ts               # 30 vibes + emojis + BPM mapping
│   ├── GenresData.ts              # 34 genres + MIDI control types
│   └── InstrumentsData.ts         # 34 instruments + MIDI control types
│
└── Prefabs/
    ├── MusicObject.prefab         # Track display container
    ├── PromptObj.prefab           # Selection list item
    └── Slider.prefab              # Volume fader
```

---

## 📊 Content Data

### 30 Vibes with BPM Mapping

| Vibe | BPM | Vibe | BPM | Vibe | BPM |
|------|-----|------|-----|------|-----|
| Nature | 85 | Medieval | 75 | Upbeat | 120 |
| Chill | 80 | Energetic | 128 | Melancholic | 70 |
| Dreamy | 75 | Epic | 90 | Mysterious | 85 |
| Romantic | 72 | Nostalgic | 88 | Futuristic | 118 |
| Peaceful | 65 | Intense | 140 | Ethereal | 70 |
| Urban | 95 | Tropical | 100 | Dramatic | 85 |
| Playful | 110 | Inspirational | 92 | Cinematic | 80 |
| Funky | 105 | Retro | 115 | Ambient | 60 |
| Dark | 78 | Festive | 125 | Soothing | 65 |
| Whimsical | 108 | Elegant | 76 | Suspenseful | 82 |

### 34 Genres & 34 Instruments

**Genres:** Jazz, Chiptune, Hyperpop, Rock, Pop, Hip Hop, R&B, Electronic, Classical, Country, Metal, Blues, Reggae, Folk, Indie, Punk, Soul, Funk, Disco, Techno, House, Dubstep, Ambient, Lofi, Trap, Latin, K-Pop, J-Pop, EDM, Alternative, Grunge, Synthwave, Afrobeat, Experimental

**Instruments:** Piano, Guitar, Drums, Bass, Violin, Synth, Saxophone, Trumpet, Flute, Cello, Harp, Organ, Accordion, Harmonica, Banjo, Ukulele, Mandolin, Clarinet, Oboe, Trombone, French Horn, Tuba, Xylophone, Marimba, Vibraphone, Steel Drums, Sitar, Tabla, Didgeridoo, Bagpipes, Kalimba, 808, 303, Theremin

---

## 🔮 Future Vision

### Planned Improvements

- [ ] **Real MIDI-style UI** — Physical knob/fader textures with proper materials
- [ ] **Pre-generated track library** — Cache tracks before category selection (without burning ears!)
- [ ] **Activate preserved visualizers** — Enable color mixer, add waveform display
- [ ] **Effects processing** — EQ, reverb, filter controls
- [ ] **Save/load mixes** — Persist user creations
- [ ] **Collaborative mixing** — Multi-user shared sessions

### The Dream: Magenta on Spectacles

This project was inspired by Google's **[Magenta](https://magenta.tensorflow.org/)** — the open-source ML framework that powers technologies like Lyria.

**I can't wait to have Magenta on Spectacles.**

Imagine:
- Real-time neural audio synthesis in AR
- Gesture-controlled generative music
- AI that responds to your environment
- Creative ML tools at your fingertips — literally

This project is a step toward that future.

---

## 🚀 Use This Code

This project is designed as a **starting point** for the community:

### Take What You Need

| Component | Use Case |
|-----------|----------|
| `AudioLayerManager.ts` | Any multi-layer `DynamicAudioOutput` app |
| `DotPoolVisualizer.ts` | Audio-reactive particle systems |
| `TrackColorManager.ts` | Dynamic color assignment |
| `SecondaryUIController.ts` | Complex multi-step UI flows |
| `SelectionController.ts` | Selection state with validation |
| MIDI symbol patterns | Clean UI without textures |
| Debounce patterns | Stable real-time parameter control |

### Quick Start

1. Clone the repo
2. Open in Lens Studio 5.x
3. Configure Remote Service Gateway credentials
4. Push to Spectacles
5. Start mixing!

---

## 📚 Resources

### Official Documentation

| Resource | Link |
|----------|------|
| Google Lyria | [Music Generation Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music) |
| Google Gemini | [API Documentation](https://ai.google.dev/gemini-api/docs) |
| Snap Spectacles | [Developer Portal](https://developers.snap.com/spectacles) |
| Lens Studio | [Documentation](https://developers.snap.com/lens-studio) |
| Interaction Kit | [Getting Started](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/get-started) |
| UI Kit | [Getting Started](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit/get-started) |
| Remote Service Gateway | [API Reference](https://developers.snap.com/spectacles/about-spectacles-features/apis/remote-service-gateway) |
| Snap3D | [API Reference](https://developers.snap.com/spectacles/about-spectacles-features/apis/snap-3d) |

### Community & Updates

| Resource | Link |
|----------|------|
| r/Spectacles | [Subreddit](https://www.reddit.com/r/Spectacles/) |
| Snap OS 2.0 | [October Update Discussion](https://www.reddit.com/r/Spectacles/comments/1o8bqs4/october_snap_os_update_snap_os_20_supabase) |

### Inspiration

| Project | Link |
|---------|------|
| Google Magenta | [magenta.tensorflow.org](https://magenta.tensorflow.org/) |
| AI Music Gen Template | [GitHub](https://github.com/Snapchat/Spectacles-Sample/tree/main/AI%20Music%20Gen) |

---

## 🙏 Acknowledgments

- **Snap** — For Spectacles, Lens Studio, and the AI Music Gen template
- **Google** — For Lyria, Gemini, and the Magenta project that inspires what's next
- **Spectacles Developer Community** — For pushing boundaries together
-**My dear friend Forouzan Salsabili for sharing many good resources that helped me with this project

---

## 📄 License

MIT License — Use this code, build on it, make something amazing.

---

<div align="center">

*Built with 🎧 in 6 days*

**The first documented multi-layer `DynamicAudioOutput` mixer for Spectacles**

**Let's see what else is possible.** 🚀

</div>
