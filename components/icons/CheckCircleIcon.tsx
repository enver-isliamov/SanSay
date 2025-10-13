import React from 'react';

interface CheckCircleIconProps {
    className?: string;
}

export const CheckCircleIcon: React.FC<CheckCircleIconProps> = ({ className = "h-16 w-16 text-cyan-500 dark:text-cyan-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);