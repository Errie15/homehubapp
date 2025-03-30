'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import { getHouseholdTasks, getHouseholdMembers, ensureUserHasHousehold, getRedeemedRewards } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Definiera typer för data från Supabase
type Task = {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  points: number;
  completed: boolean;
  category?: string;
};

type HouseholdMember = {
  id: string;
  full_name: string;
  name: string; // För kompatibilitet
  email: string;
  points: number;
  completed_tasks: number;
  avatar_url?: string;
  role?: string;
};

type RedeemedReward = {
  id: string;
  reward_id: string;
  user_id: string;
  created_at: string;
  rewards: {
    id: string;
    title: string | null;
    description: string | null;
    points_cost: number | null;
    image: string | null;
    household_id: string | null;
  };
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [householdPoints, setHouseholdPoints] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Hämta uppgifter för hushållet
        const { data: tasksData, error: tasksError } = await getHouseholdTasks(profile.household_id);
        
        if (tasksError) {
          console.error('Fel vid hämtning av uppgifter:', tasksError);
          setError(`Fel vid hämtning av uppgifter: ${tasksError.message || 'Okänt fel'}`);
        } else if (tasksData) {
          setTasks(tasksData as Task[]);
        }
        
        // Hämta alla medlemmar i hushållet för att få poängen
        const { data: members, error: membersError } = await getHouseholdMembers(profile.household_id);
          
        if (membersError) {
          console.error('Fel vid hämtning av medlemmar:', membersError);
          setError(`Fel vid hämtning av medlemmar: ${membersError.message || 'Okänt fel'}`);
        } else if (members) {
          // Om vi hade några medlemmar men listan är tom, fortsätt ändå
          if (members.length === 0) {
            console.log('Inga hushållsmedlemmar hittades, använder endast aktuell användare');
            // Skapa ett punktobjekt bara för den aktuella användaren
            const pointsObj: Record<string, number> = {};
            pointsObj[profile.full_name || profile.email || 'Du'] = profile.points || 0;
            setHouseholdPoints(pointsObj);
            setMembers([]);
          } else {
            // Skapa objekt med användarnamn och poäng
            const pointsObj: Record<string, number> = {};
            members.forEach((member: HouseholdMember) => {
              pointsObj[member.full_name || member.email] = member.points || 0;
            });
            setHouseholdPoints(pointsObj);
            setMembers(members);
            console.log('Hämtade hushållsmedlemmar:', members.length);
          }
        }

        // Hämta inlösta belöningar
        const { data: redeemedData, error: redeemedError } = await getRedeemedRewards(profile.household_id);
        
        if (redeemedError) {
          console.error('Fel vid hämtning av inlösta belöningar:', redeemedError);
          setError(`Fel vid hämtning av inlösta belöningar: ${redeemedError.message || 'Okänt fel'}`);
        } else if (redeemedData) {
          try {
            // Säkerställ att data följer förväntad struktur
            const processedData = redeemedData.map(item => {
              try {
                // Validera och säkerställ alla nödvändiga fält
                if (!item) return null;
                
                // Konvertera rewards till korrekt format om det är en array
                const rewards = Array.isArray(item.rewards) && item.rewards.length > 0 
                  ? item.rewards[0] 
                  : (item.rewards || {
                      id: item.reward_id || '',
                      title: 'Okänd belöning',
                      description: null,
                      points_cost: 0,
                      image: null,
                      household_id: profile.household_id || null
                    });
                    
                // Säkerställ profiles-objektet
                const profiles = item.profiles || {
                  id: item.user_id || 'unknown',
                  full_name: null,
                  email: 'användare',
                  avatar_url: null
                };
                
                return {
                  id: item.id || `temp-${Math.random().toString(36).substring(7)}`,
                  reward_id: item.reward_id || '',
                  user_id: item.user_id || '',
                  created_at: item.created_at || new Date().toISOString(),
                  rewards: rewards,
                  profiles: profiles
                } as RedeemedReward;
              } catch (itemError) {
                console.warn('Fel vid bearbetning av belöningsdata:', itemError);
                return null;
              }
            }).filter(Boolean) as RedeemedReward[]; // Filtrera bort null-värden
            
            setRedeemedRewards(processedData);
          } catch (processError) {
            console.error('Fel vid bearbetning av belöningar:', processError);
            // Fallback till tom lista om bearbetning misslyckas helt
            setRedeemedRewards([]);
          }
        }
      } catch (err: Error | unknown) {
        console.error('Oväntat fel vid datahämtning:', err);
        setError(`Oväntat fel: ${err instanceof Error ? err.message : 'Okänt fel'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [profile]);
  
  const completedTasksCount = tasks.filter(task => task.completed).length;
  const completionRate = tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0;

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.completed) return;
      
      // Uppdatera uppgiften i databasen
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      
      if (error) {
        console.error('Fel vid uppdatering av uppgift:', error);
        return;
      }
      
      // Om uppgiften har en tilldelad användare, tilldela poäng
      if (task.assigned_to) {
        // Hämta användarens nuvarande poäng
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', task.assigned_to)
          .single();
          
        if (userError) {
          console.error('Fel vid hämtning av användardata:', userError);
        } else if (userData) {
          // Beräkna nya poäng och uppdatera användarens profil
          const newPoints = (userData.points || 0) + task.points;
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', task.assigned_to);
            
          if (updateError) {
            console.error('Fel vid uppdatering av poäng:', updateError);
          } else {
            console.log(`Tilldelade ${task.points} poäng till användare ${task.assigned_to}`);
            
            // Uppdatera medlemslistan med nya poäng
            setMembers(prev => 
              prev.map(member => 
                member.id === task.assigned_to 
                  ? { ...member, points: newPoints, completed_tasks: member.completed_tasks + 1 }
                  : member
              )
            );
            
            // Uppdatera householdPoints
            const memberName = members.find(m => m.id === task.assigned_to)?.full_name || 
                               members.find(m => m.id === task.assigned_to)?.email || '';
            
            if (memberName) {
              setHouseholdPoints(prev => ({
                ...prev,
                [memberName]: (prev[memberName] || 0) + task.points
              }));
            }
          }
        }
      }
      
      // Uppdatera lokalt state för tasks
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, completed: true } : t)
      );
    } catch (err: Error | unknown) {
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
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Välkommen tillbaka!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Här är en översikt över vad som händer i ditt hushåll</p>
        </header>

        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Uppgifter</h2>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{completedTasksCount}</span>
              <span className="text-gray-600 dark:text-gray-400">av {tasks.length} avklarade</span>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Poäng</h2>
            {Object.keys(householdPoints).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(householdPoints).map(([name, points]) => (
                  <div key={name}>
                    <div className="flex justify-between mb-1">
                      <span>{name}</span>
                      <span className="font-semibold">{points} poäng</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${Math.min(100, (points / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Inga poäng att visa än</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Kommande</h2>
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-600 dark:text-gray-400">Nästa evenemang:</p>
            {profile?.household_id ? (
              <p className="font-medium">
                {tasks.filter(task => !task.completed)
                  .sort((a, b) => {
                    if (!a.due_date && !b.due_date) return 0;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  })[0]?.title || "Inga kommande händelser"}
              </p>
            ) : (
              <p className="font-medium">Inga kommande händelser</p>
            )}
          </div>
        </div>

        {/* Sektion för inlösta belöningar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Senaste belöningar</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {redeemedRewards.length > 0 ? (
              redeemedRewards.slice(0, 5).map((redeemed) => (
                <div key={redeemed.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xl">
                      {redeemed.rewards?.image || '🎁'}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">{redeemed.rewards?.title || 'Okänd belöning'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inlöst av {redeemed.profiles?.full_name || redeemed.profiles?.email || 'Okänd användare'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                      {redeemed.created_at ? new Date(redeemed.created_at).toLocaleDateString('sv-SE') : 'Okänt datum'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {redeemed.rewards?.points_cost || 0} poäng
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>Inga belöningar har lösts in ännu</p>
                <p className="text-sm mt-1">Gå till belöningssidan för att lösa in dina poäng</p>
              </div>
            )}
          </div>
          {redeemedRewards.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-center">
              <a 
                href="/rewards" 
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Visa alla belöningar
              </a>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Kommande uppgifter</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks
              .filter(task => !task.completed)
              .map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tilldelad: {householdPoints && Object.keys(householdPoints).find(name => 
                        members?.find(member => 
                          (member.id === task.assigned_to) && (member.full_name === name || member.email === name)
                        )
                      ) || (task.assigned_to ? 'Okänd användare' : 'Ingen')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{task.due_date}</span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {task.points} poäng
                    </span>
                    <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={() => handleCompleteTask(task.id)}>
                      ✓
                    </button>
                  </div>
                </div>
              ))}
              {tasks.filter(task => !task.completed).length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Inga kommande uppgifter
                </div>
              )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 