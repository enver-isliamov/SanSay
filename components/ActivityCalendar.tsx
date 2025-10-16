import React from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = new Set(history.map(log => {
      const date = new Date(log.date);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset).toDateString();
  }));

  const monthsToShow = 3;
  const dayGrid = [];
  const monthLabels = [];
  
  let currentDate = new Date(today);
  currentDate.setMonth(currentDate.getMonth() - monthsToShow + 1);
  currentDate.setDate(1);

  for (let i = 0; i < monthsToShow; i++) {
      monthLabels.push(currentDate.toLocaleString('ru-RU', { month: 'long' }));
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

      for (let j = 0; j < startDay; j++) {
          dayGrid.push(null);
      }
      for (let j = 1; j <= daysInMonth; j++) {
          dayGrid.push(new Date(year, month, j));
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="grid grid-rows-7 grid-flow-col gap-1.5">
        {weekDays.map(day => <div key={day} className="text-xs text-center text-slate-400 dark:text-gray-400">{day}</div>)}
        {dayGrid.map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="w-4 h-4 rounded-sm"></div>
            const isCompleted = workoutDates.has(day.toDateString());
            const isToday = day.toDateString() === today.toDateString();
            return (
                <div
                    key={day.toISOString()}
                    className={`w-4 h-4 rounded-sm transition-all
                        ${isCompleted ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700/50'}
                        ${isToday ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-cyan-400' : ''}
                    `}
                    title={day.toLocaleDateString('ru-RU')}
                />
            )
        })}
    </div>
  );
};

export default ActivityCalendar;
