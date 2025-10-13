import React from 'react';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className = '', titleClassName = 'text-2xl sm:text-3xl' }) => {
  return (
    <section className={`bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6 sm:p-8 ${className}`}>
      <div className="flex items-center mb-6">
        {icon && <div className="mr-4 text-cyan-500 dark:text-cyan-400">{icon}</div>}
        <h2 className={`${titleClassName} font-bold text-slate-800 dark:text-white`}>{title}</h2>
      </div>
      <div className="text-slate-600 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
};

export default SectionCard;