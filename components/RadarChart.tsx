import React from 'react';

interface RadarChartProps {
  data: { skill: string; value: number }[];
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
    const numAxes = data.length;
    if (numAxes === 0) return null;

    const angleSlice = (Math.PI * 2) / numAxes;
    const radius = size * 0.33; // Уменьшен радиус для дополнительного пространства
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
        const labelRadius = radius * 1.25; // Увеличен радиус для метки
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        const words = skill.split(' ');

        const cosAngle = Math.cos(angle);
        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        if (cosAngle > 0.1) textAnchor = 'start';
        else if (cosAngle < -0.1) textAnchor = 'end';
        
        // Коррекция вертикального выравнивания для многострочных меток
        const dyBase = 0.35;
        const dyOffset = (words.length > 1) ? -((words.length - 1) * 0.6) : 0;
        const dy = dyBase + dyOffset + 'em';

        return (
            <text
                key={i}
                x={x}
                y={y}
                dy={dy}
                textAnchor={textAnchor}
                className="text-xs fill-slate-500 dark:fill-gray-400 font-medium"
            >
                {words.map((word, j) => (
                    <tspan key={j} x={x} dy={j === 0 ? "0" : "1.2em"}>{word}</tspan>
                ))}
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
            <defs>
                <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(165, 243, 252, 0.1)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.5)" />
                </radialGradient>
            </defs>
            <g>{gridLevels}</g>
            <g>{axes}</g>
            <g>{labels}</g>
            <polygon
                points={dataPoints}
                fill="url(#radarGradient)"
                className="stroke-cyan-500 dark:stroke-cyan-400"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default RadarChart;
