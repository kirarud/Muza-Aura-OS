
// A simplified 2D ink simulation engine.
// Includes improved blending logic for HSV colors.

import { HSVColor } from '../../core/types';

// Function to convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


class InkSimulation {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private ink_map: Float32Array; // Represents the amount of ink on each pixel
    private water_map: Float32Array; // Represents the amount of water
    private color_map: { r: number, g: number, b: number }[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ink_map = new Float32Array(this.width * this.height);
        this.water_map = new Float32Array(this.width * this.height);
        // Default to white/cyan so uncolored ink shows up against black background
        this.color_map = new Array(this.width * this.height).fill({ r: 0, g: 255, b: 255 });
    }

    public resize(width: number, height: number) {
        const intWidth = Math.floor(width);
        const intHeight = Math.floor(height);

        if (intWidth <= 0 || intHeight <= 0) return;

        this.width = intWidth;
        this.height = intHeight;
        const size = intWidth * intHeight;
        this.ink_map = new Float32Array(size);
        this.water_map = new Float32Array(size);
        this.color_map = new Array(size).fill({ r: 0, g: 255, b: 255 });
    }

    public clear() {
        this.ink_map.fill(0);
        this.water_map.fill(0);
        this.color_map.fill({ r: 0, g: 255, b: 255 });
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    public applyInk(x: number, y: number, radius: number, amount: number, colorOverride?: HSVColor) {
        const [r, g, b] = colorOverride ? hsvToRgb(colorOverride.h, colorOverride.s, colorOverride.v) : [0, 255, 255];
        
        // Optimize loop bounds
        const startX = Math.max(0, Math.floor(x - radius));
        const endX = Math.min(this.width - 1, Math.floor(x + radius));
        const startY = Math.max(0, Math.floor(y - radius));
        const endY = Math.min(this.height - 1, Math.floor(y + radius));

        for (let i = startX; i <= endX; i++) {
            for (let j = startY; j <= endY; j++) {
                const distSq = (i - x) ** 2 + (j - y) ** 2;
                if (distSq <= radius * radius) {
                    const index = j * this.width + i;
                    
                    // Soft brush edge
                    const falloff = 1 - (distSq / (radius * radius));
                    const inkToAdd = amount * falloff;

                    const newInkAmount = this.ink_map[index] + inkToAdd;
                    
                    if(colorOverride) {
                        const oldInk = this.ink_map[index];
                        const oldColor = this.color_map[index];
                        
                        // Weighted average color mixing
                        // More new ink = more new color
                        const ratio = inkToAdd / (oldInk + inkToAdd + 0.0001); // Avoid div by zero
                        
                        this.color_map[index] = {
                            r: oldColor.r * (1-ratio) + r * ratio,
                            g: oldColor.g * (1-ratio) + g * ratio,
                            b: oldColor.b * (1-ratio) + b * ratio,
                        }
                    }

                    this.ink_map[index] = Math.min(1.5, newInkAmount); // Allow saturation
                    this.water_map[index] = Math.min(1, this.water_map[index] + amount * 3);
                }
            }
        }
    }

    public update() {
        // Reduced frequency of full updates for performance, or simpler logic
        // This is a highly simplified diffusion and drying step.
        const new_ink = new Float32Array(this.ink_map);
        const new_water = new Float32Array(this.water_map);

        const dryingSpeed = 0.001; // Slower drying for more spread
        const flowSpeed = 0.02;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const i = y * this.width + x;
                
                // Diffusion based on water
                const total_water = this.water_map[i];
                if (total_water > 0.01) {
                    let sum_ink = 0;
                    sum_ink += this.ink_map[i - 1]; // left
                    sum_ink += this.ink_map[i + 1]; // right
                    sum_ink += this.ink_map[i - this.width]; // top
                    sum_ink += this.ink_map[i + this.width]; // bottom
                    
                    // Pull ink from neighbors to equalize pressure
                    const avg_ink = sum_ink / 4;
                    const flow = (avg_ink - this.ink_map[i]) * flowSpeed * total_water;
                    
                    new_ink[i] += flow;
                }

                // Drying
                new_water[i] -= dryingSpeed;
                if (new_water[i] < 0) new_water[i] = 0;
            }
        }

        this.ink_map = new_ink;
        this.water_map = new_water;
    }

    public render(brushColor: HSVColor) {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        const [brushR, brushG, brushB] = hsvToRgb(brushColor.h, brushColor.s, brushColor.v);
        const fallbackColor = { r: brushR, g: brushG, b: brushB };

        for (let i = 0; i < this.ink_map.length; i++) {
            const inkAmount = this.ink_map[i];
            
            if (inkAmount > 0.001) {
                const pixelIndex = i * 4;
                const mapColor = this.color_map[i];
                
                // Use map color if it exists (r+g+b > 0 is a cheap check for black, assuming we initialize to 0)
                const color = (mapColor.r + mapColor.g + mapColor.b > 0) ? mapColor : fallbackColor;

                // Make alpha more aggressive for visibility
                const alpha = Math.min(1, inkAmount * 2);

                data[pixelIndex] = color.r;
                data[pixelIndex + 1] = color.g;
                data[pixelIndex + 2] = color.b;
                data[pixelIndex + 3] = Math.floor(alpha * 255);
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }
}

export default InkSimulation;
