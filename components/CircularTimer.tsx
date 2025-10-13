import React, { useState, useEffect } from 'react';

interface CircularTimerProps {
  duration: number;
  timeLeft: number;
  size?: number;
  strokeWidth?: number;
  showTime?: boolean;
  colorClassName?: string;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  duration,
  timeLeft,
  size = 200,
  strokeWidth = 15,
  showTime = true,
  colorClassName = 'text-cyan-500 dark:text-cyan-400',
}) => {
  const [applyTransition, setApplyTransition] = useState(false);

  // This effect runs once on mount (when the component's key changes).
  // It ensures the initial state (e.g., an empty circle for the timer) is rendered
  // before CSS transitions are enabled. This prevents the animation from "jumping"
  // on the first tick by giving the browser a rendered "from" state to animate from.
  useEffect(() => {
    // We defer enabling the transition until the next browser paint frame.
    const frameId = requestAnimationFrame(() => setApplyTransition(true));
    // Cleanup on unmount.
    return () => cancelAnimationFrame(frameId);
  }, []); // Empty dependency array ensures this runs only on mount.

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Progress is calculated directly from props, making the component fully controlled.
  const progress = duration > 0 ? Math.max(0, Math.min(1, (duration - timeLeft) / duration)) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-slate-200 dark:text-slate-700"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colorClassName}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          // The transition style is applied conditionally after the initial render.
          style={{ transition: applyTransition ? 'stroke-dashoffset 1s linear' : 'none' }}
        />
      </svg>
      {showTime && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-slate-800 dark:text-white">
            {timeLeft}
          </span>
        </div>
      )}
    </div>
  );
};

export default CircularTimer;