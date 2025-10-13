import React from 'react';
import SectionCard from './SectionCard';
import { SUMMARY_DATA } from '../constants';
import { ChatAlt2Icon } from './icons/ChatAlt2Icon';

const SummarySection: React.FC = () => {
  return (
    <SectionCard title={SUMMARY_DATA.title} icon={<ChatAlt2Icon />}>
      <div className="space-y-4">
        <p className="text-lg italic text-cyan-600 dark:text-cyan-300">"{SUMMARY_DATA.problem}"</p>
        <p>{SUMMARY_DATA.conclusion}</p>
        <ul className="pl-5 space-y-2 list-disc list-inside">
          {SUMMARY_DATA.conditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
        <p className="font-medium text-slate-800 dark:text-white bg-slate-200/50 dark:bg-white/10 p-4 rounded-lg border border-slate-300 dark:border-white/20">
          {SUMMARY_DATA.timeline}
        </p>
      </div>
    </SectionCard>
  );
};

export default SummarySection;