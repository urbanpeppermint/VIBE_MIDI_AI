import { AudioLayerManager } from "./AudioLayerManager";
import { TrackColorManager } from "./TrackColorManager";

@component
export class MixVisualizer extends BaseScriptComponent {
    @input
    private _mixSphere: SceneObject;
    
    private _baseScale: vec3;
    private _meshVisual: RenderMeshVisual;
    private _materialInstance: Material;
    
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            if (this._mixSphere) {
                this._baseScale = this._mixSphere.getTransform().getLocalScale();
                
                // Get mesh visual
                this._meshVisual = this._mixSphere.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
                
                if (this._meshVisual && this._meshVisual.mainMaterial) {
                    // Clone material
                    this._materialInstance = this._meshVisual.mainMaterial.clone();
                    this._meshVisual.mainMaterial = this._materialInstance;
                    
                    // Set initial color to bright white to test
                    this.setMaterialColor(new vec4(1, 1, 1, 1));
                    
                    print("[MixVisualizer] Material cloned and ready");
                } else {
                    print("[MixVisualizer] WARNING: No mesh visual or material found!");
                }
                
                // Start hidden
                this._mixSphere.enabled = false;
                
                print("[MixVisualizer] Initialized");
            }
        });
        
        // Update every frame
        this.createEvent("UpdateEvent").bind(() => {
            this.updateMixVisualization();
        });
    }
    
    // Set material color with multiple fallback approaches
    private setMaterialColor(color: vec4) {
        if (!this._materialInstance) return;
        
        try {
            // Try different property names used by different shaders
            const pass = this._materialInstance.mainPass;
            
            // Method 1: baseColor (most common for Unlit)
            if (pass.baseColor !== undefined) {
                pass.baseColor = color;
                return;
            }
        } catch (e) {}
        
        try {
            // Method 2: diffuseColor (PBR shaders)
            const pass = this._materialInstance.mainPass;
            if (pass.diffuseColor !== undefined) {
                pass.diffuseColor = color;
                return;
            }
        } catch (e) {}
        
        try {
            // Method 3: albedo
            const pass = this._materialInstance.mainPass;
            if (pass.albedo !== undefined) {
                pass.albedo = color;
                return;
            }
        } catch (e) {}
        
        try {
            // Method 4: Direct color assignment
            this._materialInstance.mainPass.baseColor = color;
        } catch (e) {
            print("[MixVisualizer] Could not set color: " + e);
        }
    }
    
    private updateMixVisualization() {
        const layerManager = AudioLayerManager.getInstance();
        const colorManager = TrackColorManager.getInstance();
        
        if (!layerManager || !colorManager || !this._mixSphere) return;
        
        // Collect active tracks and their volumes
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
        
        // Hide if no tracks active
        if (totalVolume < 0.01) {
            this._mixSphere.enabled = false;
            return;
        }
        
        // Show
        this._mixSphere.enabled = true;
        
        // Mix colors based on volumes
        const mixedColor = colorManager.mixColors(trackIndices, weights);
        
        // Make color more vibrant - ensure full saturation
        const vibrantColor = new vec4(
            Math.min(1.0, mixedColor.r * 1.5),  // Boost color
            Math.min(1.0, mixedColor.g * 1.5),
            Math.min(1.0, mixedColor.b * 1.5),
            1.0  // Full opacity
        );
        
        // Apply color
        this.setMaterialColor(vibrantColor);
        
        // Scale based on total volume
        if (this._baseScale) {
            const avgVolume = totalVolume / Math.max(1, trackIndices.length);
            const scaleFactor = 0.5 + avgVolume * 2.0;
            this._mixSphere.getTransform().setLocalScale(this._baseScale.uniformScale(scaleFactor));
        }
    }
}