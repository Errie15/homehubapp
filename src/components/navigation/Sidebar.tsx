import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  children?: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Kontrollera skärmstorlek
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

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

  // Hitta aktuell sidans titel
  const currentPageTitle = menuItems.find(item => item.path === pathname)?.title || 'HomeHub';

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Desktop sidebar - dölj på mobil */}
      <aside className={`${isMobile ? 'hidden' : 'w-64'} border-r border-gray-200 dark:border-gray-800 overflow-y-auto`}>
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

      <div className="flex flex-col flex-1">
        {/* Mobile header - visa bara på mobil */}
        {isMobile && (
          <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center shadow-sm">
            <h1 className="text-lg font-bold text-center w-full text-gray-800 dark:text-white">
              {currentPageTitle}
            </h1>
          </header>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-28 md:pb-0">
          {children}
        </main>

        {/* Bottom Navigation Bar för mobil - iOS-stil */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 w-full z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around pt-3 pb-8 shadow-lg">
            {menuItems.slice(0, 5).map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center px-2 rounded-2xl transition-colors ${
                  pathname === item.path 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
} 