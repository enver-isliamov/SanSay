import React, { useMemo, useState, useEffect, useRef } from 'react';
import SectionCard from '../../components/SectionCard';
import { TODAY_WORKOUT, EXERCISE_SKILL_MAP, SKILLS, EXERCISE_CATEGORIES } from '../../constants';
import { SparklesIcon } from '../../components/icons/SparklesIcon';

const Tooltip: React.FC<{ x: number; y: number; label: string; isMobile: boolean, svgDimensions: { width: number, height: number }, position: 'left' | 'right' | 'top' | 'bottom' }> = ({ x, y, label, isMobile, svgDimensions, position }) => {
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

const getCategoryColorClass = (category: string) => {
    if (category === "Упражнения на укрепление глубоких мышц") return 'stroke-emerald-500 dark:stroke-emerald-400';
    if (category === "Для шейного отдела") return 'stroke-indigo-500 dark:stroke-indigo-400';
    // "Упражнения на растяжку и декомпрессию" - default
    return 'stroke-sky-500 dark:stroke-sky-400';
};

const WorkoutContributionViz: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedNode, setSelectedNode] = useState<{ id: string, x: number, y: number, type: string } | null>(null);

    const { inputs, outputs, connections } = useMemo(() => {
        const exerciseInputs = TODAY_WORKOUT.exercises.slice(0, 12).map(ex => ({ id: ex.name, label: ex.name }));
        const involvedSkills = new Set<string>();
        
        const exerciseToCategoryMap = new Map<string, string>();
        EXERCISE_CATEGORIES.forEach(cat => {
            cat.exercises.forEach(ex => {
                exerciseToCategoryMap.set(ex.name, cat.title);
            });
        });

        const connectionSet = new Set<string>();
        exerciseInputs.forEach(ex => {
            const skills = EXERCISE_SKILL_MAP[ex.id] || [];
            skills.forEach(skill => {
                involvedSkills.add(skill);
                connectionSet.add(`${ex.id}---${skill}`);
            });
        });

        const skillOutputs = SKILLS.filter(s => involvedSkills.has(s)).map(s => ({ id: s, label: s }));

        const uniqueConnections = Array.from(connectionSet).map(c => {
            const [from, to] = c.split('---');
            return { from, to, category: exerciseToCategoryMap.get(from) || '' };
        });

        return {
            inputs: exerciseInputs,
            outputs: skillOutputs.sort((a,b) => a.label.localeCompare(b.label)),
            connections: uniqueConnections,
        };
    }, []);
    
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                const isMobile = width < 640;
                const height = isMobile 
                    ? Math.min(width * 1.6, 800) 
                    : Math.max(inputs.length * 28, outputs.length * 35) + 40;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, [inputs.length, outputs.length]);

    const elements = useMemo(() => {
        if (dimensions.width === 0 || inputs.length === 0 || outputs.length === 0) return null;
        
        const { width, height } = dimensions;
        const isMobile = width < 640;

        if (!isMobile) {
            const padding = { top: 20, bottom: 20, left: 10, right: 10 };
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
            
            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x; const y1 = fromNode.y;
                const x2 = toNode.x; const y2 = toNode.y;
                const c1x = x1 + (x2 - x1) * 0.5;
                const c2x = x1 + (x2 - x1) * 0.5;
                
                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to, category: conn.category,
                    d: `M${x1},${y1} C ${c1x},${y1} ${c2x},${y2} ${x2},${y2}`,
                }
            }).filter((p): p is NonNullable<typeof p> => p !== null);
            
            return { nodes: allNodes, paths, isMobile };
        } else {
            const padding = { top: 10, bottom: 10, left: 10, right: 10 };
            const inputY = padding.top;
            const outputY = height - padding.bottom;
            
            const inputXStep = (width - padding.left - padding.right) / (inputs.length - 1);
            const outputXStep = (width - padding.left - padding.right) / (outputs.length - 1);
            
            const inputNodes = inputs.map((node, i) => ({ ...node, x: padding.left + i * inputXStep, y: inputY, type: 'input'}));
            const outputNodes = outputs.map((node, i) => ({ ...node, x: padding.left + i * outputXStep, y: outputY, type: 'output'}));

            const allNodes = [...inputNodes, ...outputNodes];
            const nodeMap = new Map(allNodes.map(n => [n.id, n]));
            
            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const y1 = fromNode.y; const x1 = fromNode.x;
                const y2 = toNode.y; const x2 = toNode.x;
                const c1y = y1 + (y2 - y1) * 0.5;
                const c2y = y1 + (y2 - y1) * 0.5;
                
                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to, category: conn.category,
                    d: `M${x1},${y1} C ${x1},${c1y} ${x2},${c2y} ${x2},${y2}`,
                }
            }).filter((p): p is NonNullable<typeof p> => p !== null);

            return { nodes: allNodes, paths, isMobile };
        }
    }, [dimensions, inputs, outputs, connections]);

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
        const tooltipHeight = 34;
        const margin = 4;

        const nodesToPosition = highlightedNodes.map(n => ({ ...n, finalY: n.y }));

        if (!isMobile) {
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

    const handleNodeClick = (e: React.MouseEvent, node: { id: string, x: number, y: number, type: string }) => {
        e.stopPropagation();
        if (selectedNode?.id === node.id) {
            setSelectedNode(null);
        } else {
            setSelectedNode(node);
        }
    };

    return (
         <SectionCard title="Вклад сегодняшней тренировки" icon={<SparklesIcon />} titleClassName="text-xl font-bold">
             <div ref={containerRef} className="w-full h-full cursor-pointer" onClick={() => setSelectedNode(null)}>
                 {dimensions.width > 0 && (
                    <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                        {elements ? (
                        <>
                            <g>
                                {elements.paths.map(p => {
                                    const isConnected = selectedNode && (p.from === selectedNode.id || p.to === selectedNode.id);
                                    const colorClass = getCategoryColorClass(p.category);
                                    return (
                                        <path
                                            key={p.key}
                                            d={p.d}
                                            className={`fill-none transition-all duration-300 ${colorClass}`}
                                            strokeWidth={ isConnected ? 2.5 : 1.5 }
                                            style={{ opacity: selectedNode ? (isConnected ? 1 : 0.05) : 0.4 }}
                                        />
                                    );
                                })}
                            </g>
                            <g>
                                {elements.nodes.map(node => {
                                     const isSelected = selectedNode?.id === node.id;
                                     const isHighlighted = highlightedNodes.some(hn => hn.id === node.id);
                                     const isDimmed = selectedNode && !isHighlighted;
                                     return (
                                         <g key={node.id} onClick={(e) => handleNodeClick(e, node)} style={{ opacity: isDimmed ? 0.3 : 1 }} className="transition-opacity duration-300">
                                             <circle
                                                 cx={node.x}
                                                 cy={node.y}
                                                 r={4 + (isSelected ? 2 : 0)}
                                                 className={`transition-all duration-300 ${
                                                     node.type === 'input' 
                                                         ? 'fill-amber-500 dark:fill-amber-400' 
                                                         : 'fill-cyan-400 dark:fill-cyan-300'
                                                 } ${isHighlighted ? 'stroke-sky-300 dark:stroke-sky-500' : 'stroke-transparent'}`}
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
                                );
                            })}
                        </>
                        ) : (
                             <text x={dimensions.width/2} y={dimensions.height/2} textAnchor="middle" className="text-slate-500 dark:text-gray-400 italic text-sm">
                                Загрузка...
                            </text>
                        )}
                    </svg>
                 )}
             </div>
         </SectionCard>
    );
}
export default WorkoutContributionViz;import React, { useMemo, useState, useEffect, useRef } from 'react';
import SectionCard from '../../components/SectionCard';
import { TODAY_WORKOUT, EXERCISE_SKILL_MAP, SKILLS, EXERCISE_CATEGORIES } from '../../constants';
import { SparklesIcon } from '../../components/icons/SparklesIcon';

const Tooltip: React.FC<{ x: number; y: number; label: string; isMobile: boolean, position: 'left' | 'right' | 'top' | 'bottom' }> = ({ x, y, label, isMobile, position }) => {
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
        rectX = x - box.width - 8;
        rectY = y - box.height / 2;
    } else if (position === 'right') {
        rectX = x + 8;
        rectY = y - box.height / 2;
    } else if (position === 'bottom') {
        rectX = x - box.width / 2;
        rectY = y + 8;
    } else { // top
        rectX = x - box.width / 2;
        rectY = y - box.height - 8;
    }


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

const getCategoryColorClass = (category: string) => {
    if (category === "Упражнения на укрепление глубоких мышц") return 'stroke-emerald-400 dark:stroke-emerald-300';
    if (category === "Для шейного отдела") return 'stroke-indigo-400 dark:stroke-indigo-300';
    // "Упражнения на растяжку и декомпрессию" - default
    return 'stroke-sky-400 dark:stroke-sky-300';
};

const WorkoutContributionViz: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedNode, setSelectedNode] = useState<{ id: string, x: number, y: number, type: string } | null>(null);

    const { inputs, outputs, connections } = useMemo(() => {
        const exerciseInputs = TODAY_WORKOUT.exercises.slice(0, 12).map(ex => ({ id: ex.name, label: ex.name }));
        const involvedSkills = new Set<string>();
        
        const exerciseToCategoryMap = new Map<string, string>();
        EXERCISE_CATEGORIES.forEach(cat => {
            cat.exercises.forEach(ex => {
                exerciseToCategoryMap.set(ex.name, cat.title);
            });
        });

        const connectionSet = new Set<string>();
        exerciseInputs.forEach(ex => {
            const skills = EXERCISE_SKILL_MAP[ex.id] || [];
            skills.forEach(skill => {
                involvedSkills.add(skill);
                connectionSet.add(`${ex.id}---${skill}`);
            });
        });

        const skillOutputs = SKILLS.filter(s => involvedSkills.has(s)).map(s => ({ id: s, label: s }));

        const uniqueConnections = Array.from(connectionSet).map(c => {
            const [from, to] = c.split('---');
            return { from, to, category: exerciseToCategoryMap.get(from) || '' };
        });

        return {
            inputs: exerciseInputs,
            outputs: skillOutputs.sort((a,b) => a.label.localeCompare(b.label)),
            connections: uniqueConnections,
        };
    }, []);
    
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                const isMobile = width < 640;
                const height = isMobile 
                    ? Math.min(width * 1.6, 800) 
                    : Math.max(inputs.length * 28, outputs.length * 35) + 40;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, [inputs.length, outputs.length]);

    const elements = useMemo(() => {
        if (dimensions.width === 0 || inputs.length === 0 || outputs.length === 0) return null;
        
        const { width, height } = dimensions;
        const isMobile = width < 640;

        if (!isMobile) {
            const padding = { top: 20, bottom: 20, left: 10, right: 10 };
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
            
            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x; const y1 = fromNode.y;
                const x2 = toNode.x; const y2 = toNode.y;
                const c1x = x1 + (x2 - x1) * 0.5;
                const c2x = x1 + (x2 - x1) * 0.5;
                
                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to, category: conn.category,
                    d: `M${x1},${y1} C ${c1x},${y1} ${c2x},${y2} ${x2},${y2}`,
                }
            }).filter((p): p is NonNullable<typeof p> => p !== null);
            
            return { nodes: allNodes, paths, isMobile };
        } else {
            const padding = { top: 10, bottom: 10, left: 10, right: 10 };
            const inputY = padding.top;
            const outputY = height - padding.bottom;
            
            const inputXStep = (width - padding.left - padding.right) / (inputs.length - 1);
            const outputXStep = (width - padding.left - padding.right) / (outputs.length - 1);
            
            const inputNodes = inputs.map((node, i) => ({ ...node, x: padding.left + i * inputXStep, y: inputY, type: 'input'}));
            const outputNodes = outputs.map((node, i) => ({ ...node, x: padding.left + i * outputXStep, y: outputY, type: 'output'}));

            const allNodes = [...inputNodes, ...outputNodes];
            const nodeMap = new Map(allNodes.map(n => [n.id, n]));
            
            const paths = connections.map(conn => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);
                if (!fromNode || !toNode) return null;

                const y1 = fromNode.y; const x1 = fromNode.x;
                const y2 = toNode.y; const x2 = toNode.x;
                const c1y = y1 + (y2 - y1) * 0.5;
                const c2y = y1 + (y2 - y1) * 0.5;
                
                return {
                    key: `${conn.from}-${conn.to}`, from: conn.from, to: conn.to, category: conn.category,
                    d: `M${x1},${y1} C ${x1},${c1y} ${x2},${c2y} ${x2},${y2}`,
                }
            }).filter((p): p is NonNullable<typeof p> => p !== null);

            return { nodes: allNodes, paths, isMobile };
        }
    }, [dimensions, inputs, outputs, connections]);

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

    const handleNodeClick = (e: React.MouseEvent, node: { id: string, x: number, y: number, type: string }) => {
        e.stopPropagation();
        if (selectedNode?.id === node.id) {
            setSelectedNode(null);
        } else {
            setSelectedNode(node);
        }
    };

    return (
         <SectionCard title="Вклад сегодняшней тренировки" icon={<SparklesIcon />} titleClassName="text-xl font-bold">
             <div ref={containerRef} className="w-full h-full cursor-pointer" onClick={() => setSelectedNode(null)}>
                 {dimensions.width > 0 && (
                    <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                        {elements ? (
                        <>
                            <g>
                                {elements.paths.map(p => {
                                    const isConnected = selectedNode && (p.from === selectedNode.id || p.to === selectedNode.id);
                                    const colorClass = getCategoryColorClass(p.category);
                                    return (
                                        <path
                                            key={p.key}
                                            d={p.d}
                                            className={`fill-none transition-all duration-300 ${colorClass}`}
                                            strokeWidth={ isConnected ? 2.5 : 1.5 }
                                            style={{ opacity: selectedNode ? (isConnected ? 1 : 0.1) : 0.4 }}
                                        />
                                    );
                                })}
                            </g>
                            <g>
                                {elements.nodes.map(node => {
                                     const isSelected = selectedNode?.id === node.id;
                                     const isHighlighted = highlightedNodes.some(hn => hn.id === node.id);
                                     const isDimmed = selectedNode && !isHighlighted;
                                     return (
                                         <g key={node.id} onClick={(e) => handleNodeClick(e, node)} style={{ opacity: isDimmed ? 0.3 : 1 }} className="transition-opacity duration-300">
                                             <circle
                                                 cx={node.x}
                                                 cy={node.y}
                                                 r={4 + (isSelected ? 2 : 0)}
                                                 className={`transition-all duration-300 ${
                                                     node.type === 'input' 
                                                         ? 'fill-amber-500 dark:fill-amber-400' 
                                                         : 'fill-cyan-400 dark:fill-cyan-300'
                                                 } ${isHighlighted ? 'stroke-sky-300 dark:stroke-sky-500' : 'stroke-transparent'}`}
                                                 strokeWidth="2"
                                             />
                                         </g>
                                     );
                                })}
                            </g>
                            {highlightedNodes.length > 0 && elements && highlightedNodes.map(node => {
                                let tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'top';
                                if (elements.isMobile) {
                                    tooltipPosition = node.type === 'input' ? 'bottom' : 'top';
                                } else {
                                    tooltipPosition = node.type === 'input' ? 'right' : 'left';
                                }
                                return (
                                    <Tooltip
                                        key={node.id}
                                        x={node.x}
                                        y={node.y}
                                        label={node.id}
                                        isMobile={elements.isMobile}
                                        position={tooltipPosition}
                                    />
                                );
                            })}
                        </>
                        ) : (
                             <text x={dimensions.width/2} y={dimensions.height/2} textAnchor="middle" className="text-slate-500 dark:text-gray-400 italic text-sm">
                                Загрузка...
                            </text>
                        )}
                    </svg>
                 )}
             </div>
         </SectionCard>
    );
}
export default WorkoutContributionViz;
