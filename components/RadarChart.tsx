import React from 'react';

interface RadarChartProps {
  data: { skill: string; value: number }[];
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
    const numAxes = data.length;
    if (numAxes === 0) return null;

    const angleSlice = (Math.PI * 2) / numAxes;
    const radius = size * 0.35;
    const center = size / 2;
    const maxValue = 10;
    const levels = 5;

    const gridLevels = Array.from({ length: levels }, (_, i) => {
        const levelRadius = radius * ((i + 1) / levels);
        const points = Array.from({ length: numAxes }).map((__, j) => {
            const angle = angleSlice * j - Math.PI / 2;
            const x = center + levelRadius * Math.cos(angle);
            const y = center + levelRadius * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
        return <polygon key={i} points={points} className="fill-none stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />;
    });

    const axes = data.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />;
    });

    const labels = data.map(({ skill }, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const labelRadius = radius * 1.15;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);

        // Fix: Explicitly type `textAnchor` to satisfy the SVGTextElement's `textAnchor` property requirements.
        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        // A small epsilon to handle floating point comparisons
        const epsilon = 0.001; 
        if (angle > epsilon && angle < Math.PI - epsilon) {
            textAnchor = 'start';
        } else if (angle > Math.PI + epsilon && angle < 2 * Math.PI - epsilon) {
            textAnchor = 'end';
        }

        return (
            <text
                key={i}
                x={x}
                y={y}
                dy="0.35em"
                textAnchor={textAnchor}
                className="text-xs fill-slate-500 dark:fill-gray-400 font-medium"
            >
                {skill}
            </text>
        );
    });

    const dataPoints = data.map(({ value }, i) => {
        const valueRatio = Math.max(0, value) / maxValue;
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + radius * valueRatio * Math.cos(angle);
        const y = center + radius * valueRatio * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g>{gridLevels}</g>
            <g>{axes}</g>
            <g>{labels}</g>
            <polygon
                points={dataPoints}
                className="fill-cyan-500/30 stroke-cyan-500 dark:fill-cyan-400/30 dark:stroke-cyan-400"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default RadarChart;
