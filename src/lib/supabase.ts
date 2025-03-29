import { createClient } from '@supabase/supabase-js';

// Dessa värden måste ersättas med riktiga Supabase-uppgifter vid deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Hjälpfunktioner för autentisering
export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email: string, password: string, fullName: string) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

// Type för task data
type TaskData = {
  title: string;
  description?: string;
  due_date?: string;
  status?: string;
  assigned_to?: string;
  user_id?: string;
  household_id?: string;
  points?: number;
  [key: string]: unknown;
};

// Grundläggande databasinteraktioner
export async function createTask(taskData: TaskData) {
  return await supabase
    .from('tasks')
    .insert(taskData);
}

export async function updateTask(id: string, taskData: TaskData) {
  return await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', id);
}

export async function deleteTask(id: string) {
  return await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
}

export async function getTasks(userId: string) {
  return await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
}

export async function getHouseholdTasks(householdId: string) {
  return await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId);
}

export async function getUserProfile(userId: string) {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
} 