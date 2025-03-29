'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';

export default function DashboardPage() {
  // Demo-data för att visualisera dashboarden
  const [tasks] = useState([
    { id: 1, title: 'Diska', assignedTo: 'Anna', dueDate: '2023-03-30', completed: false, points: 10 },
    { id: 2, title: 'Dammsuga', assignedTo: 'Erik', dueDate: '2023-03-31', completed: true, points: 15 },
    { id: 3, title: 'Handla mat', assignedTo: 'Anna', dueDate: '2023-04-01', completed: false, points: 20 },
    { id: 4, title: 'Tvätta', assignedTo: 'Erik', dueDate: '2023-04-02', completed: false, points: 25 },
  ]);

  const [householdPoints] = useState({
    'Anna': 80,
    'Erik': 75
  });

  const completedTasksCount = tasks.filter(task => task.completed).length;
  const completionRate = (completedTasksCount / tasks.length) * 100;

  return (
    <Sidebar>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Välkommen tillbaka!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Här är en översikt över vad som händer i ditt hushåll</p>
        </header>

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
                      style={{ width: `${(points / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Kommande</h2>
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-600 dark:text-gray-400">Nästa evenemang:</p>
            <p className="font-medium">Storstädning på lördag</p>
          </div>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tilldelad: {task.assignedTo}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{task.dueDate}</span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {task.points} poäng
                    </span>
                    <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      ✓
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 