import { AudioLayerManager } from "./AudioLayerManager";
import { TrackColorManager } from "./TrackColorManager";
import { RoundedRectangle } from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle";

@component
export class UniversalCanvasColorMixer extends BaseScriptComponent {
    @input
    @allowUndefined
    @hint("Target object (can be RoundedRectangle, RectangleButton, or any mesh)")
    private _targetObject: SceneObject;
    
    @input
    @hint("Enable smooth color transitions")
    private _smoothTransitions: boolean = true;
    
    @input
    @hint("Transition speed (0-1, higher = faster)")
    private _transitionSpeed: number = 0.15;
    
    @input
    @hint("Base darkness when idle (0-1)")
    private _baseDarkness: number = 0.15;
    
    @input
    @hint("Color vibrancy multiplier (1-5)")
    private _vibrancy: number = 2.5;
    
    @input
    @hint("Enable HDR glow (values above 1.0)")
    private _enableGlow: boolean = true;
    
    @input
    @hint("Glow intensity multiplier")
    private _glowIntensity: number = 2.0;
    
    private _currentColor: vec4 = new vec4(0.15, 0.15, 0.2, 1.0);
    private _targetColor: vec4 = new vec4(0.15, 0.15, 0.2, 1.0);
    private _isInitialized: boolean = false;
    
    // References to different component types
    private _roundedRect: RoundedRectangle | null = null;
    private _meshVisual: RenderMeshVisual | null = null;
    private _material: Material | null = null;
    
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            if (!this._targetObject) {
                print("[UniversalCanvasMixer] ⚠️ No target object assigned!");
                return;
            }
            
            print("[UniversalCanvasMixer] Initializing on: " + this._targetObject.name);
            
            // Try to find RoundedRectangle
            this._roundedRect = this._targetObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;
            if (this._roundedRect) {
                print("[UniversalCanvasMixer] Found RoundedRectangle component");
                this._roundedRect.initialize();
                this._roundedRect.gradient = false;
                this._roundedRect.backgroundColor = this._currentColor;
                this._isInitialized = true;
                return;
            }
            
            // Try to find RenderMeshVisual
            this._meshVisual = this._targetObject.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
            if (this._meshVisual) {
                print("[UniversalCanvasMixer] Found RenderMeshVisual");
                
                // Try to access and clone material
                if (this._meshVisual.mainMaterial) {
                    try {
                        this._material = this._meshVisual.mainMaterial.clone();
                        this._meshVisual.mainMaterial = this._material;
                        this._material.mainPass.baseColor = this._currentColor;
                        print("[UniversalCanvasMixer] Material cloned and ready");
                        this._isInitialized = true;
                        return;
                    } catch (e) {
                        print("[UniversalCanvasMixer] Could not clone material: " + e);
                    }
                }
                
                // Fallback: try direct mainPass access
                try {
                    this._meshVisual.mainPass.baseColor = this._currentColor;
                    print("[UniversalCanvasMixer] Using direct mainPass access");
                    this._isInitialized = true;
                    return;
                } catch (e) {
                    print("[UniversalCanvasMixer] Direct mainPass failed: " + e);
                }
            }
            
            print("[UniversalCanvasMixer] ✗ Could not initialize - no compatible component found");
        });
        
        // Update every frame
        this.createEvent("UpdateEvent").bind(() => {
            if (this._isInitialized) {
                this.updateColor();
            }
        });
    }
    
    private updateColor() {
        const layerManager = AudioLayerManager.getInstance();
        const colorManager = TrackColorManager.getInstance();
        
        if (!layerManager || !colorManager) return;
        
        // Collect active tracks
        const trackIndices: number[] = [];
        const weights: number[] = [];
        let totalVolume = 0;
        
        for (let i = 0; i < 10; i++) {
            const volume = layerManager.getLayerVolume(i);
            if (volume > 0.01) {
                trackIndices.push(i);
                weights.push(volume);
                totalVolume += volume;
            }
        }
        
        // Calculate target color
        if (totalVolume < 0.01) {
            // Idle - dark base color
            this._targetColor = new vec4(
                this._baseDarkness,
                this._baseDarkness,
                this._baseDarkness + 0.05,
                1.0
            );
        } else {
            // Active - mix colors
            const mixedColor = colorManager.mixColors(trackIndices, weights);
            
            let r = mixedColor.r * this._vibrancy;
            let g = mixedColor.g * this._vibrancy;
            let b = mixedColor.b * this._vibrancy;
            
            // Apply glow boost
            if (this._enableGlow) {
                r *= this._glowIntensity;
                g *= this._glowIntensity;
                b *= this._glowIntensity;
            } else {
                // Clamp if no glow
                r = Math.min(1.0, r);
                g = Math.min(1.0, g);
                b = Math.min(1.0, b);
            }
            
            this._targetColor = new vec4(
                Math.max(0, r),
                Math.max(0, g),
                Math.max(0, b),
                1.0
            );
        }
        
        // Smooth transition
        if (this._smoothTransitions) {
            this._currentColor = this.lerpColor(
                this._currentColor,
                this._targetColor,
                this._transitionSpeed
            );
        } else {
            this._currentColor = this._targetColor;
        }
        
        // Apply to component
        this.applyColor(this._currentColor);
    }
    
    private applyColor(color: vec4) {
        try {
            if (this._roundedRect) {
                this._roundedRect.backgroundColor = color;
            } else if (this._material) {
                this._material.mainPass.baseColor = color;
            } else if (this._meshVisual) {
                this._meshVisual.mainPass.baseColor = color;
            }
        } catch (e) {
            // Silently fail - component might not be ready
        }
    }
    
    private lerpColor(from: vec4, to: vec4, t: number): vec4 {
        return new vec4(
            from.r + (to.r - from.r) * t,
            from.g + (to.g - from.g) * t,
            from.b + (to.b - from.b) * t,
            1.0
        );
    }
    
    // Public API
    public setColor(color: vec4) {
        this._currentColor = color;
        this._targetColor = color;
        this.applyColor(color);
    }
    
    public resetColor() {
        this.setColor(new vec4(this._baseDarkness, this._baseDarkness, this._baseDarkness + 0.05, 1.0));
    }
}