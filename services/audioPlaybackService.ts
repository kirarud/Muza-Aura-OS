import { decode, decodeAudioData } from './ai/audioUtils';

export class AudioPlaybackService {
    private audioContext: AudioContext;
    private static instance: AudioPlaybackService;
    private isPlaying = false;

    constructor() {
        if (AudioPlaybackService.instance) {
            return AudioPlaybackService.instance;
        }
        this.audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        AudioPlaybackService.instance = this;
    }

    public async play(base64Audio: string): Promise<void> {
        if (this.isPlaying) {
            console.warn("Audio is already playing.");
            return;
        }
        
        this.isPlaying = true;
        
        try {
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, this.audioContext, 24000, 1);
            
            return new Promise((resolve) => {
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.audioContext.destination);
                
                source.onended = () => {
                    this.isPlaying = false;
                    resolve();
                };
                
                source.start();
            });

        } catch (error) {
            console.error("Failed to play audio:", error);
            this.isPlaying = false;
        }
    }
}