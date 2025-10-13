// Fix: Create the TipOfTheDayCard component to resolve module errors. This component fetches a daily tip using the Gemini API.
import React from 'react';
import SectionCard from './SectionCard';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { GoogleGenAI } from '@google/genai';

const TipOfTheDayCard: React.FC = () => {
    const [tip, setTip] = React.useState<string>('Загрузка совета дня...');
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTip = async () => {
            try {
                // Fix: Initialize the GoogleGenAI client with the API key from environment variables as per guidelines.
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                // Fix: Call generateContent with the correct model ('gemini-2.5-flash') and content.
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: 'Дай короткий (2-3 предложения) и полезный совет дня на русском языке для человека, восстанавливающегося после травмы спины. Совет должен быть мотивирующим и практичным.',
                    config: {
                        temperature: 0.7,
                    }
                });
                
                // Fix: Extract the generated text using the .text property on the response as per guidelines.
                const text = response.text;
                if (text) {
                    setTip(text);
                } else {
                     throw new Error("No text returned from API");
                }
            } catch (e) {
                console.error("Failed to fetch tip of the day", e);
                setError("Не удалось загрузить совет. Пожалуйста, попробуйте позже.");
                // Fallback tip in case of an error
                setTip("Регулярно делайте перерывы и разминку, если у вас сидячая работа. Это улучшит кровообращение и снизит нагрузку на позвоночник.");
            }
        };

        fetchTip();
    }, []);

    return (
        <SectionCard title="Совет дня" icon={<LightBulbIcon />}>
            {error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <p className="italic text-slate-600 dark:text-gray-300">
                    {tip}
                </p>
            )}
        </SectionCard>
    );
};

export default TipOfTheDayCard;
