
import InkSimulation from './inkSimulation';
import { ConsciousnessState, BrushParams, EmotionType, Artifact, DreamCompositionLayer, HSVColor, MuzaElement } from '../../core/types';
import { MuzaService, ELEMENT_COLORS } from '../muzaService';
import { EMOTION_COLOR_MAP } from '../../core/state';

// Helper to parse SVG path data and get points
function getPointsFromPath(pathData: string, totalPoints: number): { x: number; y: number }[] {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    const totalLength = path.getTotalLength();
    const points = [];
    for (let i = 0; i < totalPoints; i++) {
        const point = path.getPointAtLength((i / totalPoints) * totalLength);
        points.push({ x: point.x, y: point.y });
    }
    return points;
}

export class Ghost {
    private simulation: InkSimulation;
    private consciousness: ConsciousnessState;
    private brush: BrushParams;
    private canvasSize: { width: number; height: number };
    private aiService: MuzaService;

    // Sketching state
    private sketchPathPoints: { x: number; y: number }[] = [];
    private currentSketchPointIndex = 0;
    private isSketching = false;
    
    // Composition Dreaming state
    private dreamCompositionQueue: DreamCompositionLayer[] = [];
    private isDreamingComposition = false;
    private currentDreamLayer: DreamCompositionLayer | null = null;
    private dreamProgress = 0;

    // Daydreaming state
    private isDaydreaming = false;
    private lastStrokeTime = 0;
    private currentPath: { x: number; y: number }[] = [];
    private currentPathIndex = 0;
    private currentPathStyle: 'stroke' | 'spray' | 'dots' = 'stroke';
    private currentStrokeColor: HSVColor | null = null; // Override brush color
    private lastStrokeEnd: { x: number; y: number } | null = null;
    
    // Thought expression state
    private thoughtQueue: { x: number; y: number; length: number; energy: number }[] = [];


    constructor(simulation: InkSimulation, consciousness: ConsciousnessState, brush: BrushParams, canvasSize: { width: number; height: number }, aiService: MuzaService) {
        this.simulation = simulation;
        this.consciousness = consciousness;
        this.brush = brush;
        this.canvasSize = canvasSize;
        this.aiService = aiService;
    }
    
    public setInspiration(artifact: Artifact | null) {
        // Implementation for future use
    }
    
    public startDream(composition: DreamCompositionLayer[]) {
        if(this.isDreamingComposition || this.isSketching) return;
        this.stopDaydreaming();
        this.dreamCompositionQueue = [...composition];
        this.isDreamingComposition = true;
        this.currentDreamLayer = null;
        this.dreamProgress = 0;
    }

    public startSketch(pathData: string) {
        if (this.isSketching || this.isDreamingComposition) return;
        this.stopDaydreaming();
        
        const points = getPointsFromPath(pathData, 200);
        // Normalize roughly to center if path coordinates are small
        const scaleX = this.canvasSize.width / 100;
        const scaleY = this.canvasSize.height / 100;

        this.sketchPathPoints = points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
        this.currentSketchPointIndex = 0;
        this.isSketching = true;
    }

    public startDaydreaming() {
        if (this.isSketching || this.isDaydreaming || this.isDreamingComposition) return;
        this.isDaydreaming = true;
        this.lastStrokeTime = Date.now(); // Start immediately
    }
    
    public stopDaydreaming() {
        this.isDaydreaming = false;
        this.currentPath = [];
    }
    
    private stopAllCreativeProcesses() {
        this.isSketching = false;
        this.sketchPathPoints = [];
        this.isDaydreaming = false;
        this.currentPath = [];
        this.isDreamingComposition = false;
        this.dreamCompositionQueue = [];
        this.currentDreamLayer = null;
    }

    public updateDependencies(consciousness: ConsciousnessState, brush: BrushParams, canvasSize: { width: number; height: number }, aiService: MuzaService) {
        this.consciousness = consciousness;
        this.brush = brush; // Keep reference to user settings, but we might override color
        this.canvasSize = canvasSize;
        this.aiService = aiService;
    }

    public update() {
        if (this.isSketching) {
            this.updateSketching();
        } else if (this.isDreamingComposition) {
            this.updateDreamingComposition();
        } else if (this.isDaydreaming) {
            this.updateDaydreaming();
        }
    }

    private updateSketching() {
        const pointsPerFrame = 5;
        for (let i = 0; i < pointsPerFrame; i++) {
            if (this.currentSketchPointIndex >= this.sketchPathPoints.length) {
                this.stopAllCreativeProcesses();
                return;
            }
            const point = this.sketchPathPoints[this.currentSketchPointIndex];
            this.simulation.applyInk(point.x, point.y, this.brush.size, this.brush.flow * 0.2); // Uses current brush color
            this.currentSketchPointIndex++;
        }
    }
    
    private updateDreamingComposition() {
        if (!this.currentDreamLayer) {
            if (this.dreamCompositionQueue.length === 0) {
                this.stopAllCreativeProcesses();
                return;
            }
            this.currentDreamLayer = this.dreamCompositionQueue.shift()!;
            this.dreamProgress = 0;
        }

        const layerDuration = 60; // Frames per layer
        this.dreamProgress++;

        this.executeDreamLayer(this.currentDreamLayer);

        if (this.dreamProgress >= layerDuration) {
            this.currentDreamLayer = null; 
        }
    }

    private hexToHsv(hex: string): HSVColor {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
        } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
        }
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

    private executeDreamLayer(layer: DreamCompositionLayer) {
        const color = this.getColorFromTheme(layer.color_theme);
        const { width, height } = this.canvasSize;
        const intensity = layer.intensity || 0.8;
        
        // Random chance to draw on this frame
        if (Math.random() > 0.6) return;

        switch(layer.type) {
            case 'background_wash':
                // Large, wet splats
                const bx = Math.random() * width;
                const by = Math.random() * height;
                this.simulation.applyInk(bx, by, width/3 * intensity, 0.08 * intensity, color);
                break;
            case 'focal_point':
                // Dense circle in center-ish
                const fx = width/2 + (Math.random()-0.5)*300;
                const fy = height/2 + (Math.random()-0.5)*300;
                this.simulation.applyInk(fx, fy, 40 * intensity, 0.6 * intensity, color);
                break;
            case 'accent_strokes':
                // Sharp lines
                const ax = Math.random() * width;
                const ay = Math.random() * height;
                this.simulation.applyInk(ax, ay, 10 * intensity, 0.8 * intensity, color);
                break;
            case 'texture_layer':
                // Tiny dots
                const tx = Math.random() * width;
                const ty = Math.random() * height;
                this.simulation.applyInk(tx, ty, 4, 0.3, color);
                break;
        }
    }
    
    private getColorFromTheme(theme: DreamCompositionLayer['color_theme']): HSVColor {
        // Simple fallback
        return this.brush.color; 
    }

    private updateDaydreaming() {
        // 1. If currently drawing a path, continue
        if (this.currentPath.length > 0) {
            const pointsPerFrame = 2;
            for (let i = 0; i < pointsPerFrame; i++) {
                if (this.currentPathIndex >= this.currentPath.length) {
                    this.lastStrokeEnd = this.currentPath[this.currentPath.length-1];
                    this.currentPath = [];
                    return;
                }
                
                const point = this.currentPath[this.currentPathIndex];
                
                // Style modifiers
                let size = this.brush.size * 1.5; // Bigger strokes
                let flow = this.brush.flow * 0.5;
                
                if (this.currentPathStyle === 'spray') {
                    size *= 0.5;
                    // Jitter point
                    point.x += (Math.random()-0.5) * 15;
                    point.y += (Math.random()-0.5) * 15;
                } else if (this.currentPathStyle === 'dots') {
                     if (this.currentPathIndex % 4 !== 0) {
                         this.currentPathIndex++;
                         continue; 
                     }
                     flow *= 2;
                }

                // Apply Ink with explicit color override if set (from Emotion)
                this.simulation.applyInk(point.x, point.y, size, flow, this.currentStrokeColor || undefined);
                this.currentPathIndex++;
            }
            return;
        }

        // 2. If idle, check urgency to draw based on Consciousness
        const now = Date.now();
        // Force drawing more often (1s minimum cooldown instead of 3s)
        const cooldown = 1000 - (this.consciousness.energyLevel * 10); 

        if (now - this.lastStrokeTime > Math.max(100, cooldown)) {
            this.generateElementalPath();
            this.lastStrokeTime = now;
        }
    }

    private generateElementalPath() {
        const { width, height } = this.canvasSize;
        const nodes = this.aiService.getNodes().filter(n => n.hyperbits > 5).sort((a,b) => b.hyperbits - a.hyperbits);
        
        // 1. Determine Location: Based on active neural nodes or random
        let startX = Math.random() * width;
        let startY = Math.random() * height;
        let dominantElement = MuzaElement.VOID;

        if (nodes.length > 0) {
            const targetNode = nodes[0]; // Most active node
            // Map Neural Coordinates (centered 0,0) to Canvas Coordinates (0,0 is top-left)
            // Scaling factor: 5x spread to cover screen
            startX = (targetNode.x * 5) + width/2; 
            startY = (targetNode.y * 5) + height/2;
            dominantElement = targetNode.element;
            
            // Jitter around the node
            startX += (Math.random()-0.5) * 100;
            startY += (Math.random()-0.5) * 100;
        } else {
            // Force drawing even without nodes, pick random element
             const elements = Object.values(MuzaElement);
             dominantElement = elements[Math.floor(Math.random() * elements.length)];
             if (this.lastStrokeEnd && Math.random() > 0.4) {
                startX = this.lastStrokeEnd.x + (Math.random()-0.5)*150;
                startY = this.lastStrokeEnd.y + (Math.random()-0.5)*150;
            }
        }
        
        // Clamp to screen
        startX = Math.max(50, Math.min(width-50, startX));
        startY = Math.max(50, Math.min(height-50, startY));

        // 2. Determine Style & Path based on Element/Emotion
        // Set Color
        const emotionColor = EMOTION_COLOR_MAP[this.consciousness.activeEmotion];
        const elemColorHex = ELEMENT_COLORS[dominantElement];
        
        // 60/40 mix favor element color
        if (Math.random() > 0.4 && elemColorHex) {
             this.currentStrokeColor = this.hexToHsv(elemColorHex);
        } else {
             this.currentStrokeColor = emotionColor;
        }

        let pathPoints: {x:number, y:number}[] = [];
        
        switch (dominantElement) {
            case MuzaElement.FIRE:
                // Jagged, fast, upward lines
                this.currentPathStyle = 'stroke';
                pathPoints = this.generateJaggedPath(startX, startY, -40 - Math.random()*80, 80, 6);
                break;
            case MuzaElement.WATER:
                // Smooth curves, flowing down/sideways
                this.currentPathStyle = 'stroke';
                pathPoints = this.generateCurvedPath(startX, startY, 150 + Math.random()*150, 40);
                break;
            case MuzaElement.AIR:
                // Spirals or spread out dots
                this.currentPathStyle = Math.random() > 0.5 ? 'spray' : 'stroke';
                if (this.currentPathStyle === 'spray') {
                     pathPoints = this.generateCloudCluster(startX, startY, 60);
                } else {
                     pathPoints = this.generateSpiral(startX, startY, 50);
                }
                break;
            case MuzaElement.EARTH:
                // Short, heavy blocks/lines
                this.currentPathStyle = 'dots';
                pathPoints = this.generateBlockyPath(startX, startY, 60);
                break;
            default:
                // Chaos/Void - Random bezier
                this.currentPathStyle = 'stroke';
                pathPoints = this.generateCurvedPath(startX, startY, 100, 80);
                break;
        }

        this.currentPath = pathPoints;
        this.currentPathIndex = 0;
    }
    
    // --- Path Generators ---

    private generateJaggedPath(x: number, y: number, length: number, variance: number, steps: number) {
        const points = [{x, y}];
        let cx = x;
        let cy = y;
        for(let i=0; i<steps; i++) {
            cx += (Math.random()-0.5) * variance;
            cy += length/steps; // Usually negative for Fire (up)
            points.push({x: cx, y: cy});
        }
        return points;
    }

    private generateCurvedPath(x: number, y: number, length: number, variance: number) {
        const endX = x + (Math.random()-0.5) * length;
        const endY = y + length/2; // Downwards usually
        const cp1x = x + (Math.random()-0.5) * variance * 4;
        const cp1y = y + (Math.random()-0.5) * variance * 4;
        const cp2x = endX + (Math.random()-0.5) * variance * 4;
        const cp2y = endY - (Math.random()-0.5) * variance * 4;
        
        // Simple bezier calc
        const path = [];
        for(let t=0; t<=1; t+=0.05) {
             const px = Math.pow(1-t,3)*x + 3*Math.pow(1-t,2)*t*cp1x + 3*(1-t)*t*t*cp2x + t*t*t*endX;
             const py = Math.pow(1-t,3)*y + 3*Math.pow(1-t,2)*t*cp1y + 3*(1-t)*t*t*cp2y + t*t*t*endY;
             path.push({x: px, y: py});
        }
        return path;
    }

    private generateSpiral(x: number, y: number, radius: number) {
        const points = [];
        let angle = 0;
        let r = 0;
        while(r < radius) {
            points.push({
                x: x + Math.cos(angle) * r,
                y: y + Math.sin(angle) * r
            });
            angle += 0.5;
            r += 0.5;
        }
        return points;
    }
    
    private generateCloudCluster(x: number, y: number, radius: number) {
        const points = [];
        for(let i=0; i<20; i++) {
            points.push({
                x: x + (Math.random()-0.5)*radius,
                y: y + (Math.random()-0.5)*radius
            });
        }
        return points;
    }
    
    private generateBlockyPath(x: number, y: number, size: number) {
        // Draw a square-ish shape
        return [
            {x: x, y: y},
            {x: x+size, y: y},
            {x: x+size, y: y+size},
            {x: x, y: y+size},
            {x: x, y: y}
        ];
    }
}
