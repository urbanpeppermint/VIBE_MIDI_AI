import { MidiControlType } from "./GenresData";

export class VibesData {
  public vibes = [
    "Nature", "Medieval", "Upbeat", "Chill", "Energetic", "Melancholic",
    "Dreamy", "Epic", "Mysterious", "Romantic", "Nostalgic", "Futuristic",
    "Peaceful", "Intense", "Ethereal", "Urban", "Tropical", "Dramatic",
    "Playful", "Inspirational", "Cinematic", "Funky", "Retro", "Ambient",
    "Dark", "Festive", "Soothing", "Whimsical", "Elegant", "Suspenseful"
  ];

  public emojis = [
    "🌿", "🏰", "🎉", "😎", "⚡", "😢",
    "💭", "🏔️", "🔮", "💕", "📷", "🚀",
    "🕊️", "🔥", "✨", "🌃", "🌴", "🎭",
    "🎈", "💡", "🎬", "🕺", "📼", "🌫️",
    "🌑", "🎊", "🧘", "🦋", "👑", "😰"
  ];

  public controlTypes: MidiControlType[] = [
    "knob", "knob", "button", "slider", "button", "slider",   // Nature-Melancholic
    "slider", "knob", "knob", "slider", "knob", "button",     // Dreamy-Futuristic
    "slider", "button", "slider", "pad", "pad", "knob",       // Peaceful-Dramatic
    "pad", "knob", "slider", "pad", "knob", "slider",         // Playful-Ambient
    "knob", "pad", "slider", "pad", "knob", "slider"          // Dark-Suspenseful
  ];
}