'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import CalendarView, { CalendarEvent } from '@/components/calendar/CalendarView';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { supabase, getHouseholdMembers, ensureUserHasHousehold } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type ScheduledTask = {
  id: string;
  title: string;
  assigned_to?: string;
  day_of_week: number;
  start_time?: string;
  end_time?: string;
  points: number;
  category?: string;
  is_recurring: boolean;
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

export default function SchedulePage() {
  const { user, profile } = useAuth();
  const [scheduledTasks, setScheduledTasks] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newTask, setNewTask] = useState<Partial<CalendarEvent>>({
    title: '',
    assignedTo: '',
    dayOfWeek: 0,
    points: 10,
    category: 'Städning',
    isRecurring: true,
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categories = ['Städning', 'Matlagning', 'Inköp', 'Tvätt', 'Underhåll', 'Övrigt'];
  const daysOfWeek = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

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
        
        // Hämta schemalagda uppgifter för hushållet
        const { data: tasksData, error: tasksError } = await supabase
          .from('scheduled_tasks')
          .select('*')
          .eq('household_id', profile.household_id);
          
        if (tasksError) {
          console.error('Fel vid hämtning av schemalagda uppgifter:', tasksError);
          setError(`Fel vid hämtning av schemalagda uppgifter: ${tasksError.message || 'Okänt fel'}`);
        } else if (tasksData) {
          // Konvertera från DB-format till CalendarEvent-format
          const formattedTasks: CalendarEvent[] = await Promise.all(tasksData.map(async (task: ScheduledTask) => {
            // Hämta namn på tilldelad person om det finns ett assigned_to
            let assignedName = '';
            if (task.assigned_to) {
              const assignedMember = membersData.find((m: Profile) => m.id === task.assigned_to);
              if (assignedMember) {
                assignedName = assignedMember.full_name || assignedMember.email || 'Okänd';
              } else {
                // Fallback om medlemmen inte hittades i den första frågan
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('full_name, email')
                  .eq('id', task.assigned_to)
                  .single();
                
                assignedName = profileData?.full_name || profileData?.email || 'Okänd';
              }
            }
            
            return {
              id: task.id,
              title: task.title,
              assignedTo: assignedName,
              dayOfWeek: task.day_of_week,
              points: task.points,
              category: task.category || 'Övrigt',
              startTime: task.start_time,
              endTime: task.end_time,
              isRecurring: task.is_recurring
            };
          }));
          
          setScheduledTasks(formattedTasks);
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
    if (!newTask.title || !newTask.assignedTo || newTask.dayOfWeek === undefined || !profile?.household_id) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    try {
      // Hitta assigned_to id baserat på namn eller e-post
      const member = members.find((m: Profile) => m.full_name === newTask.assignedTo || m.email === newTask.assignedTo);
      
      // Skapa uppgift i databasen
      const { data: insertData, error: insertError } = await supabase
        .from('scheduled_tasks')
        .insert({
          title: newTask.title,
          assigned_to: member?.id,
          household_id: profile.household_id,
          day_of_week: newTask.dayOfWeek,
          start_time: newTask.startTime,
          end_time: newTask.endTime,
          points: newTask.points || 10,
          category: newTask.category,
          is_recurring: newTask.isRecurring || false
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Fel vid tillägg av schemalagd uppgift:', insertError);
        setError(`Fel vid tillägg av schemalagd uppgift: ${insertError.message || 'Okänt fel'}`);
        return;
      }
      
      if (insertData) {
        // Lägg till uppgiften i lokalt state
        const newCalendarEvent: CalendarEvent = {
          id: insertData.id,
          title: insertData.title,
          assignedTo: newTask.assignedTo || '',
          dayOfWeek: insertData.day_of_week,
          points: insertData.points,
          category: insertData.category || 'Övrigt',
          startTime: insertData.start_time,
          endTime: insertData.end_time,
          isRecurring: insertData.is_recurring
        };
        
        setScheduledTasks([...scheduledTasks, newCalendarEvent]);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Oväntat fel vid tillägg av uppgift:', err);
      setError(`Oväntat fel vid tillägg av uppgift: ${err?.message || 'Okänt fel'}`);
    }
  };

  const handleDeleteTask = async (id: string | number) => {
    if (typeof id === 'number') {
      console.error('ID är ett nummer istället för en sträng:', id);
      return;
    }
    
    try {
      // Ta bort uppgift från databasen
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Fel vid borttagning av schemalagd uppgift:', error);
        return;
      }
      
      // Uppdatera lokalt state
      setScheduledTasks(scheduledTasks.filter(task => task.id !== id));
      setSelectedEvent(null);
    } catch (err) {
      console.error('Oväntat fel vid borttagning av uppgift:', err);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleAddClick = (dayOfWeek: number) => {
    resetForm();
    setNewTask({ ...newTask, dayOfWeek });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setNewTask({
      title: '',
      assignedTo: '',
      dayOfWeek: 0,
      points: 10,
      category: 'Städning',
      isRecurring: true,
      startTime: '',
      endTime: ''
    });
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

  const modalActions = (
    <>
      <Button 
        variant="outline" 
        onClick={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        Avbryt
      </Button>
      {selectedEvent ? (
        <Button 
          variant="danger" 
          onClick={() => {
            if (selectedEvent) handleDeleteTask(selectedEvent.id as string);
            setIsModalOpen(false);
          }}
        >
          Ta bort
        </Button>
      ) : (
        <Button 
          onClick={handleAddTask}
          disabled={!newTask.title || !newTask.assignedTo}
        >
          Lägg till
        </Button>
      )}
    </>
  );

  return (
    <Sidebar>
      <div className="p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Veckoschema</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Planera och schemalägg ditt hushålls uppgifter
            </p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Lägg till i schema
          </Button>
        </header>

        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
          </div>
        )}

        <Card>
          <CalendarView
            events={scheduledTasks}
            onEventClick={handleEventClick}
            onAddClick={handleAddClick}
            onDeleteEvent={handleDeleteTask}
          />
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedEvent ? 'Uppgiftsdetaljer' : 'Lägg till i schemat'}
        actions={modalActions}
      >
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Titel</p>
                <p className="font-medium">{selectedEvent.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tilldelad till</p>
                <p>{selectedEvent.assignedTo}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dag</p>
                <p>{daysOfWeek[selectedEvent.dayOfWeek]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Poäng</p>
                <p>{selectedEvent.points} poäng</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kategori</p>
                <p>{selectedEvent.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upprepning</p>
                <p>{selectedEvent.isRecurring ? 'Ja' : 'Nej'}</p>
              </div>
            </div>
            
            {selectedEvent.startTime && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Starttid</p>
                  <p>{selectedEvent.startTime}</p>
                </div>
                {selectedEvent.endTime && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sluttid</p>
                    <p>{selectedEvent.endTime}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              id="title"
              label="Titel"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Titel på uppgiften"
              required
            />
            
            <Select
              id="assignedTo"
              label="Tilldela till"
              value={newTask.assignedTo || ""}
              onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
              placeholder="Välj person"
              options={members.map((member: Profile) => ({ 
                value: member.full_name || member.email || "", 
                label: member.full_name || member.email || "" 
              }))}
              required
            />
            
            <Select
              id="dayOfWeek"
              label="Dag"
              value={newTask.dayOfWeek?.toString()}
              onChange={(e) => setNewTask({...newTask, dayOfWeek: parseInt(e.target.value)})}
              options={daysOfWeek.map((day, index) => ({ value: index.toString(), label: day }))}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="startTime"
                label="Starttid"
                type="time"
                value={newTask.startTime || ""}
                onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
              />
              
              <Input
                id="endTime"
                label="Sluttid"
                type="time"
                value={newTask.endTime || ""}
                onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                disabled={!newTask.startTime}
              />
            </div>
            
            <Input
              id="points"
              label="Poäng"
              type="number"
              min="0"
              max="100"
              value={newTask.points?.toString() || "10"}
              onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
            />
            
            <Select
              id="category"
              label="Kategori"
              value={newTask.category || "Städning"}
              onChange={(e) => setNewTask({...newTask, category: e.target.value})}
              options={categories.map(category => ({ value: category, label: category }))}
            />
            
            <div className="flex items-center mt-4">
              <input
                id="isRecurring"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={newTask.isRecurring}
                onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Återkommande varje vecka
              </label>
            </div>
          </div>
        )}
      </Modal>
    </Sidebar>
  );
} 