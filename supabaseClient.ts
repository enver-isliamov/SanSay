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

const supabaseUrl = 'ВАШ_SUPABASE_URL';
const supabaseAnonKey = 'ВАШ_SUPABASE_ANON_KEY';

if (supabaseUrl === 'ВАШ_SUPABASE_URL' || supabaseAnonKey === 'ВАШ_SUPABASE_ANON_KEY') {
    console.warn("Supabase не настроен! Пожалуйста, обновите supabaseClient.ts вашими ключами проекта.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
