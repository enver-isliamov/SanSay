import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://ejzstikpkicmnfzyswzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqenN0aWtwa2ljbW5menlzd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTk5MzQsImV4cCI6MjA3NjE5NTkzNH0.F6gWGvr1tYDS5aveYO96MDEYIqMLUlw_GujZLnFSfV4';

// Инициализируем переменную для хранения клиента Supabase.
let supabaseInstance: SupabaseClient;

// Проверяем, были ли заменены значения-заполнители.
if (supabaseUrl.startsWith('ВАШ_') || supabaseAnonKey.startsWith('ВАШ_')) {
    // Выводим большое и заметное сообщение об ошибке в консоль.
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! ОШИБКА: Ключи Supabase не настроены.                  !!!");
    console.error("!!! Откройте файл supabaseClient.ts и замените           !!!");
    console.error("!!! 'ВАШ_SUPABASE_URL' и 'ВАШ_SUPABASE_ANON_KEY'          !!!");
    console.error("!!! на ваши настоящие ключи из панели Supabase.            !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    // Создаём "пустышку" (dummy client). Этот объект имитирует настоящий клиент Supabase,
    // но его методы ничего не делают или возвращают пустые значения.
    // Это ПРЕДОТВРАЩАЕТ СБОЙ ПРИЛОЖЕНИЯ при запуске, позволяя вам увидеть это сообщение.
    supabaseInstance = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOAuth: () => {
                alert('Ошибка: Supabase не настроен. Проверьте консоль разработчика (F12) для инструкций.');
                return Promise.resolve({ data: { provider: 'google', url: '' }, error: { name: 'config_error', message: 'Supabase not configured.'} });
            },
            signOut: () => Promise.resolve({ error: null }),
        },
        from: (table: string) => ({
             select: () => Promise.resolve({ data: [], error: { message: `Supabase not configured for table ${table}`, code: '400', details: '', hint: '' } }),
             upsert: (data: any) => Promise.resolve({ data, error: { message: `Supabase not configured for table ${table}`, code: '400', details: '', hint: '' } }),
        }),
    } as any;

} else {
    // Если ключи были заменены, создаём настоящий клиент.
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
