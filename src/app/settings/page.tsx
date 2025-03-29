'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

type ThemeMode = 'light' | 'dark' | 'system';
type NotificationType = 'all' | 'important' | 'none';
type MemberType = 'adult' | 'teenager' | 'child';

interface HouseholdSettings {
  householdName: string;
  members: {
    id: number;
    name: string;
    type: MemberType;
    email?: string;
    avatar?: string;
  }[];
  theme: ThemeMode;
  notifications: NotificationType;
  language: string;
  deleteAfterDays: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<HouseholdSettings>({
    householdName: 'Anderssons',
    members: [
      { id: 1, name: 'Erik Andersson', type: 'adult', email: 'erik@example.com' },
      { id: 2, name: 'Anna Andersson', type: 'adult', email: 'anna@example.com' },
      { id: 3, name: 'Olivia Andersson', type: 'teenager' },
      { id: 4, name: 'Johan Andersson', type: 'child' },
    ],
    theme: 'system',
    notifications: 'all',
    language: 'sv',
    deleteAfterDays: 30,
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', type: 'adult', email: '' });
  
  const [activeSection, setActiveSection] = useState<'general' | 'members' | 'system' | 'advanced'>('general');
  
  const [confirmDeleteHousehold, setConfirmDeleteHousehold] = useState(false);
  
  const languages = [
    { value: 'sv', label: 'Svenska' },
    { value: 'en', label: 'Engelska' },
    { value: 'fi', label: 'Finska' },
    { value: 'no', label: 'Norska' },
  ];

  const handleAddMember = () => {
    if (!newMember.name) return;
    
    const newId = Math.max(0, ...settings.members.map(m => m.id)) + 1;
    
    setSettings({
      ...settings,
      members: [
        ...settings.members,
        { 
          id: newId, 
          name: newMember.name,
          type: newMember.type as MemberType,
          email: newMember.email || undefined
        }
      ]
    });
    
    setNewMember({ name: '', type: 'adult', email: '' });
    setShowAddMemberModal(false);
  };
  
  const handleRemoveMember = (id: number) => {
    setSettings({
      ...settings,
      members: settings.members.filter(member => member.id !== id)
    });
  };
  
  const getMemberTypeText = (type: MemberType) => {
    const typeLabels: Record<MemberType, string> = {
      'adult': 'Vuxen',
      'teenager': 'Tonåring',
      'child': 'Barn'
    };
    return typeLabels[type] || type;
  };

  return (
    <Sidebar>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Inställningar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Anpassa och konfigurera din hemsida</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Vänster navigering */}
          <div className="col-span-1">
            <Card>
              <nav className="p-2">
                <button
                  onClick={() => setActiveSection('general')}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                    activeSection === 'general' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Allmänt
                </button>
                <button
                  onClick={() => setActiveSection('members')}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                    activeSection === 'members' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Medlemmar
                </button>
                <button
                  onClick={() => setActiveSection('system')}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                    activeSection === 'system' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  System
                </button>
                <button
                  onClick={() => setActiveSection('advanced')}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                    activeSection === 'advanced' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Avancerat
                </button>
              </nav>
            </Card>
          </div>
          
          {/* Huvudinnehåll */}
          <div className="col-span-1 md:col-span-3">
            {/* Allmänna inställningar */}
            {activeSection === 'general' && (
              <Card title="Allmänna inställningar">
                <div className="space-y-6">
                  <div>
                    <Input
                      id="householdName"
                      label="Hushållsnamn"
                      value={settings.householdName}
                      onChange={(e) => setSettings({...settings, householdName: e.target.value})}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Namnet på ditt hushåll som visas i appen.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Språk
                    </label>
                    <Select
                      id="language"
                      options={languages}
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Språket som används i hela appen.
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Medlemmar */}
            {activeSection === 'members' && (
              <>
                <Card 
                  title="Medlemmar" 
                  footer={
                    <Button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="w-full sm:w-auto"
                    >
                      Lägg till medlem
                    </Button>
                  }
                >
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {settings.members.map(member => (
                      <div key={member.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p>{getMemberTypeText(member.type)}</p>
                            {member.email && <p>{member.email}</p>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                          >
                            Redigera
                          </Button>
                          <Button 
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Ta bort
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {settings.members.length === 0 && (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Inga medlemmar i hushållet ännu.
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
            
            {/* Systeminställningar */}
            {activeSection === 'system' && (
              <Card title="Systeminställningar">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tema
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="theme-light"
                          name="theme"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.theme === 'light'}
                          onChange={() => setSettings({...settings, theme: 'light'})}
                        />
                        <label htmlFor="theme-light" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Ljust läge
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="theme-dark"
                          name="theme"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.theme === 'dark'}
                          onChange={() => setSettings({...settings, theme: 'dark'})}
                        />
                        <label htmlFor="theme-dark" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Mörkt läge
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="theme-system"
                          name="theme"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.theme === 'system'}
                          onChange={() => setSettings({...settings, theme: 'system'})}
                        />
                        <label htmlFor="theme-system" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Följ systemet
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notifikationer
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="notifications-all"
                          name="notifications"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.notifications === 'all'}
                          onChange={() => setSettings({...settings, notifications: 'all'})}
                        />
                        <label htmlFor="notifications-all" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Alla notifikationer
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notifications-important"
                          name="notifications"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.notifications === 'important'}
                          onChange={() => setSettings({...settings, notifications: 'important'})}
                        />
                        <label htmlFor="notifications-important" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Enbart viktiga
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notifications-none"
                          name="notifications"
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={settings.notifications === 'none'}
                          onChange={() => setSettings({...settings, notifications: 'none'})}
                        />
                        <label htmlFor="notifications-none" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          Inga notifikationer
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Avancerade inställningar */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <Card title="Datahantering">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="deleteAfterDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ta bort avklarade uppgifter efter
                      </label>
                      <div className="flex items-center">
                        <input
                          id="deleteAfterDays"
                          type="number"
                          min="1"
                          max="365"
                          value={settings.deleteAfterDays}
                          onChange={(e) => setSettings({...settings, deleteAfterDays: parseInt(e.target.value) || 30})}
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">dagar</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Avklarade uppgifter kommer automatiskt att tas bort efter denna tidsperiod.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline">
                        Exportera data
                      </Button>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Ladda ner all din data som en JSON-fil.
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card title="Farlig zon" className="border-red-200 dark:border-red-900">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium text-red-600 dark:text-red-400">Ta bort hushåll</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Om du tar bort ditt hushåll kommer all relaterad data att raderas permanent. Denna åtgärd kan inte ångras.
                      </p>
                      <div className="mt-4">
                        <Button 
                          variant="danger"
                          onClick={() => setConfirmDeleteHousehold(true)}
                        >
                          Ta bort hushåll
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Lägg till medlem modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Lägg till medlem"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setShowAddMemberModal(false)}
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!newMember.name}
            >
              Lägg till
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="memberName"
            label="Namn"
            value={newMember.name}
            onChange={(e) => setNewMember({...newMember, name: e.target.value})}
            required
          />
          
          <Select
            id="memberType"
            label="Typ"
            options={[
              { value: 'adult', label: 'Vuxen' },
              { value: 'teenager', label: 'Tonåring' },
              { value: 'child', label: 'Barn' },
            ]}
            value={newMember.type}
            onChange={(e) => setNewMember({...newMember, type: e.target.value})}
          />
          
          <Input
            id="memberEmail"
            label="E-post"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember({...newMember, email: e.target.value})}
            helperText="Valfritt för tonåringar och barn"
          />
        </div>
      </Modal>
      
      {/* Bekräfta radering modal */}
      <Modal
        isOpen={confirmDeleteHousehold}
        onClose={() => setConfirmDeleteHousehold(false)}
        title="Bekräfta borttagning"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteHousehold(false)}
            >
              Avbryt
            </Button>
            <Button 
              variant="danger"
              onClick={() => {
                alert('Hushåll borttaget (simulerad)');
                setConfirmDeleteHousehold(false);
              }}
            >
              Ta bort permanent
            </Button>
          </>
        }
      >
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Är du säker på att du vill ta bort ditt hushåll <span className="font-semibold">{settings.householdName}</span>?
          </p>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="text-red-600 dark:text-red-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Varning</h3>
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  <p>
                    Denna åtgärd kommer permanent att radera all data kopplad till ditt hushåll, inklusive:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Alla medlemmar</li>
                    <li>Alla uppgifter</li>
                    <li>Schemaläggningar</li>
                    <li>Poänghistorik</li>
                    <li>Belöningar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}
