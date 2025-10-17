import React from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDataByDate = new Map<string, { completed: number; total: number }>();
  // Защита: Убеждаемся, что history - это массив, прежде чем его обрабатывать
  if (Array.isArray(history)) {
    history.forEach(log => {
      // Защитное программирование: пропускаем некорректные записи
      if (!log || !log.date || isNaN(new Date(log.date).getTime())) {
        return; 
      }
      const date = new Date(log.date);
      const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
      
      const dayData = workoutDataByDate.get(dateStr) || { completed: 0, total: 0 };
      
      // Защита: Убеждаемся, что sessions - это массив, перед итерацией
      if (Array.isArray(log.sessions)) {
        log.sessions.forEach(session => {
            if (session && typeof session.completed === 'number' && typeof session.total === 'number') {
              dayData.completed += session.completed;
              dayData.total += session.total;
            }
        });
      }
      workoutDataByDate.set(dateStr, dayData);
    });
  }
  
  let startOfWeekOfFirstWorkout: Date | null = null;
  // Фильтруем некорректные данные перед их использованием
  const validHistory = Array.isArray(history) ? history.filter(log => log && log.date && !isNaN(new Date(log.date).getTime())) : [];

  if (validHistory.length > 0) {
      const sortedHistory = [...validHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstWorkoutDate = new Date(sortedHistory[0].date);
      firstWorkoutDate.setHours(0,0,0,0);
      
      const dayOfWeek = firstWorkoutDate.getDay(); // Sunday - 0, Monday - 1...
      const startOfWeekOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Смещение от понедельника
      
      startOfWeekOfFirstWorkout = new Date(firstWorkoutDate);
      startOfWeekOfFirstWorkout.setDate(firstWorkoutDate.getDate() - startOfWeekOffset);
  }

  const monthsToShow = 3;
  const dayGrid: (Date | null)[] = [];
  
  let currentDate = new Date();
  currentDate.setDate(1);

  for (let i = 0; i < monthsToShow; i++) {
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

  const getIntensityClass = (date: Date): string => {
    const dayData = workoutDataByDate.get(date.toDateString());
    if (!dayData || dayData.total === 0) {
      return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80';
    }
    const percentage = (dayData.completed / dayData.total) * 100;
    if (percentage > 75) return 'bg-cyan-500';
    if (percentage > 50) return 'bg-cyan-400';
    if (percentage > 25) return 'bg-cyan-300';
    return 'bg-cyan-200';
  }

  return (
    <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8 pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5">
            {weekDays.map(day => <div key={day} className="w-5 h-5 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400 font-medium">{day}</div>)}
            {dayGrid.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="w-5 h-5 rounded-sm"></div>
                
                const isToday = day.toDateString() === today.toDateString();
                let cellClass = '';
                
                if (startOfWeekOfFirstWorkout && day < startOfWeekOfFirstWorkout) {
                    cellClass = 'bg-slate-200 dark:bg-slate-700/50';
                } else {
                    cellClass = getIntensityClass(day);
                }

                const dayData = workoutDataByDate.get(day.toDateString());
                const hasWorkout = !!dayData && dayData.total > 0;
                const textColorClass = hasWorkout
                    ? 'text-white/80'
                    : 'text-slate-400 dark:text-gray-500';

                return (
                    <div
                        key={day.toISOString()}
                        className={`w-5 h-5 rounded-sm transition-all flex items-center justify-center
                            ${cellClass}
                            ${isToday ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-cyan-400' : ''}
                        `}
                        title={day.toLocaleDateString('ru-RU')}
                    >
                      <span className={`text-[9px] font-medium leading-none ${textColorClass}`}>
                        {day.getDate()}
                      </span>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default ActivityCalendar;
