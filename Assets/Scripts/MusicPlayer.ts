import { DynamicAudioOutput } from "RemoteServiceGateway.lspkg/Helpers/DynamicAudioOutput";

@component
export class MusicPlayer extends BaseScriptComponent {
    @input 
    private _dynamicAudioOutput: DynamicAudioOutput;

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            this._dynamicAudioOutput.initialize(48000);
            print("[MusicPlayer] Initialized");
        });
    }

    playAudio(uint8Array: Uint8Array) {
        print("[MusicPlayer] Playing audio");
        this._dynamicAudioOutput.interruptAudioOutput();
        this._dynamicAudioOutput.addAudioFrame(uint8Array, 2);
    }
    
    stopAudio() {
        print("[MusicPlayer] Stopping audio");
        this._dynamicAudioOutput.interruptAudioOutput();
    }
}