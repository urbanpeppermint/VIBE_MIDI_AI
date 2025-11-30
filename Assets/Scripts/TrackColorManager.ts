@component
export class TrackColorManager extends BaseScriptComponent {
    // Predefined colors for tracks (vibrant, distinct)
    private static readonly TRACK_COLORS: vec4[] = [
        new vec4(1.0, 0.2, 0.4, 1.0),   // 0: Hot Pink
        new vec4(0.2, 0.6, 1.0, 1.0),   // 1: Electric Blue
        new vec4(0.4, 1.0, 0.4, 1.0),   // 2: Lime Green
        new vec4(1.0, 0.8, 0.2, 1.0),   // 3: Golden Yellow
        new vec4(0.8, 0.4, 1.0, 1.0),   // 4: Purple
        new vec4(1.0, 0.5, 0.2, 1.0),   // 5: Orange
        new vec4(0.2, 1.0, 0.8, 1.0),   // 6: Cyan
        new vec4(1.0, 0.4, 0.6, 1.0),   // 7: Coral
        new vec4(0.6, 0.8, 1.0, 1.0),   // 8: Sky Blue
        new vec4(0.8, 1.0, 0.4, 1.0),   // 9: Lime Yellow
    ];
    
    private static _instance: TrackColorManager;
    
    public static getInstance(): TrackColorManager {
        return TrackColorManager._instance;
    }
    
    onAwake() {
        TrackColorManager._instance = this;
        print("[TrackColorManager] Initialized with " + TrackColorManager.TRACK_COLORS.length + " colors");
    }
    
    // Get color for a track index
    public getColorForTrack(trackIndex: number): vec4 {
        if (trackIndex < 0 || trackIndex >= TrackColorManager.TRACK_COLORS.length) {
            return new vec4(1, 1, 1, 1); // White fallback
        }
        return TrackColorManager.TRACK_COLORS[trackIndex];
    }
    
    // Get hex string for a track (for logging)
    public getHexColorForTrack(trackIndex: number): string {
        const color = this.getColorForTrack(trackIndex);
        const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    
    // Mix multiple colors based on their weights (volumes)
    public mixColors(trackIndices: number[], weights: number[]): vec4 {
        if (trackIndices.length === 0) {
            return new vec4(0, 0, 0, 1); // Black if no tracks
        }
        
        let totalWeight = 0;
        let r = 0, g = 0, b = 0;
        
        for (let i = 0; i < trackIndices.length; i++) {
            const weight = weights[i] || 0;
            if (weight <= 0) continue;
            
            const color = this.getColorForTrack(trackIndices[i]);
            r += color.r * weight;
            g += color.g * weight;
            b += color.b * weight;
            totalWeight += weight;
        }
        
        if (totalWeight <= 0) {
            return new vec4(0, 0, 0, 1);
        }
        
        return new vec4(r / totalWeight, g / totalWeight, b / totalWeight, 1);
    }
}