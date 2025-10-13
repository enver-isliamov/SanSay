import React from 'react';

interface IconProps {
    className?: string;
}

export const ChevronLeftCircleIcon: React.FC<IconProps> = ({ className = "h-12 w-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M5 12a7 7 0 1114 0 7 7 0 01-14 0z" />
    </svg>
);
