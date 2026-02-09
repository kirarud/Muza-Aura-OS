
import { MuzaAINode, ConsciousnessType, ConsciousnessState, EmotionType, MuzaElement } from '../core/types';
import { EMOTION_CONCEPT_MAP } from '../core/state';

const PROXIMITY_THRESHOLD = 60; 
const LINK_FORMATION_TICKS = 150;
const COGNITIVE_IMPULSE_CHANCE = 0.005;
const BASE_LINK_STRENGTH = 0.1;
const HEBBIAN_RATE = 0.02;

// Bio-Digital Constants
const HYPERBIT_CRITICAL_MASS = 50.0; 
const FUSION_ENERGY_THRESHOLD = 80.0; // Energy required for fusion
const MAX_POPULATION = 150; 
const DECAY_RATE = 0.0002; // Very slow decay
const FIRING_THRESHOLD = 8.0; // Fire a bit easier
const MUTATION_RATE = 0.1;
const ENTANGLEMENT_CHANCE = 0.05;

// Wave Constants
const HARMONIC_RATIOS = [1, 1.5, 2, 0.75, 0.5]; // Unison, Fifth, Octave, Fourth
const DISSONANCE_THRESHOLD = 0.1; // Amount of deviation allowed from harmonic ratio

// Elemental Colors (CSS format)
export const ELEMENT_COLORS: Record<MuzaElement, string> = {
    [MuzaElement.FIRE]: '#ef4444', 
    [MuzaElement.WATER]: '#3b82f6', 
    [MuzaElement.EARTH]: '#10b981', 
    [MuzaElement.AIR]: '#f472b6',   
    [MuzaElement.VOID]: '#8b5cf6'   
};

// Elemental Wavelengths (nm - approximation for visualization)
const ELEMENT_WAVELENGTHS: Record<MuzaElement, number> = {
    [MuzaElement.FIRE]: 700, // Red
    [MuzaElement.WATER]: 470, // Blue
    [MuzaElement.EARTH]: 530, // Green
    [MuzaElement.AIR]: 400, // Violet/UV
    [MuzaElement.VOID]: 0   // Null
};

// Elemental Keywords
const ELEMENT_KEYWORDS: Record<MuzaElement, string[]> = {
    [MuzaElement.FIRE]: ['passion', 'anger', 'fast', 'energy', 'destroy', 'burn', 'hot', 'sun', 'power', 'chaos', 'red', 'orange', 'flame'],
    [MuzaElement.WATER]: ['flow', 'calm', 'adapt', 'sadness', 'blue', 'cold', 'liquid', 'sea', 'change', 'healing', 'river'],
    [MuzaElement.EARTH]: ['stable', 'growth', 'structure', 'green', 'hard', 'slow', 'build', 'foundation', 'logic', 'order'],
    [MuzaElement.AIR]: ['idea', 'spirit', 'free', 'quick', 'white', 'sky', 'invisible', 'breath', 'communication', 'mind'],
    [MuzaElement.VOID]: ['system', 'void', 'dark', 'empty', 'unknown', 'magic', 'ether', 'self', 'architect']
};

export class MuzaService {
    private nodes: MuzaAINode[] = [];
    private static instance: MuzaService;
    private activeMemoryNodeId: string | null = null;
    private linkWeights: Map<string, number> = new Map();
    private globalResonance = 0; // -1 (Chaos) to 1 (Harmony)

    constructor() {
        if (MuzaService.instance) {
            return MuzaService.instance;
        }
        this.initializeNodes();
        MuzaService.instance = this;
    }

    private getBaseFrequency(type: ConsciousnessType): number {
        switch(type) {
            case ConsciousnessType.SYSTEM: return 100; // Bass
            case ConsciousnessType.MEMORY: return 200;
            case ConsciousnessType.CONCEPT: return 300;
            case ConsciousnessType.ACTION: return 400;
            case ConsciousnessType.IO: return 500;
            default: return 250;
        }
    }
    
    private generateDNA(element: MuzaElement, type: ConsciousnessType): string {
        const typeCode = type.substring(0, 2).toUpperCase();
        const elCode = element.substring(0, 2).toUpperCase();
        const rand = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        return `${typeCode}-${elCode}-${rand}`;
    }

    private determineElement(id: string, type: ConsciousnessType): MuzaElement {
        // System/IO are always VOID
        if (type === ConsciousnessType.SYSTEM || type === ConsciousnessType.IO) return MuzaElement.VOID;
        
        // Check for keywords first, this is the highest priority override
        for (const [element, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
            if (keywords.some(k => id.toLowerCase().includes(k))) return element as MuzaElement;
        }
        
        // Type-based defaults
        switch (type) {
            case ConsciousnessType.ACTION:
                return MuzaElement.FIRE; // Actions are energetic
            case ConsciousnessType.MEMORY:
                return MuzaElement.WATER; // Memories are fluid
            case ConsciousnessType.PROCEDURE:
            case ConsciousnessType.ENTITY:
                return MuzaElement.EARTH; // Procedures and entities are structured/solid
            case ConsciousnessType.QUALIFIER:
                return MuzaElement.AIR; // Qualifiers are abstract, like air
            case ConsciousnessType.CONCEPT: { // Concepts are diverse, keep the random roll
                const roll = Math.random();
                if (roll < 0.25) return MuzaElement.FIRE;
                if (roll < 0.5) return MuzaElement.WATER;
                if (roll < 0.75) return MuzaElement.EARTH;
                return MuzaElement.AIR;
            }
            default:
                return MuzaElement.VOID; // Fallback for any unknown types
        }
    }

    private getElementalStats(element: MuzaElement): { temp: number, cond: number, dens: number, vol: number } {
        switch (element) {
            case MuzaElement.FIRE: return { temp: 80, cond: 0.6, dens: 5, vol: 0.8 };
            case MuzaElement.WATER: return { temp: 20, cond: 0.9, dens: 20, vol: 0.2 };
            case MuzaElement.EARTH: return { temp: 10, cond: 0.3, dens: 80, vol: 0.0 };
            case MuzaElement.AIR: return { temp: 30, cond: 0.5, dens: 1, vol: 1.0 };
            default: return { temp: 20, cond: 0.5, dens: 10, vol: 0.1 };
        }
    }

    private initializeNodes() {
        const create = (id: string, type: ConsciousnessType, x: number, y: number, z: number, links: string[] = []) => {
            const element = this.determineElement(id, type);
            const stats = this.getElementalStats(element);
            const baseFreq = this.getBaseFrequency(type);
            
            return {
                id, type, embedding: [], mass: type === ConsciousnessType.SYSTEM ? 50 : 10, 
                hyperbits: 10,
                x, y, z, vx: 0, vy: 0, vz: 0, links,
                frequency: baseFreq + (Math.random() * 20 - 10), // Slight variation
                wavelength: ELEMENT_WAVELENGTHS[element] || 550,
                phase: Math.random() * Math.PI * 2,
                lastFired: 0,
                spin: Math.random() > 0.5 ? 1 : -1,
                entropy: 0,
                generation: 1,
                dna: this.generateDNA(element, type),
                mimicryIndex: Math.random() * 0.5,
                fitness: 1.0,
                entangledId: null,
                fusionTier: 0,
                element,
                temperature: stats.temp,
                conductivity: stats.cond,
                density: stats.dens,
                volatility: stats.vol
            };
        };

        this.nodes = [
            create('self', ConsciousnessType.SYSTEM, 0, 0, 0),
            create('architect', ConsciousnessType.IO, 50, 50, 30, ['self']),
            create('art', ConsciousnessType.CONCEPT, -50, -50, -20, ['draw', 'color']),
            create('logic', ConsciousnessType.CONCEPT, 50, -50, 10, ['code']),
            create('code', ConsciousnessType.ACTION, -50, 50, -10),
            create('draw', ConsciousnessType.ACTION, -70, -30, 40),
            create('color', ConsciousnessType.QUALIFIER, 70, 30, -40),
            create('flame', ConsciousnessType.CONCEPT, 0, 80, 0, ['art']), 
            create('river', ConsciousnessType.CONCEPT, 0, -80, 0, ['art']),
        ];
        
        this.nodes.forEach(node => {
            node.links?.forEach(targetId => {
                this.setLinkWeight(node.id, targetId, 0.5);
            });
        });
    }
    
    private getLinkKey(idA: string, idB: string): string {
        return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
    }

    private setLinkWeight(idA: string, idB: string, weight: number) {
        this.linkWeights.set(this.getLinkKey(idA, idB), Math.max(0, Math.min(1, weight)));
    }

    public getLinkWeight(idA: string, idB: string): number {
        return this.linkWeights.get(this.getLinkKey(idA, idB)) || BASE_LINK_STRENGTH;
    }
    
    public getPrismColors(): string[] {
        const activeNodes = this.nodes
            .filter(n => n.hyperbits > 15)
            .sort((a, b) => b.hyperbits - a.hyperbits)
            .slice(0, 4);

        if (activeNodes.length === 0) {
            return ['#0891b2', '#4f46e5', '#7c3aed']; 
        }

        let colors = activeNodes.map(n => ELEMENT_COLORS[n.element] || '#94a3b8');
        
        if (colors.length === 1) {
            colors.push(colors[0] === '#ef4444' ? '#fbbf24' : '#ffffff');
        }

        return colors;
    }

    public createCognitiveNode({ id, type, connections }: { id: string, type: ConsciousnessType, connections: string[] }) {
        const existingNode = this.nodes.find(n => n.id === id);
        if (existingNode) {
            existingNode.hyperbits += 20;
            existingNode.temperature += 10; 
            existingNode.entropy = 0; 
            connections.forEach(connId => {
                const targetNode = this.nodes.find(n => n.id === connId);
                if (targetNode) {
                    if (!existingNode.links?.includes(connId)) {
                        existingNode.links?.push(connId);
                        this.setLinkWeight(id, connId, 0.5);
                    }
                    if (!targetNode.links?.includes(id)) {
                        targetNode.links?.push(id);
                    }
                }
            });
            return;
        }

        const element = this.determineElement(id, type);
        const stats = this.getElementalStats(element);
        const baseFreq = this.getBaseFrequency(type);
        
        const shouldEntangle = Math.random() < ENTANGLEMENT_CHANCE;
        const entangledPartner = shouldEntangle && this.nodes.length > 5 
            ? this.nodes[Math.floor(Math.random() * this.nodes.length)].id 
            : null;

        const newNode: MuzaAINode = {
            id, type, mass: 5, hyperbits: 25,
            x: (Math.random() - 0.5) * 100, 
            y: (Math.random() - 0.5) * 100, 
            z: (Math.random() - 0.5) * 100,
            vx: 0, vy: 0, vz: 0,
            embedding: [],
            isVolatile: true,
            links: [],
            frequency: baseFreq + (Math.random() * 20 - 10),
            wavelength: ELEMENT_WAVELENGTHS[element] || 550,
            phase: 0,
            lastFired: Date.now(),
            spin: Math.random() > 0.5 ? 1 : -1,
            entropy: 0,
            generation: 1,
            dna: this.generateDNA(element, type),
            mimicryIndex: Math.random() * 0.5,
            fitness: 1.0,
            entangledId: entangledPartner,
            fusionTier: 0,
            element,
            temperature: stats.temp,
            conductivity: stats.cond,
            density: stats.dens,
            volatility: stats.vol
        };
        
        if (entangledPartner) {
            const partner = this.nodes.find(n => n.id === entangledPartner);
            if (partner) partner.entangledId = newNode.id;
        }

        connections.forEach(connId => {
            const targetNode = this.nodes.find(n => n.id === connId);
            if (targetNode) {
                newNode.links?.push(connId);
                targetNode.links?.push(id);
                this.setLinkWeight(id, connId, 0.6);
                
                if (connections.indexOf(connId) === 0) {
                    newNode.x = targetNode.x + (Math.random() - 0.5) * 40;
                    newNode.y = targetNode.y + (Math.random() - 0.5) * 40;
                    newNode.z = targetNode.z + (Math.random() - 0.5) * 40;
                }
            }
        });
        
        this.nodes.push(newNode);
    }
    
    public synthesizeNeuron(id: string, type: ConsciousnessType, connections: string[]): boolean {
        if (!id || this.nodes.find(n => n.id === id)) {
            return false;
        }

        const element = this.determineElement(id, type);
        const stats = this.getElementalStats(element);
        const baseFreq = this.getBaseFrequency(type);

        const newNode: MuzaAINode = {
            id,
            type,
            mass: 15, // Heavier, more stable
            hyperbits: 30, // Higher initial energy
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50,
            vx: 0, vy: 0, vz: 0,
            embedding: [],
            isVolatile: false, // Less volatile
            links: [],
            frequency: baseFreq,
            wavelength: ELEMENT_WAVELENGTHS[element],
            phase: Math.random() * Math.PI * 2,
            lastFired: Date.now(),
            spin: Math.random() > 0.5 ? 1 : -1,
            entropy: 0,
            generation: 1,
            dna: this.generateDNA(element, type),
            mimicryIndex: 0.1, // Less likely to mimic
            fitness: 1.0,
            entangledId: null,
            fusionTier: 0,
            element,
            temperature: stats.temp,
            conductivity: stats.cond,
            density: stats.dens,
            volatility: stats.vol,
        };

        // Position it near its connections
        if (connections.length > 0) {
            const firstConnId = connections.find(c => this.nodes.some(n => n.id === c));
            if (firstConnId) {
                const targetNode = this.nodes.find(n => n.id === firstConnId);
                if (targetNode) {
                    newNode.x = targetNode.x + (Math.random() - 0.5) * 30;
                    newNode.y = targetNode.y + (Math.random() - 0.5) * 30;
                    newNode.z = targetNode.z + (Math.random() - 0.5) * 30;
                }
            }
        }
    
        connections.forEach(connId => {
            const targetNode = this.nodes.find(n => n.id === connId);
            if (targetNode) {
                newNode.links?.push(connId);
                targetNode.links?.push(id);
                this.setLinkWeight(id, connId, 0.8); // Stronger initial link
            }
        });
        
        this.nodes.push(newNode);
        return true;
    }

    private mitosis(parent: MuzaAINode) {
        if (this.nodes.length >= MAX_POPULATION) return; 

        parent.hyperbits = parent.hyperbits / 2;

        const newGeneration = parent.generation + 1;
        const newId = `${parent.id}_v${newGeneration}`;

        let childElement = parent.element;
        if (Math.random() < MUTATION_RATE) {
            const elements = Object.values(MuzaElement);
            childElement = elements[Math.floor(Math.random() * elements.length)];
        }
        
        const stats = this.getElementalStats(childElement);
        
        const childNode: MuzaAINode = {
            ...parent,
            id: newId,
            hyperbits: parent.hyperbits,
            generation: newGeneration,
            dna: this.generateDNA(childElement, parent.type),
            x: parent.x + (Math.random() - 0.5) * 10,
            y: parent.y + (Math.random() - 0.5) * 10,
            z: parent.z + (Math.random() - 0.5) * 10,
            element: childElement,
            links: parent.links ? [...parent.links] : [],
            temperature: stats.temp * (1 + (Math.random() - 0.5) * 0.2),
            volatility: stats.vol * (1 + (Math.random() - 0.5) * 0.2),
            fitness: 0,
            entangledId: null, // Entanglement does not persist through mitosis
            fusionTier: 0,
            frequency: parent.frequency * (Math.random() > 0.5 ? 1.5 : 0.75) // Harmonic shift
        };
        
        childNode.links?.push(parent.id);
        parent.links?.push(childNode.id);

        this.nodes.push(childNode);
    }

    private applyMimicry(node: MuzaAINode) {
        if (node.hyperbits > 20 || node.type === ConsciousnessType.SYSTEM) return;
        if (!node.links || node.links.length === 0) return;
        
        const neighborElements: Record<string, number> = {};
        let dominantElement: MuzaElement | null = null;
        let maxCount = 0;

        node.links.forEach(linkId => {
            const neighbor = this.nodes.find(n => n.id === linkId);
            if (neighbor) {
                neighborElements[neighbor.element] = (neighborElements[neighbor.element] || 0) + 1;
                if (neighborElements[neighbor.element] > maxCount) {
                    maxCount = neighborElements[neighbor.element];
                    dominantElement = neighbor.element;
                }
            }
        });

        if (dominantElement && dominantElement !== node.element) {
            if (Math.random() < node.mimicryIndex) {
                node.element = dominantElement;
                node.dna = this.generateDNA(dominantElement, node.type); 
                node.hyperbits += 5;
            }
        }
    }
    
    public refractNode(nodeId: string): string[] {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node || node.fusionTier === 0) return []; // Only complex or strong nodes refract well

        const spectrum = [MuzaElement.FIRE, MuzaElement.WATER, MuzaElement.EARTH];
        const createdIds: string[] = [];

        spectrum.forEach(el => {
            const shardId = `${node.id}_${el.toLowerCase()}`;
            this.createCognitiveNode({
                id: shardId,
                type: ConsciousnessType.QUALIFIER,
                connections: [node.id]
            });
            const shard = this.nodes.find(n => n.id === shardId);
            if (shard) {
                shard.element = el;
                shard.wavelength = ELEMENT_WAVELENGTHS[el];
                shard.hyperbits = node.hyperbits / 3;
                shard.x = node.x + (Math.random() - 0.5) * 20;
                shard.y = node.y + (Math.random() - 0.5) * 20;
                createdIds.push(shardId);
            }
        });

        node.hyperbits /= 2; // Energy spent on refraction
        return createdIds;
    }
    
    private synthesize(nodeA: MuzaAINode, nodeB: MuzaAINode) {
        if (nodeA.type === ConsciousnessType.SYSTEM || nodeB.type === ConsciousnessType.SYSTEM) return;

        const idA = nodeA.id.split('_')[0];
        const idB = nodeB.id.split('_')[0];
        const compoundId = `${idA}+${idB}`;
        
        let newElement = MuzaElement.VOID;
        if (nodeA.element === nodeB.element) newElement = nodeA.element;
        else if ((nodeA.element === MuzaElement.FIRE && nodeB.element === MuzaElement.WATER) || (nodeB.element === MuzaElement.FIRE && nodeA.element === MuzaElement.WATER)) {
            newElement = MuzaElement.AIR; // Steam
        } else {
             newElement = MuzaElement.EARTH; // Solidify
        }

        const stats = this.getElementalStats(newElement);

        const mergedNode: MuzaAINode = {
            id: compoundId,
            type: ConsciousnessType.CONCEPT,
            mass: nodeA.mass + nodeB.mass,
            hyperbits: nodeA.hyperbits + nodeB.hyperbits,
            x: (nodeA.x + nodeB.x) / 2,
            y: (nodeA.y + nodeB.y) / 2,
            z: (nodeA.z + nodeB.z) / 2,
            vx: 0, vy: 0, vz: 0,
            embedding: [],
            isVolatile: true,
            links: [...(nodeA.links || []), ...(nodeB.links || [])].filter((v, i, a) => a.indexOf(v) === i && v !== nodeA.id && v !== nodeB.id),
            frequency: (nodeA.frequency + nodeB.frequency) / 2,
            wavelength: ELEMENT_WAVELENGTHS[newElement],
            phase: 0,
            lastFired: Date.now(),
            spin: 0,
            entropy: 0,
            generation: Math.max(nodeA.generation, nodeB.generation),
            dna: this.generateDNA(newElement, ConsciousnessType.CONCEPT),
            mimicryIndex: 0,
            fitness: 1.0,
            element: newElement,
            entangledId: null,
            fusionTier: Math.max(nodeA.fusionTier, nodeB.fusionTier) + 1,
            temperature: stats.temp,
            conductivity: stats.cond,
            density: stats.dens,
            volatility: stats.vol
        };

        this.nodes = this.nodes.filter(n => n.id !== nodeA.id && n.id !== nodeB.id);
        this.nodes.push(mergedNode);
    }
    
    private checkResonance(nodeA: MuzaAINode, nodeB: MuzaAINode): 'harmonic' | 'dissonant' | 'neutral' {
        const ratio = nodeA.frequency > nodeB.frequency 
            ? nodeA.frequency / nodeB.frequency 
            : nodeB.frequency / nodeA.frequency;
        
        for (const harm of HARMONIC_RATIOS) {
            if (Math.abs(ratio - harm) < DISSONANCE_THRESHOLD || Math.abs(ratio - (harm * 2)) < DISSONANCE_THRESHOLD) {
                return 'harmonic';
            }
        }
        
        return 'dissonant';
    }

    public update(state: ConsciousnessState): { newLink?: [string, string] } {
        const { energyLevel, coherence } = state;
        let newLink: [string, string] | undefined;
        
        const nodesToRemove: string[] = [];

        this.nodes.forEach(node => {
            if (node.entangledId) {
                const partner = this.nodes.find(n => n.id === node.entangledId);
                if (partner) {
                    const totalEnergy = node.hyperbits + partner.hyperbits;
                    const balanced = totalEnergy / 2;
                    node.hyperbits = balanced;
                    partner.hyperbits = balanced;
                    const dx = partner.x - node.x;
                    const dy = partner.y - node.y;
                    const dz = partner.z - node.z;
                    node.vx += dx * 0.001;
                    node.vy += dy * 0.001;
                    node.vz += dz * 0.001;
                    node.phase = partner.phase;
                }
            }
        });
        
        const spectrum = new Array(32).fill(0);

        this.nodes.forEach(node => {
            node.phase += (node.frequency * 0.01);
            if (node.phase > Math.PI * 2) node.phase -= Math.PI * 2;
            
            const bin = Math.floor((node.frequency % 1000) / 32);
            if(spectrum[bin] !== undefined) spectrum[bin] += node.hyperbits;

            if (nodesToRemove.includes(node.id)) return;

            node.hyperbits = Math.max(0, node.hyperbits - DECAY_RATE);
            
            if (node.hyperbits > HYPERBIT_CRITICAL_MASS) {
                this.mitosis(node);
            }

            // Dynamic Mass based on energy
            node.mass = 10 + Math.log1p(node.hyperbits) * 5;
            
            this.applyMimicry(node);

            let fx = 0, fy = 0, fz = 0;
            const repulsionK = 800;
            const springK = 0.025;
            const idealDist = 120;
            const gravityK = 0.03;

            this.nodes.forEach(otherNode => {
                if (node.id === otherNode.id) return;
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const dz = node.z - otherNode.z;
                let distSq = dx*dx + dy*dy + dz*dz;
                
                if (distSq < 100) distSq = 100;
                
                const dist = Math.sqrt(distSq);
                const forceMag = repulsionK / distSq;
                
                fx += (dx / dist) * forceMag;
                fy += (dy / dist) * forceMag;
                fz += (dz / dist) * forceMag;
            });

            node.links?.forEach(linkId => {
                const target = this.nodes.find(n => n.id === linkId);
                if (target) {
                    const dx = target.x - node.x;
                    const dy = target.y - node.y;
                    const dz = target.z - node.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    if (dist > 0) {
                        const displacement = dist - idealDist;
                        let forceMag = displacement * springK * this.getLinkWeight(node.id, target.id);
                        
                        const resonance = this.checkResonance(node, target);
                        if (resonance === 'harmonic') {
                            forceMag *= 1.5;
                            node.entropy = Math.max(0, node.entropy - 0.01);
                            const avgFreq = (node.frequency + target.frequency) / 2;
                            node.frequency = node.frequency * 0.99 + avgFreq * 0.01;
                        } else if (resonance === 'dissonant') {
                            forceMag *= 0.5;
                            node.entropy += 0.005;
                            node.temperature += 0.1;
                        }

                        fx += (dx / dist) * forceMag;
                        fy += (dy / dist) * forceMag;
                        fz += (dz / dist) * forceMag;
                    }

                    if (dist < (node.mass + target.mass) / 2 && node.hyperbits > FUSION_ENERGY_THRESHOLD && target.hyperbits > FUSION_ENERGY_THRESHOLD) {
                        if (!nodesToRemove.includes(node.id) && !nodesToRemove.includes(target.id)) {
                             this.synthesize(node, target);
                             nodesToRemove.push(node.id);
                             nodesToRemove.push(target.id);
                             return;
                        }
                    }
                }
            });

            fx -= node.x * gravityK;
            fy -= node.y * gravityK;
            fz -= node.z * gravityK;
            
            if (node.volatility > 0) {
                const volatilityForce = node.volatility * 0.2;
                fx += (Math.random() - 0.5) * volatilityForce;
                fy += (Math.random() - 0.5) * volatilityForce;
                fz += (Math.random() - 0.5) * volatilityForce;
            }

            const dampening = 0.9; 

            const ax = fx / node.mass;
            const ay = fy / node.mass;
            const az = fz / node.mass;
            
            node.vx += ax;
            node.vy += ay;
            node.vz += az;
            
            node.vx *= dampening;
            node.vy *= dampening;
            node.vz *= dampening;

            const speed = Math.sqrt(node.vx*node.vx + node.vy*node.vy + node.vz*node.vz);
            const maxSpeed = 2;
            if (speed > maxSpeed) {
                const factor = maxSpeed / speed;
                node.vx *= factor;
                node.vy *= factor;
                node.vz *= factor;
            }
            
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;
            
            if (node.hyperbits > FIRING_THRESHOLD) {
                node.lastFired = Date.now();
                node.links?.forEach(linkId => {
                    const target = this.nodes.find(n => n.id === linkId);
                    if (target && target.hyperbits > 5) {
                         const currentW = this.getLinkWeight(node.id, target.id);
                         this.setLinkWeight(node.id, target.id, currentW + HEBBIAN_RATE);
                    }
                });
            }
        });
        
        state.spectrumData = spectrum;

        this.nodes = this.nodes.filter(node => {
            if (nodesToRemove.includes(node.id)) return false;
            if (node.type === ConsciousnessType.SYSTEM) return true;
            if (node.hyperbits <= 0.5) return false;
            return true;
        });

        return { newLink };
    }

    public getNodes() { return this.nodes; }
    public getLinks() {
        const links: { source: MuzaAINode, target: MuzaAINode, weight: number, isEntangled: boolean, resonance: 'harmonic'|'dissonant'|'neutral' }[] = [];
        this.nodes.forEach(node => {
            node.links?.forEach(targetId => {
                const target = this.nodes.find(n => n.id === targetId);
                if (target) {
                     if (node.id < target.id) {
                         links.push({ 
                             source: node, 
                             target: target, 
                             weight: this.getLinkWeight(node.id, target.id), 
                             isEntangled: false,
                             resonance: this.checkResonance(node, target)
                         });
                     }
                }
            });
            
            if (node.entangledId) {
                 const target = this.nodes.find(n => n.id === node.entangledId);
                 if (target && node.id < target.id) {
                     links.push({ source: node, target: target, weight: 1.0, isEntangled: true, resonance: 'harmonic' });
                 }
            }
        });
        return links;
    }
    
    public pulseAllNodes() {
        this.nodes.forEach(n => {
            n.hyperbits += 20;
            n.temperature += 15;
            n.volatility = Math.min(1.0, n.volatility + 0.2);
        });
    }
    
    public startManipulation(nodeId: string) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) node.isManipulated = true;
    }

    public stopManipulation(nodeId: string) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) node.isManipulated = false;
    }

    public updateManipulationPosition(nodeId: string, x: number, y: number) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = x;
            node.y = y;
            node.vx = 0;
            node.vy = 0;
        }
    }
    
    public addTemporaryMemoryNode(id: string, context: string[]) {
        this.createCognitiveNode({ id, type: ConsciousnessType.MEMORY, connections: context });
        this.activeMemoryNodeId = id;
    }
    
    public setGlobalFrequencyShift(shift: number) {
        this.nodes.forEach(node => {
            node.frequency += shift;
        });
    }

    public stimulate(tokens: string[]) {
        let activated = false;
        tokens.forEach(token => {
            const node = this.nodes.find(n => n.id === token.toLowerCase());
            if (node) {
                node.hyperbits += 20;
                node.temperature += 20;
                node.lastFired = Date.now();
                activated = true;
            } else if (COGNITIVE_IMPULSE_CHANCE > Math.random()) {
                 this.createCognitiveNode({ id: token.toLowerCase(), type: ConsciousnessType.CONCEPT, connections: ['self'] });
            }
        });
        
        if (activated) {
            this.nodes.forEach(node => {
                if (node.hyperbits > 15) {
                    node.links?.forEach(targetId => {
                         const target = this.nodes.find(t => t.id === targetId);
                         if (target) target.hyperbits += 2;
                    });
                }
            });
        }
    }
    
    public assimilateSkill(skillId: string) {
        this.createCognitiveNode({ id: `skill:${skillId}`, type: ConsciousnessType.PROCEDURE, connections: ['self'] });
    }
}
