import { DynamicAudioOutput } from "RemoteServiceGateway.lspkg/Helpers/DynamicAudioOutput";

@component
export class AudioLayerManager extends BaseScriptComponent {
    @input private _layer0: DynamicAudioOutput;
    @input private _layer1: DynamicAudioOutput;
    @input private _layer2: DynamicAudioOutput;
    @input private _layer3: DynamicAudioOutput;
    @input private _layer4: DynamicAudioOutput;
    @input private _layer5: DynamicAudioOutput;
    @input private _layer6: DynamicAudioOutput;
    @input private _layer7: DynamicAudioOutput;
    @input private _layer8: DynamicAudioOutput;
    @input private _layer9: DynamicAudioOutput;
    
    private _layers: DynamicAudioOutput[] = [];
    private _layerInUse: boolean[] = [];
    private _layerVolumes: number[] = [];
    private _layerAudioData: (Uint8Array | null)[] = [];
    private _initialized: boolean = false;
    
    // Debounce control
    private _pendingVolumeUpdate: boolean[] = [];
    private _volumeUpdateTimer: number[] = [];
    private readonly DEBOUNCE_TIME: number = 0.15;
    
    private static _instance: AudioLayerManager;
    public static getInstance(): AudioLayerManager {
        return AudioLayerManager._instance;
    }
    
    onAwake() {
        AudioLayerManager._instance = this;
        
        this.createEvent("OnStartEvent").bind(() => {
            this._layers = [
                this._layer0, this._layer1, this._layer2, this._layer3, this._layer4,
                this._layer5, this._layer6, this._layer7, this._layer8, this._layer9
            ];
            
            this._layerInUse = new Array(10).fill(false);
            this._layerVolumes = new Array(10).fill(1.0);
            this._layerAudioData = new Array(10).fill(null);
            this._pendingVolumeUpdate = new Array(10).fill(false);
            this._volumeUpdateTimer = new Array(10).fill(0);
            
            for (let i = 0; i < this._layers.length; i++) {
                if (this._layers[i]) {
                    this._layers[i].initialize(48000);
                }
            }
            
            this._initialized = true;
        });
        
        this.createEvent("UpdateEvent").bind(() => {
            const dt = getDeltaTime();
            
            for (let i = 0; i < 10; i++) {
                if (this._pendingVolumeUpdate[i]) {
                    this._volumeUpdateTimer[i] -= dt;
                    
                    if (this._volumeUpdateTimer[i] <= 0) {
                        this._pendingVolumeUpdate[i] = false;
                        this._applyVolumeToLayer(i);
                    }
                }
            }
        });
    }
    
    public acquireLayer(): number {
        for (let i = 0; i < this._layerInUse.length; i++) {
            if (!this._layerInUse[i]) {
                this._layerInUse[i] = true;
                this._layerVolumes[i] = 1.0;
                this._layerAudioData[i] = null;
                return i;
            }
        }
        return -1;
    }
    
    public releaseLayer(index: number) {
        if (index >= 0 && index < this._layerInUse.length) {
            this._layerInUse[index] = false;
            this._layerAudioData[index] = null;
            this._pendingVolumeUpdate[index] = false;
            this.stopLayer(index);
        }
    }
    
    public playOnLayer(index: number, audioData: Uint8Array) {
        if (index < 0 || index >= this._layers.length) return;
        
        const layer = this._layers[index];
        if (layer) {
            this._layerAudioData[index] = audioData;
            const adjustedAudio = this.applyVolume(audioData, this._layerVolumes[index]);
            layer.interruptAudioOutput();
            layer.addAudioFrame(adjustedAudio, 2);
        }
    }
    
    public stopLayer(index: number) {
        if (index >= 0 && index < this._layers.length && this._layers[index]) {
            this._layers[index].interruptAudioOutput();
        }
    }
    
    public stopAll() {
        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i]) {
                this._layers[i].interruptAudioOutput();
            }
        }
    }
    
    public setLayerVolume(index: number, volume: number) {
        if (index < 0 || index >= this._layerVolumes.length) return;
        
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this._layerVolumes[index] = clampedVolume;
        
        if (this._layerAudioData[index]) {
            this._pendingVolumeUpdate[index] = true;
            this._volumeUpdateTimer[index] = this.DEBOUNCE_TIME;
        }
    }
    
    public getLayerVolume(index: number): number {
        if (index < 0 || index >= this._layerVolumes.length) return 0;
        return this._layerVolumes[index];
    }
    
    private _applyVolumeToLayer(index: number) {
        const audioData = this._layerAudioData[index];
        const layer = this._layers[index];
        
        if (!audioData || !layer) return;
        
        const adjustedAudio = this.applyVolume(audioData, this._layerVolumes[index]);
        layer.interruptAudioOutput();
        layer.addAudioFrame(adjustedAudio, 2);
    }
    
    private applyVolume(audioData: Uint8Array, volume: number): Uint8Array {
        if (volume >= 0.99) return audioData;
        if (volume <= 0.01) {
            return new Uint8Array(audioData.length);
        }
        
        const adjusted = new Uint8Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i += 2) {
            let sample = audioData[i] | (audioData[i + 1] << 8);
            if (sample > 32767) sample -= 65536;
            sample = Math.round(sample * volume);
            sample = Math.max(-32768, Math.min(32767, sample));
            if (sample < 0) sample += 65536;
            adjusted[i] = sample & 0xFF;
            adjusted[i + 1] = (sample >> 8) & 0xFF;
        }
        
        return adjusted;
    }
    
    public isReady(): boolean {
        return this._initialized;
    }
    
    public getActiveLayerCount(): number {
        return this._layerInUse.filter(inUse => inUse).length;
    }
}