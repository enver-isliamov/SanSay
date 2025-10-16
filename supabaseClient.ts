// =========================================================================================
// ВАЖНО: ИНСТРУКЦИЯ ПО НАСТРОЙКЕ SUPABASE
// =========================================================================================
// Этот файл содержит ОБРАЗЕЦ конфигурации. Чтобы аутентификация и сохранение
// данных работали, вам нужно заменить его на ваши настоящие ключи из
// ВАШЕГО НОВОГО ПРОЕКТА SUPABASE.
//
// 1. Зайдите на сайт https://supabase.com/ и создайте новый проект.
// 2. В панели управления проектом перейдите в "Project Settings" (иконка шестерёнки).
// 3. Выберите раздел "API".
// 4. Скопируйте "Project URL" и вставьте его вместо 'ВАШ_SUPABASE_URL'.
// 5. Скопируйте "Project API keys" -> "anon" (public) ключ и вставьте его вместо 'ВАШ_SUPABASE_ANON_KEY'.
// =========================================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqenN0aWtwa2ljbW5menlzd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTk5MzQsImV4cCI6MjA3NjE5NTkzNH0.F6gWGvr1tYDS5aveYO96MDEYIqMLUlw_GujZLnFSfV4';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqenN0aWtwa2ljbW5menlzd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTk5MzQsImV4cCI6MjA3NjE5NTkzNH0.F6gWGvr1tYDS5aveYO96MDEYIqMLUlw_GujZLnFSfV4';

if (supabaseUrl === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqenN0aWtwa2ljbW5menlzd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTk5MzQsImV4cCI6MjA3NjE5NTkzNH0.F6gWGvr1tYDS5aveYO96MDEYIqMLUlw_GujZLnFSfV4' || supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqenN0aWtwa2ljbW5menlzd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTk5MzQsImV4cCI6MjA3NjE5NTkzNH0.F6gWGvr1tYDS5aveYO96MDEYIqMLUlw_GujZLnFSfV4') {
    console.warn("Supabase не настроен! Пожалуйста, обновите supabaseClient.ts вашими ключами проекта.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
