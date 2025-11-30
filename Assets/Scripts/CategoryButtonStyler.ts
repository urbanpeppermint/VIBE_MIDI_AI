export type MidiControlType = "knob" | "slider" | "button" | "pad";

@component
export class CategoryButtonStyler extends BaseScriptComponent {
  
  private static readonly SYMBOLS: { [key: string]: string } = {
    "knob": "◎",
    "slider": "║",
    "button": "▣",
    "pad": "●"
  };

  private static readonly LED_COLORS: { [key: string]: vec4 } = {
    "knob": new vec4(0.0, 1.0, 0.9, 1.0),
    "slider": new vec4(1.0, 0.5, 0.0, 1.0),
    "button": new vec4(1.0, 0.0, 0.4, 1.0),
    "pad": new vec4(0.4, 1.0, 0.2, 1.0)
  };

  private static readonly CATEGORY_COLORS: { [key: string]: vec4 } = {
    "Vibes": new vec4(0.4, 1.0, 0.4, 1.0),
    "Genres": new vec4(1.0, 0.2, 0.6, 1.0),
    "Instruments": new vec4(0.2, 0.6, 1.0, 1.0)
  };

  onAwake() {}

  public static getMidiSymbol(type: MidiControlType): string {
    return CategoryButtonStyler.SYMBOLS[type] || "○";
  }

  public static getLedColor(type: MidiControlType): vec4 {
    return CategoryButtonStyler.LED_COLORS[type] || new vec4(1, 1, 1, 1);
  }

  public static getCategoryColor(category: string): vec4 {
    return CategoryButtonStyler.CATEGORY_COLORS[category] || new vec4(1, 1, 1, 1);
  }

  public static getControlTypeForIndex(index: number): MidiControlType {
    const types: MidiControlType[] = ["knob", "slider", "button", "pad"];
    return types[index % 4];
  }
}