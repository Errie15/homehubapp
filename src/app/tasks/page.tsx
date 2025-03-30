'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import { supabase, getHouseholdMembers, ensureUserHasHousehold } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Task = {
  id: string;
  title: string;
  description: string;
  assigned_to?: string;
  assigned_name?: string; // För visning
  due_date: string;
  points: number;
  completed: boolean;
  category: string;
  household_id: string;
};

type Profile = {
  id: string;
  full_name?: string;
  name?: string; // För kompatibilitet
  email: string;
  avatar_url?: string;
  role?: string;
};

export default function TasksPage() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    points: 10,
    category: 'Städning'
  });

  const categories = ['Städning', 'Matlagning', 'Inköp', 'Tvätt', 'Underhåll', 'Övrigt'];

  useEffect(() => {
    async function fetchData() {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      try {
        // Om användaren inte har ett hushåll, försök skapa ett
        if (!profile.household_id) {
          setError('Användaren saknar hushåll. Försöker skapa ett...');
          
          // Försök skapa ett hushåll och uppdatera profilen
          const { data: updatedProfile, error: householdError } = await ensureUserHasHousehold(
            profile.id, 
            profile
          );
          
          // Även om det finns ett fel, kontrollera om vi fick ett hushålls-ID tillbaka
          // Detta händer när hushållet skapades men profilen inte kunde uppdateras i databasen
          const hasHouseholdId = updatedProfile?.household_id || false;
          
          if (householdError && !hasHouseholdId) {
            setError(`Kunde inte skapa hushåll: ${householdError.message || 'Okänt fel'}`);
            setLoading(false);
            return;
          } else if (householdError && hasHouseholdId) {
            // Hushållet skapades men kunde inte länkas permanent till profilen
            // Vi kan fortfarande använda det för denna session
            setError('Hushåll skapades, men kunde inte länkas permanent till profilen. Sessionen fortsätter temporärt.');
            profile.household_id = updatedProfile.household_id;
          } else if (!updatedProfile?.household_id) {
            setError('Kunde inte skapa hushåll för användaren');
            setLoading(false);
            return;
          } else {
            // Allt gick bra, uppdatera profilen
            profile.household_id = updatedProfile.household_id;
            setError(null);
          }
        }

        // Säkerställ att household_id finns innan vi fortsätter
        if (!profile.household_id) {
          setError('Användaren har fortfarande inget hushåll - kan inte fortsätta');
          setLoading(false);
          return;
        }

        // Hämta alla medlemmar i hushållet
        const { data: membersData, error: membersError } = await getHouseholdMembers(profile.household_id);
        
        if (membersError) {
          console.error('Fel vid hämtning av medlemmar:', membersError);
          setError(`Fel vid hämtning av medlemmar: ${membersError.message || 'Okänt fel'}`);
        } else if (membersData) {
          setMembers(membersData);
          console.log('Hämtade hushållsmedlemmar:', membersData.length);
        }
        
        // Hämta uppgifter för hushållet
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('household_id', profile.household_id);
          
        if (tasksError) {
          console.error('Fel vid hämtning av uppgifter:', tasksError);
          setError(`Fel vid hämtning av uppgifter: ${tasksError.message || 'Okänt fel'}`);
        } else if (tasksData) {
          // Lägg till displaynamn för tilldelade personer
          const enhancedTasks = await Promise.all(tasksData.map(async (task: Task) => {
            if (task.assigned_to) {
              const assignedMember = membersData.find(m => m.id === task.assigned_to);
              if (assignedMember) {
                return {
                  ...task,
                  assigned_name: assignedMember.full_name || assignedMember.email || 'Okänd'
                };
              }
              
              // Fallback om medlemmen inte hittades i den första frågan
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', task.assigned_to)
                .single();
              
              return {
                ...task,
                assigned_name: profileData?.full_name || profileData?.email || 'Okänd'
              };
            }
            return task;
          }));
          
          setTasks(enhancedTasks);
        }
      } catch (err: any) {
        console.error('Oväntat fel vid datahämtning:', err);
        setError(`Oväntat fel: ${err?.message || 'Okänt fel'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [profile]);

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !newTask.due_date || !profile?.household_id) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    try {
      // Skapa uppgift i databasen
      const { data: insertData, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || '',
          assigned_to: newTask.assigned_to,
          household_id: profile.household_id,
          due_date: newTask.due_date,
          points: newTask.points || 10,
          completed: false,
          category: newTask.category || 'Övrigt'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Fel vid tillägg av uppgift:', insertError);
        setError(`Fel vid tillägg av uppgift: ${insertError.message || 'Okänt fel'}`);
        return;
      }
      
      if (insertData) {
        // Hitta namnet på den tilldelade personen
        const assignedMember = members.find(m => m.id === newTask.assigned_to);
        const assignedName = assignedMember?.full_name || assignedMember?.email || 'Okänd';
        
        // Lägg till uppgiften i lokalt state
        setTasks([...tasks, {
          ...insertData,
          assigned_name: assignedName
        }]);
      }
      
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        points: 10,
        category: 'Städning'
      });
    } catch (err: any) {
      console.error('Oväntat fel vid tillägg av uppgift:', err);
      setError(`Oväntat fel vid tillägg av uppgift: ${err?.message || 'Okänt fel'}`);
    }
  };

  const handleToggleCompleted = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      // Uppdatera uppgiften i databasen
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);
      
      if (error) {
        console.error('Fel vid uppdatering av uppgift:', error);
        return;
      }
      
      // Uppdatera lokalt state
      setTasks(
        tasks.map(task => 
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    } catch (err) {
      console.error('Oväntat fel vid uppdatering av uppgift:', err);
    }
  };

  // Visa laddningsindikator när data hämtas
  if (loading) {
    return (
      <Sidebar>
        <div className="p-6 flex justify-center items-center h-full">
          <p>Laddar data...</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Uppgifter</h1>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setIsModalOpen(true)}  
          >
            + Lägg till uppgift
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Aktiva uppgifter</h2>
            <p className="text-3xl font-bold">{tasks.filter(t => !t.completed).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Avklarade uppgifter</h2>
            <p className="text-3xl font-bold">{tasks.filter(t => t.completed).length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Alla uppgifter</h2>
          </div>
          
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">Inga uppgifter hittades</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Skapa din första uppgift
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map(task => (
                <div key={task.id} className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleCompleted(task.id)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {task.points} poäng
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tilldelad: {task.assigned_name || 'Ingen'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Datum: {task.due_date}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Kategori: {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Skapa ny uppgift</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titel *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Titel på uppgiften"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Beskrivning
                  </label>
                  <textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Beskriv uppgiften"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tilldela till *
                  </label>
                  <select
                    id="assignedTo"
                    value={newTask.assigned_to || ''}
                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Välj person</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.full_name || member.email}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Förfallodatum *
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Poäng
                  </label>
                  <input
                    id="points"
                    type="number"
                    min="1"
                    max="100"
                    value={newTask.points}
                    onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <select
                    id="category"
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleAddTask}
                  className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Skapa uppgift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
} 