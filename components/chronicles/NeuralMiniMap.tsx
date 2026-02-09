
import React, { useEffect, useRef } from 'react';
import { MuzaService } from '../../services/muzaService';
import { MuzaElement } from '../../core/types';
import InkSimulation from '../../services/dream/inkSimulation';
import * as d3 from 'd3';

interface NeuralMiniMapProps {
    aiService: MuzaService;
}

const ELEMENT_COLORS: Record<MuzaElement, string> = {
    [MuzaElement.FIRE]: '#ef4444', // Красный
    [MuzaElement.WATER]: '#3b82f6', // Синий
    [MuzaElement.EARTH]: '#10b981', // Изумрудный
    [MuzaElement.AIR]: '#f472b6', // Розовый
    [MuzaElement.VOID]: '#94a3b8' // Серый
};

// Преобразование стихии в HSV для движка чернил
const ELEMENT_HSV: Record<MuzaElement, { h: number, s: number, v: number }> = {
    [MuzaElement.FIRE]: { h: 0, s: 0.8, v: 1.0 },
    [MuzaElement.WATER]: { h: 210, s: 0.8, v: 1.0 },
    [MuzaElement.EARTH]: { h: 150, s: 0.7, v: 0.8 },
    [MuzaElement.AIR]: { h: 300, s: 0.3, v: 1.0 },
    [MuzaElement.VOID]: { h: 0, s: 0, v: 0.5 },
};

const NeuralMiniMap: React.FC<NeuralMiniMapProps> = ({ aiService }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const simulationRef = useRef<InkSimulation | null>(null);

    useEffect(() => {
        if (!svgRef.current || !canvasRef.current) return;

        // --- 1. Настройка симуляции жидкости ---
        const width = 250;
        const height = 250;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 0.6; // Масштабирование пространства нейросети

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        if (!simulationRef.current) {
            simulationRef.current = new InkSimulation(canvasRef.current);
        }

        // --- 2. Настройка D3 слоя (Вектор) ---
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        const g = svg.append("g");
        
        let animationId: number;

        const render = () => {
            const nodes = aiService.getNodes();
            const links = aiService.getLinks();

            // --- A. Шаг Физики Жидкости ---
            const sim = simulationRef.current;
            if (sim) {
                // Впрыскиваем "чернила" в позиции активных узлов
                nodes.forEach(node => {
                    // Только узлы с энергией оставляют след
                    if (node.hyperbits > 5) {
                        const mapX = centerX + node.x * scale;
                        const mapY = centerY + node.y * scale;

                        // Проверка границ
                        if (mapX > 0 && mapX < width && mapY > 0 && mapY < height) {
                            const element = node.element || MuzaElement.VOID;
                            const hsv = ELEMENT_HSV[element];
                            
                            // Количество чернил зависит от энергии (hyperbits)
                            const amount = (node.hyperbits / 100) * 0.05; 
                            // Радиус пятна зависит от массы
                            const radius = Math.max(1, (node.mass / 10));

                            sim.applyInk(mapX, mapY, radius, amount, hsv);
                        }
                    }
                });

                sim.update();
                // Рендерим симуляцию. Цвет кисти тут не важен, так как мы используем override внутри applyInk
                sim.render({ h: 0, s: 0, v: 0 }); 
            }

            // --- B. Шаг Векторной Графики (Overlay) ---
            
            // Рендер связей
            const linkSel = g.selectAll("line.mini-link")
                .data(links, (d: any) => `${d.source.id}-${d.target.id}`);

            linkSel.enter().append("line")
                .attr("class", "mini-link")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.3)
                .merge(linkSel as any)
                .attr("x1", (d: any) => centerX + d.source.x * scale)
                .attr("y1", (d: any) => centerY + d.source.y * scale)
                .attr("x2", (d: any) => centerX + d.target.x * scale)
                .attr("y2", (d: any) => centerY + d.target.y * scale)
                .attr("stroke", (d: any) => d.weight > 0.5 ? '#fff' : '#555');
            
            linkSel.exit().remove();

            // Рендер узлов
            const nodeSel = g.selectAll("circle.mini-node")
                .data(nodes, (d: any) => d.id);

            nodeSel.enter().append("circle")
                .attr("class", "mini-node")
                .merge(nodeSel as any)
                .attr("cx", (d: any) => centerX + d.x * scale)
                .attr("cy", (d: any) => centerY + d.y * scale)
                .attr("r", (d: any) => Math.max(2, d.mass * 0.15))
                .attr("fill", (d: any) => ELEMENT_COLORS[d.element as MuzaElement])
                .attr("opacity", 1)
                .attr("stroke", "#000")
                .attr("stroke-width", 1);

            nodeSel.exit().remove();

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [aiService]);

    return (
        <div className="w-[250px] h-[250px] pointer-events-none select-none relative">
            {/* Слой Жидкости (Фон) */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen rounded-full filter blur-[2px]"
            />
            
            {/* Векторный слой (Узлы и связи) */}
            <svg 
                ref={svgRef} 
                width="100%" 
                height="100%" 
                className="absolute inset-0 overflow-visible" 
            />
            
            {/* Стеклянный блик (Эффект сферы) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none border border-white/10 shadow-xl shadow-black/50"></div>
        </div>
    );
};

export default NeuralMiniMap;
