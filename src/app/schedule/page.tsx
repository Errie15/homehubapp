'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import CalendarView, { CalendarEvent } from '@/components/calendar/CalendarView';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

export default function SchedulePage() {
  const [scheduledTasks, setScheduledTasks] = useState<CalendarEvent[]>([
    { id: 1, title: 'Diska', assignedTo: 'Anna', dayOfWeek: 0, points: 10, category: 'Städning', isRecurring: true },
    { id: 2, title: 'Dammsuga', assignedTo: 'Erik', dayOfWeek: 1, points: 15, category: 'Städning', isRecurring: true },
    { id: 3, title: 'Handla mat', assignedTo: 'Anna', dayOfWeek: 2, points: 20, category: 'Inköp', isRecurring: true },
    { id: 4, title: 'Tvätta', assignedTo: 'Erik', dayOfWeek: 3, points: 25, category: 'Tvätt', startTime: '16:00', endTime: '17:00', isRecurring: true },
    { id: 5, title: 'Tömma diskmaskin', assignedTo: 'Anna', dayOfWeek: 4, points: 5, category: 'Städning', isRecurring: true },
    { id: 6, title: 'Städa badrum', assignedTo: 'Erik', dayOfWeek: 5, points: 20, category: 'Städning', isRecurring: true },
    { id: 7, title: 'Vattna blommor', assignedTo: 'Anna', dayOfWeek: 6, points: 5, category: 'Övrigt', isRecurring: true },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newTask, setNewTask] = useState<Partial<CalendarEvent>>({
    title: '',
    assignedTo: '',
    dayOfWeek: 0,
    points: 10,
    category: 'Städning',
    isRecurring: true
  });
  
  const members = ['Anna', 'Erik', 'Olivia', 'Johan'];
  const categories = ['Städning', 'Matlagning', 'Inköp', 'Tvätt', 'Underhåll', 'Övrigt'];
  const daysOfWeek = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

  const handleAddTask = () => {
    if (!newTask.title || !newTask.assignedTo || newTask.dayOfWeek === undefined) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    const taskToAdd: CalendarEvent = {
      id: Math.max(0, ...scheduledTasks.map(t => t.id)) + 1,
      title: newTask.title || '',
      assignedTo: newTask.assignedTo || '',
      dayOfWeek: newTask.dayOfWeek,
      points: newTask.points || 10,
      category: newTask.category || 'Städning',
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      isRecurring: newTask.isRecurring || false
    };

    setScheduledTasks([...scheduledTasks, taskToAdd]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteTask = (id: number) => {
    setScheduledTasks(scheduledTasks.filter(task => task.id !== id));
    setSelectedEvent(null);
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
      isRecurring: true
    });
  };

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
            if (selectedEvent) handleDeleteTask(selectedEvent.id);
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
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
              placeholder="Välj person"
              options={members.map(member => ({ value: member, label: member }))}
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
                value={newTask.startTime}
                onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
              />
              
              <Input
                id="endTime"
                label="Sluttid"
                type="time"
                value={newTask.endTime}
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
              value={newTask.points?.toString()}
              onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value)})}
            />
            
            <Select
              id="category"
              label="Kategori"
              value={newTask.category}
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