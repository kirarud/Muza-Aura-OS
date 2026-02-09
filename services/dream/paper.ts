// Simple procedural paper texture generator using simplex noise.
// In a real app, you might pre-generate these or use a more sophisticated method.

// Simplex noise implementation (a simple one)
function createNoise(random = Math.random) {
    // ... (a full simplex noise implementation would go here)
    // For brevity, we'll use a simpler pseudo-random generator.
    return (x: number, y: number) => {
        const r = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return r - Math.floor(r);
    };
}

const simplex = createNoise();

export function generatePaperTexture(width: number, height: number, roughness: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const intWidth = Math.floor(width);
    const intHeight = Math.floor(height);

    if (intWidth <= 0 || intHeight <= 0) {
        canvas.width = 1;
        canvas.height = 1;
        return canvas;
    }

    canvas.width = intWidth;
    canvas.height = intHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error("Could not create canvas context for paper texture");
    }

    const imageData = ctx.createImageData(intWidth, intHeight);
    const data = imageData.data;

    const scale = 0.05 * (1 + roughness * 4); // Roughness affects noise scale

    for (let y = 0; y < intHeight; y++) {
        for (let x = 0; x < intWidth; x++) {
            const i = (y * intWidth + x) * 4;
            // Simple multi-octave noise
            let noise = 0;
            let amp = 1;
            let freq = scale;
            for (let octave = 0; octave < 4; octave++) {
                noise += simplex(x * freq, y * freq) * amp;
                amp *= 0.5;
                freq *= 2.0;
            }
            
            const value = 235 + noise * 20 * roughness; // Base color + noise
            
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
            data[i + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}