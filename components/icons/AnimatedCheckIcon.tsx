import React from 'react';

export const AnimatedCheckIcon: React.FC = () => (
    <div className="flex items-center justify-center">
        <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle 
                cx="12" 
                cy="12" 
                r="10" 
                className="stroke-cyan-500/80 dark:stroke-cyan-400/80 animate-scale-in"
                strokeWidth="1.5"
            />
            <path 
                d="M7.5 12.5l3 3 6-6" 
                stroke="currentColor" 
                className="text-cyan-500 dark:text-cyan-400 animate-draw-check"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
            />
        </svg>
    </div>
);