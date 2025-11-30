import { DynamicAudioOutput } from "RemoteServiceGateway.lspkg/Helpers/DynamicAudioOutput";

@component
export class MultiTrackMusicPlayer extends BaseScriptComponent {
    @input 
    private _dynamicAudioOutput: DynamicAudioOutput;
    
    private _decodedAudio: Uint8Array | null = null;
    private _isPlaying: boolean = false;
    private _isPaused: boolean = false;
    private _volume: number = 1.0;
    private _trackId: string = "";
    
    // Event for when track finishes (optional)
    public onTrackEnd: (() => void) | null = null;
    
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            if (this._dynamicAudioOutput) {
                this._dynamicAudioOutput.initialize(48000);
                print("[MultiTrackPlayer] Initialized: " + this._trackId);
            } else {
                print("[MultiTrackPlayer] ERROR: No DynamicAudioOutput!");
            }
        });
    }
    
    public setTrackId(id: string) {
        this._trackId = id;
    }
    
    public setAudioData(decodedAudio: Uint8Array) {
        this._decodedAudio = decodedAudio;
        print("[MultiTrackPlayer:" + this._trackId + "] Audio data set");
    }
    
    // Toggle play/pause
    public togglePlayPause(): boolean {
        if (this._isPlaying) {
            this.pause();
            return false; // Now paused
        } else {
            this.play();
            return true; // Now playing
        }
    }
    
    public play() {
        if (!this._dynamicAudioOutput || !this._decodedAudio) {
            print("[MultiTrackPlayer:" + this._trackId + "] Cannot play - no audio");
            return;
        }
        
        print("[MultiTrackPlayer:" + this._trackId + "] Playing");
        this._dynamicAudioOutput.addAudioFrame(this._decodedAudio, 2);
        this._isPlaying = true;
        this._isPaused = false;
    }
    
    public pause() {
        if (!this._dynamicAudioOutput) return;
        
        print("[MultiTrackPlayer:" + this._trackId + "] Paused");
        this._dynamicAudioOutput.interruptAudioOutput();
        this._isPlaying = false;
        this._isPaused = true;
    }
    
    public stop() {
        if (!this._dynamicAudioOutput) return;
        
        print("[MultiTrackPlayer:" + this._trackId + "] Stopped");
        this._dynamicAudioOutput.interruptAudioOutput();
        this._isPlaying = false;
        this._isPaused = false;
    }
    
    public isPlaying(): boolean {
        return this._isPlaying;
    }
    
    public isPaused(): boolean {
        return this._isPaused;
    }
    
    public setVolume(volume: number) {
        this._volume = Math.max(0, Math.min(1, volume));
        // Note: DynamicAudioOutput doesn't have runtime volume control
        // Volume would need to be applied when processing audio data
        print("[MultiTrackPlayer:" + this._trackId + "] Volume: " + this._volume);
    }
    
    public getVolume(): number {
        return this._volume;
    }
}