'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';

type Member = {
  id: number;
  name: string;
  points: number;
  avatar: string;
};

type Reward = {
  id: number;
  title: string;
  description: string;
  pointsCost: number;
  image: string;
};

export default function RewardsPage() {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'Anna', points: 120, avatar: '👩' },
    { id: 2, name: 'Erik', points: 85, avatar: '👨' },
    { id: 3, name: 'Olivia', points: 65, avatar: '👧' },
    { id: 4, name: 'Johan', points: 95, avatar: '👦' },
  ]);

  const [rewards] = useState<Reward[]>([
    { 
      id: 1, 
      title: 'Välj fredagsmys', 
      description: 'Bestäm vad ni ska äta och titta på under fredagskvällen', 
      pointsCost: 50,
      image: '🍕'
    },
    { 
      id: 2, 
      title: 'Sovmorgon', 
      description: 'Slipp morgonsysslorna en helgdag', 
      pointsCost: 75,
      image: '😴'
    },
    { 
      id: 3, 
      title: 'Restaurangbesök', 
      description: 'Middag ute på valfri restaurang', 
      pointsCost: 150,
      image: '🍽️'
    },
    { 
      id: 4, 
      title: 'Fri från disken', 
      description: 'Slipp diska i en vecka', 
      pointsCost: 100,
      image: '🧼'
    },
    { 
      id: 5, 
      title: 'En önskning', 
      description: 'Välj en aktivitet som hela hushållet ska göra tillsammans', 
      pointsCost: 200,
      image: '✨'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const handleRedeemReward = () => {
    if (!selectedReward || selectedMember === null) return;
    
    const member = members.find(m => m.id === selectedMember);
    if (!member || member.points < selectedReward.pointsCost) return;
    
    // Uppdatera poäng för den valda medlemmen
    setMembers(
      members.map(m => 
        m.id === selectedMember 
          ? { ...m, points: m.points - selectedReward.pointsCost } 
          : m
      )
    );
    
    setIsModalOpen(false);
    setSelectedReward(null);
    setSelectedMember(null);
    
    // Här skulle man kunna visa en bekräftelse eller historik över inlösta belöningar
  };

  return (
    <Sidebar>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Belöningar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Lös in dina poäng mot roliga belöningar</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Poängställning</h2>
            </div>
            <div className="p-6 space-y-4">
              {members.map(member => (
                <div key={member.id} className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xl">
                    {member.avatar}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium">{member.name}</h3>
                    <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${Math.min(100, (member.points / 200) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 font-bold">
                    {member.points} p
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Statistik</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totala poäng denna månad</h3>
                  <p className="text-2xl font-bold mt-2">
                    {members.reduce((sum, member) => sum + member.points, 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Genomsnittliga poäng</h3>
                  <p className="text-2xl font-bold mt-2">
                    {Math.round(members.reduce((sum, member) => sum + member.points, 0) / members.length)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Främsta deltagare</h3>
                  <p className="text-2xl font-bold mt-2">
                    {members.reduce((top, member) => 
                      member.points > top.points ? member : top
                    , members[0]).name}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inlösta belöningar</h3>
                  <p className="text-2xl font-bold mt-2">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Tillgängliga belöningar</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map(reward => (
                <div 
                  key={reward.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                  onClick={() => {
                    setSelectedReward(reward);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-6 flex items-center justify-center text-5xl">
                    {reward.image}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{reward.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reward.description}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {reward.pointsCost} poäng
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                        Lös in
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Lös in belöning</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">{selectedReward.image}</span>
                </div>
                <h3 className="font-semibold text-lg">{selectedReward.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedReward.description}</p>
                <div className="mt-3 text-center">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
                    {selectedReward.pointsCost} poäng
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Välj vem som löser in belöningen
                </label>
                <select
                  id="member"
                  value={selectedMember || ''}
                  onChange={(e) => setSelectedMember(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Välj person</option>
                  {members.map(member => (
                    <option 
                      key={member.id} 
                      value={member.id}
                      disabled={member.points < selectedReward.pointsCost}
                    >
                      {member.name} ({member.points} poäng)
                      {member.points < selectedReward.pointsCost ? ' - Inte tillräckligt med poäng' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedReward(null);
                    setSelectedMember(null);
                  }}
                  className="py-2 px-4 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleRedeemReward}
                  disabled={!selectedMember || (selectedMember && members.find(m => m.id === selectedMember)?.points || 0) < selectedReward.pointsCost}
                  className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lös in belöning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
} 