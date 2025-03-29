'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';

type Task = {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  points: number;
  completed: boolean;
  category: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Diska',
      description: 'Diska allt i diskhon',
      assignedTo: 'Anna',
      dueDate: '2023-03-30',
      points: 10,
      completed: false,
      category: 'Städning'
    },
    {
      id: 2,
      title: 'Dammsuga',
      description: 'Dammsug vardagsrummet och hallen',
      assignedTo: 'Erik',
      dueDate: '2023-03-31',
      points: 15,
      completed: true,
      category: 'Städning'
    },
    {
      id: 3,
      title: 'Handla mat',
      description: 'Köp ingredienser till veckans måltider',
      assignedTo: 'Anna',
      dueDate: '2023-04-01',
      points: 20,
      completed: false,
      category: 'Inköp'
    },
    {
      id: 4,
      title: 'Tvätta',
      description: 'Tvätta och häng upp kläder',
      assignedTo: 'Erik',
      dueDate: '2023-04-02',
      points: 25,
      completed: false,
      category: 'Tvätt'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    points: 10,
    category: 'Städning'
  });

  const members = ['Anna', 'Erik', 'Olivia', 'Johan'];
  const categories = ['Städning', 'Matlagning', 'Inköp', 'Tvätt', 'Underhåll', 'Övrigt'];

  const handleAddTask = () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    const taskToAdd: Task = {
      id: Math.max(0, ...tasks.map(t => t.id)) + 1,
      title: newTask.title || '',
      description: newTask.description || '',
      assignedTo: newTask.assignedTo || '',
      dueDate: newTask.dueDate || '',
      points: newTask.points || 10,
      completed: false,
      category: newTask.category || 'Övrigt'
    };

    setTasks([...tasks, taskToAdd]);
    setIsModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      points: 10,
      category: 'Städning'
    });
  };

  const handleToggleCompleted = (id: number) => {
    setTasks(
      tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <Sidebar>
      <div className="p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Uppgifter</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Hantera ditt hushålls uppgifter</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lägg till uppgift
          </button>
        </header>

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
                          Tilldelad: {task.assignedTo}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Datum: {task.dueDate}
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
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Förfallodatum *
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
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