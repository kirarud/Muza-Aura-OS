
import { MuzaAINode, ConsciousnessType } from '../../core/types';

const TYPE_COLORS: { [key in ConsciousnessType]: [number, number, number] } = {
    [ConsciousnessType.SYSTEM]: [255, 105, 180], // Hot Pink
    [ConsciousnessType.IO]: [0, 255, 255],     // Cyan
    [ConsciousnessType.CONCEPT]: [147, 112, 219],// Medium Purple
    [ConsciousnessType.ACTION]: [50, 205, 50], // Lime Green
    [ConsciousnessType.QUALIFIER]: [255, 165, 0],// Orange
    [ConsciousnessType.ENTITY]: [211, 211, 211],// Light Grey
    [ConsciousnessType.MEMORY]: [255, 215, 0], // Gold
    [ConsciousnessType.PROCEDURE]: [74, 222, 128], // Green
};

export class OpticsEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Could not get 2D context for Optics Engine");
        }
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public render(nodes: MuzaAINode[]) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'lighter';

        nodes.forEach(node => {
            const [r, g, b] = TYPE_COLORS[node.type] || [255, 255, 255];
            const energyFactor = Math.min(node.hyperbits / 5, 1); // Normalize energy effect

            const radius = node.mass * 10 * (1 + energyFactor);
            const opacity = 0.05 + energyFactor * 0.1;

            const gradient = this.ctx.createRadialGradient(
                node.x + this.width / 2,
                node.y + this.height / 2,
                0,
                node.x + this.width / 2,
                node.y + this.height / 2,
                radius
            );

            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x + this.width / 2, node.y + this.height / 2, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}
