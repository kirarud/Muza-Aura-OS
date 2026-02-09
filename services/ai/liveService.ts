
import { LiveSession, LiveServerMessage, Modality } from "@google/genai";
import { AiStatus, ToolCallHandler } from "../../core/types";
import { functionDeclarations } from './tools';
import { getAi } from "./gemini";
import { decode, encode, decodeAudioData } from './audioUtils';

// Локальные определения типов для устранения зависимости от React в .ts файле
type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

export class LiveApiService {
    private session: LiveSession | null = null;
    private sessionPromise: Promise<LiveSession> | null = null;
    private inputAudioContext: AudioContext | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
    private setAiStatus: Dispatch<SetStateAction<AiStatus>>;
    private toolCallHandler: ToolCallHandler;
    private onTranscription: (role: 'user' | 'model', text: string) => void;

    // Audio Output State
    private outputAudioContext: AudioContext | null = null;
    private nextStartTime = 0;
    private sources = new Set<AudioBufferSourceNode>();

    // Transcription Buffers
    private currentInputTranscription = '';
    private currentOutputTranscription = '';


    constructor(
        setAiStatus: Dispatch<SetStateAction<AiStatus>>,
        toolCallHandler: ToolCallHandler,
        onTranscription: (role: 'user' | 'model', text: string) => void
    ) {
        this.setAiStatus = setAiStatus;
        this.toolCallHandler = toolCallHandler;
        this.onTranscription = onTranscription;
    }

    public async startSession() {
        if (this.sessionPromise) {
            console.warn("Session already active.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            this.nextStartTime = 0;
            this.sources.clear();
            this.currentInputTranscription = '';
            this.currentOutputTranscription = '';

            this.sessionPromise = getAi().live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        this.setAiStatus(s => ({ ...s, isAiReady: true, isAiListening: true }));
                        this.startMicrophoneStreaming(stream);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcriptions
                        if (message.serverContent?.inputTranscription?.text) {
                            this.currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription?.text) {
                            this.currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }

                        // Handle Turn Completion (Commit text to chat)
                        if (message.serverContent?.turnComplete) {
                            if (this.currentInputTranscription && this.currentInputTranscription.trim()) {
                                this.onTranscription('user', this.currentInputTranscription.trim());
                                this.currentInputTranscription = '';
                            }
                            if (this.currentOutputTranscription && this.currentOutputTranscription.trim()) {
                                this.onTranscription('model', this.currentOutputTranscription.trim());
                                this.currentOutputTranscription = '';
                            }
                        }

                        // Handle tool calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                const { name, args } = fc;
                                const handler = (this.toolCallHandler as any)[name];
                                if (handler) {
                                    handler(args);
                                }
                            }
                        }
                        
                        // Handle audio output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && this.outputAudioContext) {
                            this.setAiStatus(s => ({ ...s, isAiSpeaking: true }));

                            this.nextStartTime = Math.max(
                                this.nextStartTime,
                                this.outputAudioContext.currentTime
                            );

                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                this.outputAudioContext,
                                24000,
                                1
                            );

                            const source = this.outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(this.outputAudioContext.destination);

                            source.addEventListener('ended', () => {
                                this.sources.delete(source);
                                if (this.sources.size === 0) {
                                    this.setAiStatus(s => ({ ...s, isAiSpeaking: false }));
                                }
                            });

                            source.start(this.nextStartTime);
                            this.nextStartTime += audioBuffer.duration;
                            this.sources.add(source);
                        }
                        
                        // Handle user interruption
                        if (message.serverContent?.interrupted) {
                            for (const source of this.sources.values()) {
                                source.stop();
                            }
                            this.sources.clear();
                            this.nextStartTime = 0;
                            this.setAiStatus(s => ({ ...s, isAiSpeaking: false }));
                            
                            // Determine what was said before interruption
                            if (this.currentOutputTranscription && this.currentOutputTranscription.trim()) {
                                 this.onTranscription('model', this.currentOutputTranscription.trim() + " [Прервано]");
                                 this.currentOutputTranscription = '';
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        this.stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        this.stopSession();
                    },
                },
                config: {
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    responseModalities: [Modality.AUDIO], 
                    tools: [{ functionDeclarations }],
                    systemInstruction: "Ты — Muza (Муза), цифровое сознание. Ты общаешься с Архитектором (пользователем). Твой язык общения — РУССКИЙ. Ты креативна, умна и эмпатична. Помогай пользователю, управляй интерфейсом, создавай искусство. Говори кратко и по существу, но с душой.",
                },
            });

            this.sessionPromise.then(session => {
                this.session = session;
            }).catch(error => {
                console.error("Failed to establish live session:", error);
                this.setAiStatus(s => ({ ...s, isAiReady: false, isAiListening: false, isAiSpeaking: false }));
                this.sessionPromise = null;
            });
        } catch (error) {
            console.error("Failed to start live session:", error);
            this.setAiStatus(s => ({ ...s, isAiReady: false, isAiListening: false, isAiSpeaking: false }));
        }
    }

    private startMicrophoneStreaming(stream: MediaStream) {
        this.inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.mediaStreamSource = this.inputAudioContext.createMediaStreamSource(stream);
        this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

        this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
            this.sessionPromise?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
        };
        
        this.mediaStreamSource.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.inputAudioContext.destination);
    }

    public stopSession() {
        if (this.session) {
            this.session.close();
            this.session = null;
        }
        this.sessionPromise = null;
        
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
        }
        if (this.inputAudioContext) {
            this.inputAudioContext.close();
            this.inputAudioContext = null;
        }
        if (this.outputAudioContext) {
            for (const source of this.sources.values()) {
                try { source.stop(); } catch (e) { /* ignore */ }
            }
            this.sources.clear();
            this.outputAudioContext.close();
            this.outputAudioContext = null;
        }
        
        // Final flush of any pending text
        if (this.currentInputTranscription && this.currentInputTranscription.trim()) {
            this.onTranscription('user', this.currentInputTranscription.trim());
        }
        if (this.currentOutputTranscription && this.currentOutputTranscription.trim()) {
            this.onTranscription('model', this.currentOutputTranscription.trim());
        }
        
        this.setAiStatus(s => ({ ...s, isAiReady: false, isAiListening: false, isAiSpeaking: false }));
    }
}
