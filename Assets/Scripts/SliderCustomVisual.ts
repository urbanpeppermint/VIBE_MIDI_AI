import { Slider } from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider";
import {
    RoundedRectangleVisual,
    RoundedRectangleVisualState,
} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual";
import { StateName } from "SpectaclesUIKit.lspkg/Scripts/Components/Element";

@component
export class SliderCustomVisual extends BaseScriptComponent {
    @input
    private _slider: Slider;
    
    // Track color inputs (set these in inspector or via code)
    @input
    private _colorR: number = 1.0;
    
    @input
    private _colorG: number = 0.3;
    
    @input
    private _colorB: number = 0.5;
    
    onAwake() {
        if (!this._slider) {
            this._slider = this.sceneObject.getComponent(Slider.getTypeName()) as Slider;
        }
        
        if (this._slider) {
            this.applyCustomVisual();
        } else {
            print("[SliderCustomVisual] ERROR: No Slider component found!");
        }
    }
    
    // Call this to set color before the slider is used
    public setColor(r: number, g: number, b: number) {
        this._colorR = r;
        this._colorG = g;
        this._colorB = b;
    }
    
    private applyCustomVisual() {
        // Base color
        const baseColor = new vec4(this._colorR, this._colorG, this._colorB, 1);
        
        // Light version
        const lightColor = new vec4(
            Math.min(1, this._colorR + 0.3),
            Math.min(1, this._colorG + 0.3),
            Math.min(1, this._colorB + 0.3),
            1
        );
        
        // Dark version
        const darkColor = new vec4(
            this._colorR * 0.5,
            this._colorG * 0.5,
            this._colorB * 0.5,
            1
        );
        
        // White and grays for track background
        const white = new vec4(0.95, 0.95, 0.95, 1);
        const lightGray = new vec4(0.7, 0.7, 0.7, 1);
        const darkGray = new vec4(0.3, 0.3, 0.3, 1);
        
        const customStyle: Partial<Record<StateName, RoundedRectangleVisualState>> = {
            default: {
                isBaseGradient: true,
                hasBorder: true,
                borderSize: 0.1,
                borderType: "Color",
                borderColor: darkColor,
                baseGradient: {
                    enabled: true,
                    type: "Rectangle",
                    stop0: { enabled: true, percent: 0, color: lightColor },
                    stop1: { enabled: true, percent: 0.3, color: baseColor },
                    stop2: { enabled: true, percent: 0.7, color: baseColor },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
            hover: {
                baseGradient: {
                    enabled: true,
                    type: "Rectangle",
                    stop0: { enabled: true, percent: 0, color: white },
                    stop1: { enabled: true, percent: 0.2, color: lightColor },
                    stop2: { enabled: true, percent: 0.6, color: baseColor },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
            triggered: {
                baseGradient: {
                    enabled: true,
                    type: "Rectangle",
                    stop0: { enabled: true, percent: 0, color: lightColor },
                    stop1: { enabled: true, percent: 0.3, color: white },
                    stop2: { enabled: true, percent: 0.7, color: baseColor },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
        };
        
        // Create and apply visual BEFORE initialize
        const customVisual = new RoundedRectangleVisual({
            sceneObject: this._slider.sceneObject,
            style: customStyle,
        });
        
        this._slider.visual = customVisual;
        this._slider.initialize();
        
        print("[SliderCustomVisual] Applied custom visual with color: " + 
            this._colorR.toFixed(2) + ", " + 
            this._colorG.toFixed(2) + ", " + 
            this._colorB.toFixed(2));
    }
}