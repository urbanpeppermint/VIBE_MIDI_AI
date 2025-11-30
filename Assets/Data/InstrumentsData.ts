import { MidiControlType } from "./GenresData";

export class InstrumentsData {
  public instruments = [
    "Piano", "Guitar", "Drums", "Bass", "Violin", "Synth", "Saxophone", "Trumpet",
    "Flute", "Cello", "Harp", "Organ", "Accordion", "Harmonica", "Banjo", "Ukulele",
    "Mandolin", "Clarinet", "Oboe", "Trombone", "French Horn", "Tuba", "Xylophone", "Marimba",
    "Vibraphone", "Steel Drums", "Sitar", "Tabla", "Didgeridoo", "Bagpipes", "Kalimba", "808",
    "303", "Theremin"
  ];

  public emojis = [
    "🎹", "🎸", "🥁", "🎸", "🎻", "🎛️", "🎷", "🎺",
    "🪈", "🎻", "🪕", "🎹", "🪗", "🎵", "🪕", "🎸",
    "🎵", "🎵", "🎵", "🎺", "📯", "📯", "🎵", "🎵",
    "🎵", "🥁", "🎸", "🥁", "🎵", "🎵", "🎵", "🔊",
    "🎛️", "👻"
  ];

  public controlTypes: MidiControlType[] = [
    "slider", "knob", "pad", "slider", "knob", "knob", "knob", "button",  // Piano-Trumpet
    "slider", "slider", "slider", "knob", "knob", "button", "knob", "knob", // Flute-Ukulele
    "knob", "slider", "slider", "slider", "knob", "knob", "pad", "pad",   // Mandolin-Marimba
    "pad", "pad", "knob", "pad", "slider", "knob", "pad", "pad",          // Vibraphone-808
    "knob", "slider"                                                      // 303-Theremin
  ];
}