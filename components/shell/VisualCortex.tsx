
import React, { useEffect, useRef } from 'react';
import { ConsciousnessState, EmotionType } from '../../core/types';
import { MuzaService } from '../../services/muzaService';

interface VisualCortexProps {
    consciousness: ConsciousnessState;
    aiService: MuzaService;
}

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseSize: number;
    s: number;
};

const VisualCortex: React.FC<VisualCortexProps> = ({ consciousness, aiService }) => {
    const { coherence, energyLevel, spectrumData } = consciousness;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
    const frameRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);

    // Canvas Particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesRef.current = Array.from({ length: 50 }, () => {
                const baseSize = Math.random() * 2.5;
                return {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    baseSize: baseSize,
                    s: baseSize
                };
            });
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            if (!canvasRef.current || !ctx) return; // Guard against unmount
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 1. Prism Logic: Dynamically update blob colors based on active thoughts
            const prismColors = aiService.getPrismColors();
            blobRefs.current.forEach((blob, i) => {
                if (blob) {
                    const color = prismColors[i % prismColors.length];
                    blob.style.backgroundColor = color;
                    blob.style.boxShadow = `0 0 60px 20px ${color}`;
                }
            });

            // 2. Particle Logic
            const jitter = (100 - coherence) * 0.005; 
            const energyFactor = 1 + (energyLevel / 100) * 0.5;
            const spectrum = spectrumData || new Array(32).fill(0);
            const treble = spectrum.slice(16).reduce((a, b) => a + b, 0);
            const trebleGlow = 1 + (Math.min(treble, 300) / 300) * 1.5;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            
            particlesRef.current.forEach(p => {
                p.x += p.vx * energyFactor + (Math.random() - 0.5) * jitter;
                p.y += p.vy * energyFactor + (Math.random() - 0.5) * jitter;
                
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                p.s = p.baseSize * trebleGlow;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fill();
            });
            
            frameRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(frameRef.current);
        };
    }, [coherence, energyLevel, spectrumData, aiService]);

    return (
        <>
            <div className="goo-container">
                <div 
                    ref={el => blobRefs.current[0] = el}
                    className="goo-blob transition-colors duration-1000" 
                    style={{ width: '40vw', height: '40vw', top: '-10%', left: '-10%', animationDelay: '0s' }} 
                />
                <div 
                    ref={el => blobRefs.current[1] = el}
                    className="goo-blob transition-colors duration-1000" 
                    style={{ width: '35vw', height: '35vw', top: '40%', right: '-10%', animationDelay: '-5s' }} 
                />
                <div 
                    ref={el => blobRefs.current[2] = el}
                    className="goo-blob transition-colors duration-1000" 
                    style={{ width: '30vw', height: '30vw', bottom: '-10%', left: '20%', animationDelay: '-10s' }}
                />
            </div>
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none -z-1" />
        </>
    );
};

export default VisualCortex;
