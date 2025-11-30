import { Lyria } from "RemoteServiceGateway.lspkg/HostedExternal/Lyria";
import { GoogleGenAITypes } from "RemoteServiceGateway.lspkg/HostedExternal/GoogleGenAITypes";
import { GoogleGenAI } from "RemoteServiceGateway.lspkg/HostedExternal/GoogleGenAI";
import { MusicObject } from "./MusicObject";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
import { Slider } from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider";
import { AudioLayerManager } from "./AudioLayerManager";
import { TrackColorManager } from "./TrackColorManager";
import { DotPoolVisualizer } from "./DotPoolVisualizer";
import {
    RoundedRectangleVisual,
    RoundedRectangleVisualState,
} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual";
import { StateName } from "SpectaclesUIKit.lspkg/Scripts/Components/Element";

@component
export class MusicGenerator extends BaseScriptComponent {
    @input
    private _spawnPosition: SceneObject;

    @input
    @allowUndefined
    private _sliderPrefab: ObjectPrefab;

    @input
    @allowUndefined
    private _colorIndicatorPrefab: ObjectPrefab;

    private _musicObjectPrefab: ObjectPrefab = requireAsset(
        "../Prefabs/MusicObject.prefab"
    ) as ObjectPrefab;

    private _musicObjects: MusicObject[] = [];
    private _sliderObjects: SceneObject[] = [];
    private _colorIndicators: SceneObject[] = [];
    private readonly DELAY_BETWEEN_TRACKS: number = 2000;

    onAwake() {}

    /**
     * Main entry point - generates multiple tracks sequentially
     */
    public createMusicTracks(vibe: string, items: string[], category: string, bpm: number) {
        this._clearMusicObjects();
        this._generateTracksSequentially(vibe, items, category, bpm, 0);
    }

    /**
     * Legacy single-track generation with Gemini prompt optimization
     */
    public createMusicObject(genres: string[]) {
        this._combineGenresToPrompt(genres).then(({ prompt, displayTitle }) => {
            const musicObject = this._musicObjectPrefab.instantiate(null);
            const musicObjController = musicObject.getComponent(MusicObject.getTypeName());
            
            musicObjController.setDisplayTitle(displayTitle);
            musicObjController.setPosition(this._spawnPosition.getTransform().getWorldPosition());

            const musicRequest: GoogleGenAITypes.Lyria.LyriaRequest = {
                model: "lyria-002",
                type: "predict",
                body: {
                    instances: [{ prompt: prompt }],
                    parameters: { sample_count: 1 },
                },
            };

            Lyria.performLyriaRequest(musicRequest)
                .then((response) => {
                    if (response?.predictions?.length) {
                        const b64 = response.predictions[0].bytesBase64Encoded;
                        if (b64) {
                            musicObjController.setB64Audio(b64);
                        }
                    }
                })
                .catch(() => {
                    musicObjController.setDisplayTitle("Error generating");
                    setTimeout(() => {
                        musicObjController.closeObject();
                    }, 1500);
                });
        });
    }

    /**
     * Clear all existing tracks, sliders, and indicators
     */
    private _clearMusicObjects() {
        const dotPool = DotPoolVisualizer.getInstance();
        if (dotPool) {
            dotPool.clearAllTracks();
        }
        
        for (const obj of this._musicObjects) {
            if (obj) obj.closeObject();
        }
        this._musicObjects = [];
        
        for (const slider of this._sliderObjects) {
            if (slider) slider.destroy();
        }
        this._sliderObjects = [];
        
        for (const indicator of this._colorIndicators) {
            if (indicator) indicator.destroy();
        }
        this._colorIndicators = [];
    }

    /**
     * Generate tracks one by one with delay between each
     */
    private _generateTracksSequentially(
        vibe: string,
        items: string[],
        category: string,
        bpm: number,
        index: number
    ) {
        if (index >= items.length) return;

        const item = items[index];
        const prompt = this._buildPrompt(vibe, item, category, bpm);

        const musicObj = this._musicObjectPrefab.instantiate(null);
        const controller = musicObj.getComponent(MusicObject.getTypeName());

        if (!controller) return;

        // Calculate position (spread horizontally)
        const basePos = this._spawnPosition.getTransform().getWorldPosition();
        const spacing = 30;
        const startOffset = -((items.length - 1) * spacing) / 2;
        const position = basePos.add(new vec3(startOffset + index * spacing, 0, 0));

        controller.setTrackId(item);
        controller.setPosition(position);
        controller.setDisplayTitle(item);
        this._musicObjects.push(controller);
        
        // Spawn slider for volume control
        this._spawnSliderForTrack(controller, position, index);

        // Request audio from Lyria
        const musicRequest: GoogleGenAITypes.Lyria.LyriaRequest = {
            model: "lyria-002",
            type: "predict",
            body: {
                instances: [{ prompt: prompt }],
                parameters: { sample_count: 1 },
            },
        };

        Lyria.performLyriaRequest(musicRequest)
            .then((response) => {
                if (response?.predictions?.length) {
                    const b64 = response.predictions[0].bytesBase64Encoded;
                    if (b64) {
                        controller.setB64Audio(b64);
                    }
                }

                // Continue to next track after delay
                setTimeout(() => {
                    this._generateTracksSequentially(vibe, items, category, bpm, index + 1);
                }, this.DELAY_BETWEEN_TRACKS);
            })
            .catch(() => {
                controller.setDisplayTitle("Error: " + item);
                
                // Continue despite error
                setTimeout(() => {
                    this._generateTracksSequentially(vibe, items, category, bpm, index + 1);
                }, this.DELAY_BETWEEN_TRACKS);
            });
    }

    /**
     * Spawn volume slider for a track
     */
    private _spawnSliderForTrack(trackController: MusicObject, trackPosition: vec3, trackIndex: number) {
        if (!this._sliderPrefab) return;
        
        const sliderSceneObj = this._sliderPrefab.instantiate(null);
        const sliderPosition = trackPosition.add(new vec3(0, -15, 0));
        sliderSceneObj.getTransform().setWorldPosition(sliderPosition);
        
        // Get track color for slider styling
        const colorManager = TrackColorManager.getInstance();
        const trackColor = colorManager ? colorManager.getColorForTrack(trackIndex) : new vec4(1, 1, 1, 1);
        
        // Register track with visualizer
        const dotPool = DotPoolVisualizer.getInstance();
        if (dotPool) {
            dotPool.registerTrack(trackIndex);
        }
        
        const slider = sliderSceneObj.getComponent(Slider.getTypeName()) as Slider;
        if (slider) {
            // Apply colored gradient visual to slider
            this._applySliderVisual(slider, trackColor);
            
            slider.onInitialized.add(() => {
                slider.currentValue = 0.0; // Start muted
                
                slider.onValueChange.add((value: number) => {
                    const layerIndex = trackController.getLayerIndex();
                    const layerManager = AudioLayerManager.getInstance();
                    
                    if (layerManager && layerIndex >= 0) {
                        layerManager.setLayerVolume(layerIndex, value);
                    }
                    
                    this._updateColorIndicator(trackIndex, value);
                });
            });
        }
        
        this._sliderObjects.push(sliderSceneObj);
        this._spawnColorIndicator(sliderPosition, trackIndex);
    }

    /**
     * Apply gradient visual style to slider based on track color
     */
    private _applySliderVisual(slider: Slider, color: vec4) {
        const lightColor = new vec4(
            Math.min(1, color.r + 0.3),
            Math.min(1, color.g + 0.3),
            Math.min(1, color.b + 0.3),
            1
        );
        
        const darkColor = new vec4(
            color.r * 0.5,
            color.g * 0.5,
            color.b * 0.5,
            1
        );
        
        const white = new vec4(0.95, 0.95, 0.95, 1);
        
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
                    stop1: { enabled: true, percent: 0.3, color: color },
                    stop2: { enabled: true, percent: 0.7, color: color },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
            hover: {
                baseGradient: {
                    enabled: true,
                    type: "Rectangle",
                    stop0: { enabled: true, percent: 0, color: white },
                    stop1: { enabled: true, percent: 0.2, color: lightColor },
                    stop2: { enabled: true, percent: 0.6, color: color },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
            triggered: {
                baseGradient: {
                    enabled: true,
                    type: "Rectangle",
                    stop0: { enabled: true, percent: 0, color: lightColor },
                    stop1: { enabled: true, percent: 0.3, color: white },
                    stop2: { enabled: true, percent: 0.7, color: color },
                    stop3: { enabled: true, percent: 1.0, color: darkColor },
                },
            },
        };
        
        try {
            const customVisual = new RoundedRectangleVisual({
                sceneObject: slider.sceneObject,
                style: customStyle,
            });
            
            slider.visual = customVisual;
            slider.initialize();
        } catch (e) {
            // Fallback: use default slider visual
            slider.initialize();
        }
    }

    /**
     * Spawn color indicator sphere next to slider
     */
    private _spawnColorIndicator(sliderPosition: vec3, trackIndex: number) {
        if (!this._colorIndicatorPrefab) return;
        
        const colorManager = TrackColorManager.getInstance();
        if (!colorManager) return;
        
        const color = colorManager.getColorForTrack(trackIndex);
        const indicator = this._colorIndicatorPrefab.instantiate(null);
        
        const indicatorPos = sliderPosition.add(new vec3(-8, 0, 0));
        indicator.getTransform().setWorldPosition(indicatorPos);
        indicator.getTransform().setLocalScale(new vec3(0.5, 0.5, 0.5));
        
        const meshVisual = indicator.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        if (meshVisual?.mainMaterial) {
            const newMat = meshVisual.mainMaterial.clone();
            newMat.mainPass.baseColor = color;
            meshVisual.mainMaterial = newMat;
        }
        
        this._colorIndicators.push(indicator);
    }

    /**
     * Scale color indicator based on volume (visual feedback)
     */
    private _updateColorIndicator(trackIndex: number, volume: number) {
        if (trackIndex < 0 || trackIndex >= this._colorIndicators.length) return;
        
        const indicator = this._colorIndicators[trackIndex];
        if (!indicator) return;
        
        const scale = 0.5 + volume * 2.5;
        indicator.getTransform().setLocalScale(new vec3(scale, scale, scale));
    }

    /**
     * Build Lyria prompt from vibe, item, category, and BPM
     */
    private _buildPrompt(vibe: string, item: string, category: string, bpm: number): string {
        if (category === "Instruments") {
            return `30 second seamless loop, ${bpm} BPM, ${vibe} instrumental music featuring ${item}, high quality production`;
        }
        return `30 second seamless loop, ${bpm} BPM, ${vibe} ${item} instrumental track, high quality production`;
    }

    /**
     * Use Gemini to create optimized prompt from genre list (legacy method)
     */
    private async _combineGenresToPrompt(genres: string[]): Promise<{ prompt: string; displayTitle: string }> {
        const systemInstruction: GoogleGenAITypes.Common.Content = {
            role: "system",
            parts: [{
                text: "You are composing best-practice prompts for the Lyria music generation model. Given a list of genres, write ONE cohesive, evocative, FAMILY-FRIENDLY prompt that: (1) clearly states genre/style, (2) sets mood/ambience, (3) specifies tempo feel (e.g., fast/slow), (4) describes rhythm/beat, (5) names a few key instruments, (6) hints at arrangement/progression, (7) mentions space/ambience (e.g., reverb), and (8) uses production-quality adjectives (e.g., warm, gritty, polished). Default to an instrumental track (no vocals) unless explicitly asked. Keep it to 1–2 sentences, vivid but concise. Also provide a displayTitle of at most 4 simple words capturing the vibe. Output strictly JSON per the provided schema.",
            }],
        };

        const userContent: GoogleGenAITypes.Common.Content = {
            role: "user",
            parts: [{ text: "Combine these genres into one music prompt: " + genres.join(", ") }],
        };

        const geminiRequest: GoogleGenAITypes.Gemini.Models.GenerateContentRequest = {
            model: "gemini-2.5-flash-lite",
            type: "generateContent",
            body: {
                systemInstruction,
                contents: [userContent],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            prompt: { type: "STRING", description: "A single, cohesive prompt text to feed to a music generator (e.g., Lyria)" },
                            displayTitle: { type: "STRING", description: "A simple title (max 4 words) for UI display describing the combined vibe" },
                        },
                        required: ["prompt", "displayTitle"],
                    },
                    temperature: 0.6,
                    topP: 0.9,
                },
            },
        };

        try {
            const response = await GoogleGenAI.Gemini.models(geminiRequest);
            const text = response?.candidates?.[0]?.content?.parts
                ?.map((p) => p.text)
                .filter((t) => !!t)
                .join("\n") || "";

            const json = JSON.parse(text);
            if (json?.prompt && json?.displayTitle) {
                return { prompt: json.prompt, displayTitle: json.displayTitle };
            }
        } catch (e) {
            // Fallback to simple prompt
        }

        return { 
            prompt: genres.join(", ") + " instrumental track", 
            displayTitle: genres.slice(0, 4).join(" ") 
        };
    }
}