import React from 'react';
import SectionCard from './SectionCard';
import { SYMPTOMS_DATA } from '../constants';
import { ChartBarIcon } from './icons/ChartBarIcon';

const SymptomsSection: React.FC = () => {
  return (
    <SectionCard title="Связь симптомов и причин" icon={<ChartBarIcon />}>
      {/* Mobile and Tablet View: Cards */}
      <div className="space-y-6 md:hidden">
        {SYMPTOMS_DATA.map((item, index) => (
          <div key={index} className="bg-slate-100/50 dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10">
            <h3 className="font-semibold text-cyan-600 dark:text-cyan-300 mb-2">{item.symptom}</h3>
            <p className="text-sm mb-1"><strong className="text-slate-500 dark:text-gray-400">Причина:</strong> {item.cause}</p>
            <p className="text-sm mb-1"><strong className="text-slate-500 dark:text-gray-400">Последствие:</strong> {item.consequence}</p>
            <p className="text-sm"><strong className="text-slate-500 dark:text-gray-400">Что делать:</strong> {item.action}</p>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 dark:border-white/20">
              <th className="p-3 font-semibold text-cyan-600 dark:text-cyan-300">Симптом</th>
              <th className="p-3 font-semibold text-cyan-600 dark:text-cyan-300">Основная причина</th>
              <th className="p-3 font-semibold text-cyan-600 dark:text-cyan-300">Последствие при бездействии</th>
              <th className="p-3 font-semibold text-cyan-600 dark:text-cyan-300">Что делать</th>
            </tr>
          </thead>
          <tbody>
            {SYMPTOMS_DATA.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 dark:border-white/10 last:border-b-0">
                <td className="p-3 font-medium text-slate-800 dark:text-white">{item.symptom}</td>
                <td className="p-3">{item.cause}</td>
                <td className="p-3">{item.consequence}</td>
                <td className="p-3">{item.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default SymptomsSection;