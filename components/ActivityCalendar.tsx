import React from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Data Preparation ---
  const workoutDataByDate = new Map<string, { completed: number; total: number }>();
  history.forEach(log => {
    const date = new Date(log.date);
    // Adjust for timezone to get the correct date string
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const dateStr = new Date(date.getTime() + userTimezoneOffset).toDateString();
    
    const dayData = workoutDataByDate.get(dateStr) || { completed: 0, total: 0 };
    log.sessions.forEach(session => {
        dayData.completed += session.completed;
        dayData.total += session.total;
    });
    workoutDataByDate.set(dateStr, dayData);
  });
  
  // --- Find First Workout Date (without mutating props) ---
  let firstWorkoutDate: Date | null = null;
  if (history.length > 0) {
      // FIX: Create a shallow copy using `[...history]` before sorting to avoid mutating state/props.
      // This resolves a bug that could prevent the Profile view from rendering correctly.
      const sortedHistory = [...history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortedHistory.length > 0 && sortedHistory[0].date) {
        firstWorkoutDate = new Date(sortedHistory[0].date);
        firstWorkoutDate.setHours(0,0,0,0);
      }
  }

  // --- Grid Generation (3 Months into the future) ---
  const monthsToShow = 3;
  const dayGrid: (Date | null)[] = [];
  
  let currentDate = new Date(today);
  currentDate.setDate(1); // Start from the beginning of the current month

  for (let i = 0; i < monthsToShow; i++) {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Pad the beginning of the month to align with the correct day of the week
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday is 0

      for (let j = 0; j < startDayOffset; j++) {
          dayGrid.push(null);
      }
      for (let j = 1; j <= daysInMonth; j++) {
          dayGrid.push(new Date(year, month, j));
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // --- Helper Functions ---
  const getIntensityClass = (date: Date): string => {
    const dayData = workoutDataByDate.get(date.toDateString());
    if (!dayData || dayData.total === 0) {
      return 'bg-slate-100 dark:bg-slate-800/50 ring-1 ring-inset ring-slate-200 dark:ring-slate-700';
    }
    const percentage = (dayData.completed / dayData.total) * 100;
    if (percentage > 75) return 'bg-cyan-500';
    if (percentage > 50) return 'bg-cyan-400';
    if (percentage > 25) return 'bg-cyan-300';
    return 'bg-cyan-200';
  }

  return (
    <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8 pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1">
            {weekDays.map(day => <div key={day} className="w-3 h-3 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400">{day}</div>)}
            {dayGrid.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="w-3 h-3 rounded-sm"></div>
                
                let dayClass = '';
                const isTodayFlag = day.toDateString() === today.toDateString();

                if (firstWorkoutDate && day < firstWorkoutDate) {
                    // Days before the user started: empty and gray
                    dayClass = 'bg-slate-200 dark:bg-slate-700/50 opacity-50';
                } else {
                    if (workoutDataByDate.has(day.toDateString())) {
                        // Workout day: colored by intensity
                        dayClass = getIntensityClass(day);
                    } else {
                        // Future/rest days: light gray with a border
                        dayClass = 'bg-slate-100 dark:bg-slate-800/50 ring-1 ring-inset ring-slate-200 dark:ring-slate-700';
                    }
                }

                return (
                    <div
                        key={day.toISOString()}
                        className={`w-3 h-3 rounded-sm transition-all
                            ${dayClass}
                            ${isTodayFlag ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-cyan-400' : ''}
                        `}
                        title={day.toLocaleDateString('ru-RU')}
                    />
                )
            })}
        </div>
    </div>
  );
};

export default ActivityCalendar;
