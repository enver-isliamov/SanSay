
import React from 'react';
import SectionCard from './SectionCard';
import { RECOMMENDATIONS } from '../constants';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { BeakerIcon } from './icons/BeakerIcon';

const icons = [<ClipboardListIcon key="1"/>, <BeakerIcon key="2"/>];

const RecommendationsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {RECOMMENDATIONS.map((rec, index) => (
            <SectionCard key={rec.title} title={rec.title} icon={icons[index]}>
                <ul className="space-y-3 list-disc list-inside">
                    {rec.points.map((point, pointIndex) => (
                        <li key={pointIndex}>
                            {point}
                        </li>
                    ))}
                </ul>
            </SectionCard>
        ))}
    </div>
  );
};

export default RecommendationsSection;
