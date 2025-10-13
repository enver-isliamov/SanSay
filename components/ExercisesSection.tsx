import React from 'react';
import SectionCard from './SectionCard';
import { EXERCISE_CATEGORIES } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

const ExercisesSection: React.FC = () => {
  return (
    <SectionCard title="Упражнения по методу Бубновского" icon={<SparklesIcon />}>
      <div className="space-y-10">
        {EXERCISE_CATEGORIES.map((category, catIndex) => (
          <div key={catIndex}>
            <h3 className="text-xl font-semibold text-cyan-600 dark:text-cyan-300 mb-2">{category.title}</h3>
            {category.goal && <p className="text-slate-500 dark:text-gray-400 italic mb-2">{category.goal}</p>}
            {category.warning && <p className="text-sm bg-yellow-400/10 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 p-3 rounded-lg border border-yellow-400/20 mb-4">{category.warning}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.exercises.map((exercise, exIndex) => (
                <div key={exIndex} className="bg-slate-100/50 dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10 flex flex-col">
                  <h4 className="font-semibold text-slate-800 dark:text-white">{exercise.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 flex-grow">{exercise.description}</p>
                  <div className="flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 mt-3">
                    {exercise.type === 'timed' 
                        ? <ClockIcon className="h-4 w-4 mr-1.5 flex-shrink-0" /> 
                        : <ArrowPathIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                    <span>{exercise.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default ExercisesSection;