export type MidiControlType = "knob" | "slider" | "button" | "pad";

export class GenresData {
  public genres = [
    "Jazz", "Chiptune", "Hyperpop", "Rock", "Pop", "Hip Hop", "R&B", "Electronic",
    "Classical", "Country", "Metal", "Blues", "Reggae", "Folk", "Indie", "Punk",
    "Soul", "Funk", "Disco", "Techno", "House", "Dubstep", "Ambient", "Lofi",
    "Trap", "Latin", "K-Pop", "J-Pop", "EDM", "Alternative", "Grunge", "Synthwave",
    "Afrobeat", "Experimental"
  ];
  
  public emojis = [
    "🎷", "🎮", "⚡", "🎸", "🎵", "🎤", "🎹", "🎛️",
    "🎻", "🤠", "🤘", "🎺", "🌴", "🪕", "🎭", "⛓️",
    "❤️", "🕺", "🪩", "🤖", "🏠", "📈", "🌌", "📻",
    "💰", "💃", "🇰🇷", "🇯🇵", "🎧", "🔄", "👕", "🌆",
    "🌍", "🧪"
  ];
  
  public controlTypes: MidiControlType[] = [
    "knob", "button", "slider", "knob", "pad", "pad", "slider", "knob",
    "slider", "knob", "button", "knob", "pad", "knob", "button", "button",
    "slider", "knob", "pad", "knob", "pad", "slider", "slider", "knob",
    "pad", "pad", "button", "button", "knob", "button", "button", "slider",
    "pad", "knob"
  ];

  // Color palette for MIDI symbols
  private static colorPalette = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788",
    "#FF8FA3", "#6C5CE7", "#A8E6CF", "#FFD93D", "#95E1D3",
    "#F38181", "#AA96DA", "#FCBAD3", "#A8DADC", "#E76F51",
    "#F4A261", "#E9C46A", "#2A9D8F", "#264653", "#E63946",
    "#F77F00", "#06FFA5", "#FF006E", "#8338EC", "#3A86FF",
    "#FB5607", "#FFBE0B", "#8AC926", "#1982C4", "#6A4C93"
  ];

  public symbolColors: string[];

  constructor() {
    // Assign random colors to each genre
    this.symbolColors = this.genres.map(() => 
      GenresData.colorPalette[Math.floor(Math.random() * GenresData.colorPalette.length)]
    );
  }

  // Helper methods
  public static getMidiSymbol(type: MidiControlType): string {
    const symbols: { [key: string]: string } = {
      "knob": "◎",
      "slider": "║",
      "button": "▣",
      "pad": "●"
    };
    return symbols[type] || "○";
  }

  public getSymbolColor(index: number): string {
    return this.symbolColors[index] || "#999999";
  }
}