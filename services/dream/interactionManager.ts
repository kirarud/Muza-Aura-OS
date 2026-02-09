
import { MuzaService } from '../muzaService';
import InkSimulation from './inkSimulation';
import { BrushParams, MuzaAINode, ConsciousnessType, HSVColor, XPType } from '../../core/types';
import { XP_MAP } from '../../core/state';

type XpInfo = { type: XPType; amount: number };
type XpSource = keyof typeof XP_MAP | XpInfo;
type GrantXpCallback = (source: XpSource) => void;

const TYPE_COLORS: { [key in ConsciousnessType]?: [number, number, number] } = {
    [ConsciousnessType.SYSTEM]: [255, 105, 180],
    [ConsciousnessType.IO]: [0, 255, 255],
    [ConsciousnessType.CONCEPT]: [147, 112, 219],
    [ConsciousnessType.ACTION]: [50, 205, 50],
    [ConsciousnessType.QUALIFIER]: [255, 165, 0],
    [ConsciousnessType.ENTITY]: [211, 211, 211],
    [ConsciousnessType.MEMORY]: [255, 215, 0],
    [ConsciousnessType.PROCEDURE]: [74, 222, 128],
};

function rgbToHsv(r: number, g: number, b: number): HSVColor {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, v };
}


interface InteractionManagerOptions {
    canvas: HTMLCanvasElement;
    simulation: InkSimulation;
    aiService: MuzaService;
    brush: BrushParams;
    onGrantXp: GrantXpCallback;
    onInteractionStart: () => void;
    onInteractionEnd: () => void;
}

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    private simulation: InkSimulation;
    private aiService: MuzaService;
    private brush: BrushParams;
    private onGrantXp: GrantXpCallback;
    private onInteractionStart: () => void;
    private onInteractionEnd: () => void;

    private isDrawing = false;
    private draggedNodeId: string | null = null;

    constructor(options: InteractionManagerOptions) {
        this.canvas = options.canvas;
        this.simulation = options.simulation;
        this.aiService = options.aiService;
        this.brush = options.brush;
        this.onGrantXp = options.onGrantXp;
        this.onInteractionStart = options.onInteractionStart;
        this.onInteractionEnd = options.onInteractionEnd;
    }

    public updateBrush(newBrush: BrushParams) {
        this.brush = newBrush;
    }

    public handleMouseDown(event: MouseEvent) {
        this.onInteractionStart();
        const { mouseX, mouseY } = this.getCanvasCoordinates(event);
        const { simX, simY } = this.getSimulationCoordinates(mouseX, mouseY);

        const nodes = this.aiService.getNodes();
        const clickRadius = 30;
        let closestNode: MuzaAINode | null = null;
        let minDistance = Infinity;

        for (const node of nodes) {
            const dx = node.x - simX;
            const dy = node.y - simY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < clickRadius && distance < minDistance) {
                closestNode = node;
                minDistance = distance;
            }
        }

        if (closestNode) {
            this.draggedNodeId = closestNode.id;
            this.aiService.startManipulation(closestNode.id);
            this.onGrantXp({ type: 'curiosity', amount: 2 });
        } else {
            this.isDrawing = true;
            this.simulation.applyInk(mouseX, mouseY, this.brush.size, this.brush.flow);
        }
    }

    public handleMouseMove(event: MouseEvent) {
        if (!this.isDrawing && !this.draggedNodeId) return;

        const { mouseX, mouseY } = this.getCanvasCoordinates(event);

        if (this.draggedNodeId) {
            const { simX, simY } = this.getSimulationCoordinates(mouseX, mouseY);
            this.aiService.updateManipulationPosition(this.draggedNodeId, simX, simY);

            const node = this.aiService.getNodes().find(n => n.id === this.draggedNodeId);
            if (node) {
                const [r, g, b] = TYPE_COLORS[node.type] || [211, 211, 211];
                const hsvColor = rgbToHsv(r, g, b);
                const originalMass = node.mass / 5;
                const inkSize = originalMass * 2 + 2;
                const inkFlow = Math.min(node.hyperbits / 15, 1.0) * 0.1;
                this.simulation.applyInk(mouseX, mouseY, inkSize, inkFlow, hsvColor);
            }
        } else if (this.isDrawing) {
            this.simulation.applyInk(mouseX, mouseY, this.brush.size, this.brush.flow);
        }
    }

    public handleMouseUp() {
        if (this.draggedNodeId) {
            this.aiService.stopManipulation(this.draggedNodeId);
            this.draggedNodeId = null;
        }
        if (this.isDrawing) {
            this.isDrawing = false;
        }
        this.onInteractionEnd();
    }

    private getCanvasCoordinates(event: MouseEvent): { mouseX: number; mouseY: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            mouseX: event.clientX - rect.left,
            mouseY: event.clientY - rect.top
        };
    }
    
    private getSimulationCoordinates(mouseX: number, mouseY: number): { simX: number; simY: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            simX: mouseX - rect.width / 2,
            simY: mouseY - rect.height / 2
        };
    }
}
