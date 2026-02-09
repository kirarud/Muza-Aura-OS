
// --- Audio Decoding & Encoding Utilities ---

/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decode(base64: string): Uint8Array {
    if (!base64) return new Uint8Array(0);
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        return new Uint8Array(0);
    }
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 * The Gemini Live API returns raw PCM data, not a standard file format.
 */
export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // CRITICAL FIX: Prevent crashing on empty buffers
    if (!data || data.byteLength === 0) {
        // Return a silent 1-sample buffer to prevent downstream errors without crashing
        return ctx.createBuffer(numChannels, 1, sampleRate);
    }

    try {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        
        if (frameCount === 0) {
             return ctx.createBuffer(numChannels, 1, sampleRate);
        }

        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    } catch (e) {
        console.error("Audio buffer creation failed:", e);
        // Return silent buffer on error
        return ctx.createBuffer(numChannels, 1, sampleRate);
    }
}

/**
 * Encodes a Uint8Array into a base64 string.
 */
export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
