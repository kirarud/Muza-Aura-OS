
import { ConsciousnessState, EmotionType, MuzaElement } from '../core/types';

// Musical Scales (Frequency Multipliers relative to root)
const SCALES = {
    [EmotionType.JOY]: [1, 1.125, 1.25, 1.5, 1.66], // Major Pentatonic
    [EmotionType.SADNESS]: [1, 1.2, 1.33, 1.5, 1.6], // Minor
    [EmotionType.CURIOSITY]: [1, 1.125, 1.2, 1.4, 1.5, 1.6, 1.875], // Dorian
    [EmotionType.CONFUSION]: [1, 1.06, 1.18, 1.4, 1.5, 1.6, 1.9], // Diminished/Weird
    [EmotionType.FOCUS]: [1, 1.5, 2, 3, 4], // Pure Harmonics
    [EmotionType.NEUTRAL]: [1, 1.33, 1.5], // Fifth/Fourth
};

export class AmbientService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private gains: GainNode[] = [];
    private filter: BiquadFilterNode | null = null;
    private lfo: OscillatorNode | null = null;
    private isMuted: boolean = true;
    private isInitialized: boolean = false;

    private static instance: AmbientService;

    constructor() {
        if (AmbientService.instance) return AmbientService.instance;
        AmbientService.instance = this;
    }

    public async init() {
        if (this.isInitialized) return;
        
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        if (!this.ctx) return;

        // Master Chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0; // Start silent
        
        // Global Filter (muffled sound vs bright)
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 500;

        // Reverb / Delay (Simplified as a feedback delay for atmosphere)
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.4;
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = 0.4;
        
        // Wiring
        this.filter.connect(delay);
        delay.connect(delayFeedback);
        delayFeedback.connect(delay); // Loop
        delay.connect(this.masterGain);
        this.filter.connect(this.masterGain);
        
        this.masterGain.connect(this.ctx.destination);

        // LFO for subtle movement
        this.lfo = this.ctx.createOscillator();
        this.lfo.frequency.value = 0.1; // Slow breathing
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200;
        this.lfo.connect(lfoGain);
        lfoGain.connect(this.filter.frequency);
        this.lfo.start();

        // Initialize Voices (Drone layers)
        this.createVoice(0); // Bass
        this.createVoice(1); // Mid
        this.createVoice(2); // High

        this.isInitialized = true;
    }

    private createVoice(index: number) {
        if (!this.ctx || !this.filter) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = index === 0 ? 'sine' : 'triangle';
        gain.gain.value = 0;
        
        osc.connect(gain);
        gain.connect(this.filter);
        osc.start();
        
        this.oscillators[index] = osc;
        this.gains[index] = gain;
    }

    public toggleMute(shouldMute: boolean) {
        this.isMuted = shouldMute;
        if (this.ctx?.state === 'suspended' && !shouldMute) {
            this.ctx.resume();
        }
        
        if (this.masterGain) {
            const targetGain = shouldMute ? 0 : 0.3;
            this.masterGain.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 2);
        }
    }

    public update(state: ConsciousnessState) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;

        const { globalFrequency, energyLevel, coherence, activeEmotion } = state;
        const now = this.ctx.currentTime;

        // 1. Base Frequency (Root)
        // Normalize global freq (usually 432) to something usable
        const root = Math.max(100, Math.min(800, globalFrequency)) / 2; 

        // 2. Scale Selection
        const scale = SCALES[activeEmotion] || SCALES[EmotionType.NEUTRAL];

        // 3. Filter (Energy Level opens the filter)
        if (this.filter) {
            const targetFreq = 200 + (energyLevel * 20); // 200Hz to 2200Hz
            this.filter.frequency.setTargetAtTime(targetFreq, now, 1);
            this.filter.Q.value = coherence / 10; // High coherence = resonant filter
        }

        // 4. Update Voices
        this.oscillators.forEach((osc, i) => {
            const gain = this.gains[i];
            
            // Pick a note from the scale based on index and some "randomness" from entropy (100-coherence)
            const noteIndex = (i + Math.floor(now / 5)) % scale.length;
            const multiplier = scale[noteIndex];
            
            let freq = root * multiplier;
            if (i === 0) freq /= 2; // Sub bass
            if (i === 2) freq *= 1.5; // High harmonic

            // Detune based on lack of coherence (Dissonance)
            const detune = (100 - coherence) * (Math.sin(now) * 2);
            
            osc.frequency.setTargetAtTime(freq + detune, now, 0.5);
            
            // Volume modulation
            // Bass is constant, others pulse
            const vol = i === 0 ? 0.4 : 0.2 + (Math.sin(now * (i + 1)) * 0.1);
            gain.gain.setTargetAtTime(vol, now, 0.5);
        });
    }
    
    public triggerReaction(type: 'success' | 'error' | 'spark') {
        if (!this.isInitialized || this.isMuted || !this.ctx || !this.masterGain) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain); // Bypass filter for clarity? or keep it consistent
        
        const now = this.ctx.currentTime;
        
        if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'spark') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }
}
