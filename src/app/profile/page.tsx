'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  points: number;
  completedTasks: number;
  joinedDate: string;
  avatar?: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Erik Andersson',
    email: 'erik@example.com',
    role: 'Förälder',
    points: 245,
    completedTasks: 32,
    joinedDate: '2023-01-15',
    preferences: {
      notifications: true,
      darkMode: false,
      language: 'sv',
    }
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editableProfile, setEditableProfile] = useState<UserProfile>(profile);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'preferences'>('overview');
  
  const handleSaveProfile = () => {
    setProfile(editableProfile);
    setIsEditModalOpen(false);
  };
  
  const badges = [
    { title: "Mästerstädare", description: "Slutfört 10 städuppgifter", icon: "🧹", earned: true },
    { title: "Flitiga myran", description: "Slutfört 5 uppgifter på en vecka", icon: "🐜", earned: true },
    { title: "Tvättexpert", description: "Slutfört 5 tvättuppgifter", icon: "👕", earned: false },
    { title: "Stjärnkock", description: "Slutfört 5 matlagningsuppgifter", icon: "👨‍🍳", earned: false },
  ];

  const recentActivity = [
    { task: "Diska", date: "2023-03-28", points: 10 },
    { task: "Dammsuga", date: "2023-03-27", points: 15 },
    { task: "Handla mat", date: "2023-03-25", points: 20 },
    { task: "Tvätta", date: "2023-03-22", points: 25 },
  ];

  return (
    <Sidebar>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Hantera din användarprofil och inställningar</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Vänster sidofält */}
          <div className="col-span-1">
            <Card className="mb-6">
              <div className="flex flex-col items-center text-center p-4">
                <Avatar 
                  name={profile.name} 
                  size="xl" 
                  src={profile.avatar} 
                  className="mb-4" 
                />
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile.role}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                  Medlem sedan {new Date(profile.joinedDate).toLocaleDateString('sv-SE')}
                </p>
                
                <div className="w-full mt-6">
                  <Button fullWidth onClick={() => setIsEditModalOpen(true)}>
                    Redigera profil
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card title="Poäng och bedrifter">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {profile.points}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Totala poäng</p>
                
                <div className="mt-4 text-4xl font-bold text-green-600 dark:text-green-400">
                  {profile.completedTasks}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Avklarade uppgifter</p>
              </div>
            </Card>
          </div>
          
          {/* Huvudinnehåll */}
          <div className="col-span-1 md:col-span-3">
            {/* Flikar */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setActiveTab('overview')}
              >
                Översikt
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setActiveTab('stats')}
              >
                Statistik
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'preferences' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setActiveTab('preferences')}
              >
                Inställningar
              </button>
            </div>
            
            {/* Översiktsflik */}
            {activeTab === 'overview' && (
              <div>
                <Card title="Senaste aktiviteter" className="mb-6">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Inga aktiviteter ännu
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="py-3 flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{activity.task}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(activity.date).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            +{activity.points} poäng
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                
                <Card title="Märken">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                    {badges.map((badge, index) => (
                      <div 
                        key={index} 
                        className={`p-4 text-center border rounded-lg ${
                          badge.earned 
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50'
                        }`}
                      >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <h3 className="font-medium">{badge.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {badge.description}
                        </p>
                        {!badge.earned && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 inline-block">
                            Ej upplåst
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            
            {/* Statistikflik */}
            {activeTab === 'stats' && (
              <Card title="Statistik">
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Statistik över uppgifter och poäng kommer snart.
                  </p>
                </div>
              </Card>
            )}
            
            {/* Inställningsflik */}
            {activeTab === 'preferences' && (
              <Card title="Inställningar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div>
                      <h3 className="font-medium">Notifikationer</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Få meddelanden om nya uppgifter och påminnelser
                      </p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input 
                        type="checkbox" 
                        id="toggle-notifications" 
                        className="sr-only"
                        checked={profile.preferences.notifications}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              notifications: e.target.checked
                            }
                          });
                        }}
                      />
                      <label 
                        htmlFor="toggle-notifications" 
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          profile.preferences.notifications 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span 
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            profile.preferences.notifications 
                              ? 'translate-x-4' 
                              : 'translate-x-0'
                          }`} 
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h3 className="font-medium">Mörkt läge</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Använd mörkt tema för appen
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="toggle-darkmode" 
                          className="sr-only"
                          checked={profile.preferences.darkMode}
                          onChange={(e) => {
                            setProfile({
                              ...profile,
                              preferences: {
                                ...profile.preferences,
                                darkMode: e.target.checked
                              }
                            });
                          }}
                        />
                        <label 
                          htmlFor="toggle-darkmode" 
                          className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                            profile.preferences.darkMode 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span 
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                              profile.preferences.darkMode 
                                ? 'translate-x-4' 
                                : 'translate-x-0'
                            }`} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="px-2">
                      <h3 className="font-medium">Språk</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Välj språk för appen
                      </p>
                      <select 
                        className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                        value={profile.preferences.language}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              language: e.target.value
                            }
                          });
                        }}
                      >
                        <option value="sv">Svenska</option>
                        <option value="en">Engelska</option>
                        <option value="fi">Finska</option>
                        <option value="no">Norska</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Redigera profil modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Redigera profil"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleSaveProfile}
            >
              Spara
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Namn"
            value={editableProfile.name}
            onChange={(e) => setEditableProfile({...editableProfile, name: e.target.value})}
            required
          />
          
          <Input
            id="email"
            label="E-post"
            type="email"
            value={editableProfile.email}
            onChange={(e) => setEditableProfile({...editableProfile, email: e.target.value})}
            required
          />
          
          <Input
            id="role"
            label="Roll"
            value={editableProfile.role}
            onChange={(e) => setEditableProfile({...editableProfile, role: e.target.value})}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profilbild
            </label>
            <div className="flex items-center">
              <Avatar 
                name={editableProfile.name} 
                size="md" 
                src={editableProfile.avatar} 
                className="mr-4" 
              />
              <Button variant="outline" size="sm">
                Byt bild
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}
