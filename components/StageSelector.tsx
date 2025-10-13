import React from 'react';

interface StageSelectorProps {
    stages: string[];
    selectedStage: string;
    onSelectStage: (stage: string) => void;
}

const StageSelector: React.FC<StageSelectorProps> = ({ stages, selectedStage, onSelectStage }) => {
    return (
        <div className="flex justify-center space-x-2 p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
            {stages.map(stage => (
                <button
                    key={stage}
                    onClick={() => onSelectStage(stage)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                        selectedStage === stage
                            ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow'
                            : 'text-slate-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                    }`}
                >
                    {stage}
                </button>
            ))}
        </div>
    );
};

export default StageSelector;
