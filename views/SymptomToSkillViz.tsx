import React, { useMemo, useState, useEffect, useRef } from 'react';
import SectionCard from '../../components/SectionCard';
import { useAuth } from '../../hooks/useAuth';
import { SYMPTOMS_DATA, SYMPTOM_WORKOUTS, EXERCISE_SKILL_MAP, SKILLS } from '../../constants';
import { BeakerIcon } from '../../components/icons/BeakerIcon';

const MOCK_EXECUTION_HISTORY = {
    "Кошка": 25, "Растяжка ягодиц (на полу)": 22, "“Мостик” ягодичный": 18,
    "Изометрические упражнения": 30, "Медленные повороты головы": 28,
    "Подъём руки и противоположной ноги": 15, "Дыхательная гимнастика": 40,
    "Плавная растяжка бёдер": 19, "Тяга эспандера сидя (или резины)": 12,
    "Скалолаз (на четвереньках)": 10, "Полумост с изометрией": 14,
    "Диафрагмальное дыхание лёжа": 35, "Растяжка спины назад": 20,
};

const lineColors = [
    'stroke-pink-500 dark:stroke-pink-400',
    'stroke-amber-500 dark:stroke-amber-400',
    'stroke-emerald-500 dark:stroke-emerald-400',
    'stroke-indigo-500 dark:stroke-indigo-400',
    'stroke-sky-500 dark:stroke-sky-400',
    'stroke-rose-500 dark:stroke-rose-400',
];

const Tooltip: React.FC<{ x: number; y: number; label: string; isMobile: boolean; svgDimensions: { width: number, height: number }, position: 'left' | 'right' | 'top' | 'bottom' }> = ({ x, y, label, isMobile, svgDimensions, position }) => {
    const textRef = useRef<SVGTextElement>(null);
    const [box, setBox] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (textRef.current) {
            const { width, height } = textRef.current.getBBox();
            setBox({ width: width + 16, height: height + 10 });
        }
    }, [label]);

    let rectX = x, rectY = y;
    
    if (position === 'left') {
        rectX = x - box.width - 12;
        rectY = y - box.height / 2;
    } else if (position === 'right') {
        rectX = x + 12;
        rectY = y - box.height / 2;
    } else if (position === 'bottom') {
        rectX = x - box.width / 2;
        rectY = y + 12;
    } else { // top
        rectX = x - box.width / 2;
        rectY = y - box.height - 12;
    }
    
    // Boundary checks
    if (rectX < 5) rectX = 5;
    if (rectX + box.width > svgDimensions.width) rectX = svgDimensions.width - box.width - 5;
    if (rectY < 5 && (position === 'top' || position === 'left' || position === 'right')) rectY = y + 12; // Flip below
    if (rectY + box.height > svgDimensions.height) rectY = svgDimensions.height - box.height - 5;


    return (
        <g className="pointer-events-none transition-opacity duration-300 animate-fade-in">
            <rect
                x={rectX}
                y={rectY}
                width={box.width}
                height={box.height}
                rx="6"
                className="fill-slate-800/80 dark:fill-slate-900/80 backdrop-blur-sm"
            />
            <text ref={textRef} x={rectX + box.width / 2} y={rectY + box.height / 2} dy="0.35em" textAnchor="middle" className="text-xs fill-white font-semibold">
                {label}
            </text>
        </g>
    );
};


const SymptomToSkillViz: React.FC = () => {
    const { userData } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedNode, setSelectedNode] = useState<{ id: string, x: number, y: number, type: string } | null>(null);

    const executionHistory = Object.keys(userData.exerciseExecutionHistory || {}).length > 0 
        ? userData.exerciseExecutionHistory 
        : MOCK_EXECUTION_HISTORY;

    const { inputs, outputs, connections } = useMemo(() => {
        const symptomInputs = SYMPTOMS_DATA.slice(0, 6).map(s => ({ id: s.symptom, label: s.symptom }));
        const skillOutputs = SKILLS.map(s => ({ id: s, label: s, value: 0 }));
        
        const skillValueMap = new Map<string, number>();
        SKILLS.forEach(s => skillValueMap.set(s, 0));

        const connectionMap = new Map<string, { from: string; to: string; weight: number }>();

        symptomInputs.forEach(symptom => {
            const exercises = SYMPTOM_WORKOUTS[symptom.id] || [];
            exercises.forEach(exName => {
                const skills = EXERCISE_SKILL_MAP[exName] || [];
                const count = (executionHistory[exName] || 0) as number;
                skills.forEach(skill => {
                    const currentVal = skillValueMap.get(skill) || 0;
                    skillValueMap.set(skill, currentVal + count);

                    const key = `${symptom.id}-${skill}`;
                    const existingConn = connectionMap.get(key) || { from: symptom.id, to: skill, weight: 0 };
                    existingConn.weight += count;
                    if (existingConn.weight > 0) {
                        connectionMap.set(key, existingConn);
                    }
                });
            });
        });
        
        const hasData = Object.keys(executionHistory).length > 0;
        const maxSkillValue = hasData ? Math.max(1, ...Array.from(skillValueMap.values())) : 1;
        skillOutputs.forEach(s => {
            const rawValue = skillValueMap.get(s.id) || 0;
            s.value = (rawValue / maxSkillValue);
        });

        const symptomColorMap = new Map(symptomInputs.map((s, i) => [s.id, lineColors[i % lineColors.length]]));
        const coloredConnections = Array.from(connectionMap.values()).map(conn => ({
            ...conn,
            colorClass: symptomColorMap.get(conn.from) || 'stroke-slate-300 dark:stroke-slate-700',
        }));

        return {
            inputs: symptomInputs,
            outputs: skillOutputs.sort((a, b) => b.value - a.value).filter(s => s.value > 0),
            connections: coloredConnections,
        };
    }, [executionHistory]);
    
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                const isMobile = width < 640;
                const height = isMobile ? Math.min(width * 1.5, 700) : Math.min(width * 0.8, 500);
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, []);

    const elements = useMemo(() => {
        if (dimensions.width === 0 || outputs.length === 0) return null;
        
        const { width, height } = dimensions;
        const isMobile = width < 640;
        
        if (!isMobile) {
            const padding = { top: 20, bottom: 20, left: 15, right: 15 };
            const inputX = padding.left;
            const outputX = width - padding.right;
            
            const inputYStep = (height - padding.top - padding.bottom) / inputs.length;
            const outputYStep = (height - padding.top - padding.bottom) / outputs.length;

            const inputNodes = inputs.map((node, i) => ({
                ...node, x: inputX, y: padding.top + i * inputYStep + inputYStep / 2, type: 'input'
            }));
            const outputNodes = outputs.map((node, i) => ({
                ...node, x: outputX, y: padding.top + i * outputYStep + outputYStep / 2, type: 'output'
            }));
            
            const allNodes = [...inputNodes, ...outputNodes];
            const nodeMap = new Map(allNodes.map(n => [n.id, n]));
            const maxWeight = Math.max(1, ...connections.map(c => c.weight));

            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const c1x = fromNode.x + (toNode.x - fromNode.x) * 0.4;
                const c2x = toNode.x - (toNode.x - fromNode.x) * 0.4;
                
                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to,
                    d: `M${fromNode.x} ${fromNode.y} C ${c1x} ${fromNode.y}, ${c2x} ${toNode.y}, ${toNode.x} ${toNode.y}`,
                    strokeWidth: 0.5 + (conn.weight / maxWeight) * 3,
                    colorClass: conn.colorClass
                };
            }).filter((p): p is NonNullable<typeof p> => p !== null);

            return { nodes: allNodes, paths, isMobile };
        } else {
            const padding = { top: 15, bottom: 15, left: 10, right: 10 };
            const inputY = padding.top;
            const outputY = height - padding.bottom;
            
            const inputXStep = (width - padding.left - padding.right) / (inputs.length - 1);
            const outputXStep = (width - padding.left - padding.right) / (outputs.length -1);

            const inputNodes = inputs.map((node, i) => ({
                ...node, x: padding.left + i * inputXStep, y: inputY, type: 'input'
            }));
            const outputNodes = outputs.map((node, i) => ({
                ...node, x: padding.left + i * outputXStep, y: outputY, type: 'output'
            }));

            const allNodes = [...inputNodes, ...outputNodes];
            const nodeMap = new Map(allNodes.map(n => [n.id, n]));
            const maxWeight = Math.max(1, ...connections.map(c => c.weight));

            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const c1y = fromNode.y + (toNode.y - fromNode.y) * 0.5;
                const c2y = toNode.y - (toNode.y - fromNode.y) * 0.5;

                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to,
                    d: `M${fromNode.x} ${fromNode.y} C ${fromNode.x} ${c1y}, ${toNode.x} ${c2y}, ${toNode.x} ${toNode.y}`,
                    strokeWidth: 0.5 + (conn.weight / maxWeight) * 2.5,
                    colorClass: conn.colorClass
                };
            }).filter((p): p is NonNullable<typeof p> => p !== null);
            
            return { nodes: allNodes, paths, isMobile };
        }
    }, [dimensions, inputs, outputs, connections]);

    const handleNodeClick = (e: React.MouseEvent, node: { id: string, x: number, y: number, type: string }) => {
        e.stopPropagation();
        if (selectedNode?.id === node.id) {
            setSelectedNode(null);
        } else {
            setSelectedNode(node);
        }
    };

    const highlightedNodes = useMemo(() => {
        if (!selectedNode || !elements) return [];

        const connectedNodeIds = new Set<string>();
        elements.paths.forEach(p => {
            if (p.from === selectedNode.id) connectedNodeIds.add(p.to);
            if (p.to === selectedNode.id) connectedNodeIds.add(p.from);
        });
        
        const mainNode = elements.nodes.find(n => n.id === selectedNode.id);
        const connectedNodes = elements.nodes.filter(n => connectedNodeIds.has(n.id));
        
        return mainNode ? [mainNode, ...connectedNodes] : [];
    }, [selectedNode, elements]);

    const positionedTooltips = useMemo(() => {
        if (!highlightedNodes.length || !elements) return [];

        const isMobile = elements.isMobile;
        const tooltipHeight = 34; // Approximate height including padding
        const margin = 4;

        const nodesToPosition = highlightedNodes.map(n => ({ ...n, finalY: n.y }));

        if (!isMobile) {
            // Separate nodes into left (outputs) and right (inputs) columns
            const leftNodes = nodesToPosition.filter(n => n.type === 'output').sort((a, b) => a.y - b.y);
            const rightNodes = nodesToPosition.filter(n => n.type === 'input').sort((a, b) => a.y - b.y);

            let lastBottom = -Infinity;
            leftNodes.forEach(node => {
                const top = node.finalY - tooltipHeight / 2;
                if (top < lastBottom + margin) {
                    node.finalY = lastBottom + margin + tooltipHeight / 2;
                }
                lastBottom = node.finalY + tooltipHeight / 2;
            });

            lastBottom = -Infinity;
            rightNodes.forEach(node => {
                const top = node.finalY - tooltipHeight / 2;
                if (top < lastBottom + margin) {
                    node.finalY = lastBottom + margin + tooltipHeight / 2;
                }
                lastBottom = node.finalY + tooltipHeight / 2;
            });
        }
        
        return nodesToPosition;
    }, [highlightedNodes, elements]);


    return (
        <SectionCard title="От симптомов к навыкам" icon={<BeakerIcon />} titleClassName="text-xl font-bold">
             <div ref={containerRef} className="w-full h-full cursor-pointer" onClick={() => setSelectedNode(null)}>
                {dimensions.width > 0 && (
                    <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                        {elements && outputs.length > 0 ? (
                        <>
                            <g>
                                {elements.paths.map(p => {
                                    const isConnected = selectedNode && (p.from === selectedNode.id || p.to === selectedNode.id);
                                    return (
                                        <path
                                            key={p.key}
                                            d={p.d}
                                            className={`fill-none transition-all duration-300 ${p.colorClass}`}
                                            style={{ opacity: selectedNode ? (isConnected ? 1 : 0.05) : 0.4 }}
                                            strokeWidth={p.strokeWidth}
                                        />
                                    );
                                })}
                            </g>
                            <g>
                                {elements.nodes.map(node => {
                                    const isSelected = selectedNode?.id === node.id;
                                    const isHighlighted = highlightedNodes.some(hn => hn.id === node.id);
                                    const isDimmed = selectedNode && !isHighlighted;
                                    const radius = node.type === 'input' ? 4 : 4 + (outputs.find(o => o.id === node.id)?.value || 0) * 5;
                                    return (
                                        <g key={node.id} onClick={(e) => handleNodeClick(e, node)} style={{ opacity: isDimmed ? 0.3 : 1 }} className="transition-opacity duration-300">
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={radius + (isSelected ? 3 : 0)}
                                                className={`transition-all duration-300 ${
                                                    node.type === 'input' 
                                                        ? 'fill-amber-500 dark:fill-amber-400' 
                                                        : 'fill-cyan-400 dark:fill-cyan-300'
                                                } ${isSelected || isHighlighted ? 'stroke-sky-300 dark:stroke-sky-500' : 'stroke-transparent'}`}
                                                strokeWidth="2"
                                            />
                                        </g>
                                    );
                                })}
                            </g>
                            {positionedTooltips.length > 0 && elements && dimensions && positionedTooltips.map(node => {
                                let tooltipPosition: 'left' | 'right' | 'top' | 'bottom';
                                if (elements.isMobile) {
                                    tooltipPosition = node.type === 'input' ? 'bottom' : 'top';
                                } else {
                                    tooltipPosition = node.type === 'input' ? 'right' : 'left';
                                }
                                return (
                                <Tooltip
                                    key={node.id}
                                    x={node.x}
                                    y={node.finalY || node.y}
                                    label={node.id}
                                    isMobile={elements.isMobile}
                                    svgDimensions={dimensions}
                                    position={tooltipPosition}
                                />
                            )})}
                        </>
                        ) : (
                            <text x={dimensions.width/2} y={dimensions.height/2} textAnchor="middle" className="text-slate-500 dark:text-gray-400 italic text-sm">
                                Начните тренировки, чтобы увидеть здесь связь симптомов и навыков.
                            </text>
                        )}
                    </svg>
                )}
            </div>
        </SectionCard>
    );
}
export default SymptomToSkillViz;
