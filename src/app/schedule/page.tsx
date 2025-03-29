'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';

type ScheduledTask = {
  id: number;
  title: string;
  assignedTo: string;
  dayOfWeek: number; // 0-6 för söndag-lördag
  points: number;
  category: string;
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
};

export default function SchedulePage() {
  const daysOfWeek = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
  
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    { id: 1, title: 'Diska', assignedTo: 'Anna', dayOfWeek: 0, points: 10, category: 'Städning', isRecurring: true },
    { id: 2, title: 'Dammsuga', assignedTo: 'Erik', dayOfWeek: 1, points: 15, category: 'Städning', isRecurring: true },
    { id: 3, title: 'Handla mat', assignedTo: 'Anna', dayOfWeek: 2, points: 20, category: 'Inköp', isRecurring: true },
    { id: 4, title: 'Tvätta', assignedTo: 'Erik', dayOfWeek: 3, points: 25, category: 'Tvätt', startTime: '16:00', endTime: '17:00', isRecurring: true },
    { id: 5, title: 'Tömma diskmaskin', assignedTo: 'Anna', dayOfWeek: 4, points: 5, category: 'Städning', isRecurring: true },
    { id: 6, title: 'Städa badrum', assignedTo: 'Erik', dayOfWeek: 5, points: 20, category: 'Städning', isRecurring: true },
    { id: 7, title: 'Vattna blommor', assignedTo: 'Anna', dayOfWeek: 6, points: 5, category: 'Övrigt', isRecurring: true },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<ScheduledTask>>({
    title: '',
    assignedTo: '',
    dayOfWeek: 0,
    points: 10,
    category: 'Städning',
    isRecurring: true
  });
  
  const members = ['Anna', 'Erik', 'Olivia', 'Johan'];
  const categories = ['Städning', 'Matlagning', 'Inköp', 'Tvätt', 'Underhåll', 'Övrigt'];

  const handleAddTask = () => {
    if (!newTask.title || !newTask.assignedTo || newTask.dayOfWeek === undefined) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    const taskToAdd: ScheduledTask = {
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
    setNewTask({
      title: '',
      assignedTo: '',
      dayOfWeek: 0,
      points: 10,
      category: 'Städning',
      isRecurring: true
    });
  };

  const getTasksByDay = (day: number) => {
    return scheduledTasks.filter(task => task.dayOfWeek === day);
  };

  const handleDeleteTask = (id: number) => {
    setScheduledTasks(scheduledTasks.filter(task => task.id !== id));
  };

  return (
    <Sidebar>
      <div className="p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Veckoschema</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Planera och schemalägg ditt hushålls uppgifter</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lägg till i schema
          </button>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
            {daysOfWeek.map((day, index) => (
              <div key={day} className="min-w-[120px]">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center">
                  <h2 className="font-semibold">{day}</h2>
                </div>
                <div className="p-2 h-[500px] overflow-y-auto">
                  {getTasksByDay(index).length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <p>Inga uppgifter</p>
                      <button
                        onClick={() => {
                          setNewTask({...newTask, dayOfWeek: index});
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        + Lägg till
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getTasksByDay(index).map(task => (
                        <div 
                          key={task.id} 
                          className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{task.title}</h3>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {task.assignedTo}
                          </p>
                          {task.startTime && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {task.startTime} {task.endTime && `- ${task.endTime}`}
                            </p>
                          )}
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.category}
                            </span>
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                              {task.points} poäng
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Lägg till i schemat</h2>
              
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
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tilldela till *
                  </label>
                  <select
                    id="assignedTo"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Välj person</option>
                    {members.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dag *
                  </label>
                  <select
                    id="dayOfWeek"
                    value={newTask.dayOfWeek}
                    onChange={(e) => setNewTask({...newTask, dayOfWeek: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={day} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Starttid
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      value={newTask.startTime}
                      onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sluttid
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      value={newTask.endTime}
                      onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
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
                
                <div className="flex items-center">
                  <input
                    id="isRecurring"
                    type="checkbox"
                    checked={newTask.isRecurring}
                    onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Återkommande varje vecka
                  </label>
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
                  Lägg till
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
} 