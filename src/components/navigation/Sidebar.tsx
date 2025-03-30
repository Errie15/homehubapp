"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { useAuthContext } from "@/components/providers/AuthProvider";
import HouseholdInvites from "@/components/notifications/HouseholdInvites";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Uppgifter", path: "/tasks", icon: "✅" },
    { name: "Schema", path: "/schedule", icon: "📅" },
    { name: "Belöningar", path: "/rewards", icon: "🏆" },
    { name: "Inställningar", path: "/settings", icon: "⚙️" },
  ];

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Användare";

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">HomeHub</h1>
        </div>
        
        {/* Visa hushållsinbjudningar om användaren är inloggad och har en email */}
        {user && user.email && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <HouseholdInvites userId={user.id} userEmail={user.email} />
          </div>
        )}
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.path
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/profile"
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              pathname === "/profile"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
            }`}
          >
            <Avatar
              size="sm"
              src={profile?.avatar_url || ""}
              name={userName}
              className="mr-3"
            />
            <span>{userName}</span>
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">HomeHub</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-64 h-full bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">HomeHub</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Visa hushållsinbjudningar i mobilmenyn */}
            {user && user.email && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <HouseholdInvites userId={user.id} userEmail={user.email} />
              </div>
            )}
            
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                        pathname === item.path
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/profile"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
                }`}
              >
                <Avatar
                  size="sm"
                  src={profile?.avatar_url || ""}
                  name={userName}
                  className="mr-3"
                />
                <span>{userName}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        <div className="md:hidden h-16"></div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 