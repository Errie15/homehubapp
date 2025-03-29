import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  children?: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Översikt',
      path: '/dashboard',
      icon: '📊',
    },
    {
      title: 'Uppgifter',
      path: '/tasks',
      icon: '✓',
    },
    {
      title: 'Schema',
      path: '/schedule',
      icon: '📅',
    },
    {
      title: 'Belöningar',
      path: '/rewards',
      icon: '🏆',
    },
    {
      title: 'Profil',
      path: '/profile',
      icon: '👤',
    },
    {
      title: 'Inställningar',
      path: '/settings',
      icon: '⚙️',
    },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            HomeHub
          </h2>
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    pathname === item.path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-6 py-6 mt-auto">
          <button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400">
            <span className="mr-3">🚪</span>
            <span>Logga ut</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
} 