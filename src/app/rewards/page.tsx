'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import { supabase, getHouseholdMembers, ensureUserHasHousehold } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Member = {
  id: string;
  full_name?: string;
  name?: string; // För kompatibilitet
  email: string;
  points: number;
  avatar_url?: string;
  role?: string;
};

type Reward = {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  image: string;
  household_id: string;
};

export default function RewardsPage() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemedCount, setRedeemedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      try {
        // Om användaren inte har ett hushåll, försök skapa ett
        if (!profile.household_id) {
          setError('Användaren saknar hushåll. Försöker skapa ett...');
          
          // Försök skapa ett hushåll och uppdatera profilen
          const { data: updatedProfile, error: householdError } = await ensureUserHasHousehold(
            profile.id, 
            profile
          );
          
          // Även om det finns ett fel, kontrollera om vi fick ett hushålls-ID tillbaka
          // Detta händer när hushållet skapades men profilen inte kunde uppdateras i databasen
          const hasHouseholdId = updatedProfile?.household_id || false;
          
          if (householdError && !hasHouseholdId) {
            setError(`Kunde inte skapa hushåll: ${householdError.message || 'Okänt fel'}`);
            setLoading(false);
            return;
          } else if (householdError && hasHouseholdId) {
            // Hushållet skapades men kunde inte länkas permanent till profilen
            // Vi kan fortfarande använda det för denna session
            setError('Hushåll skapades, men kunde inte länkas permanent till profilen. Sessionen fortsätter temporärt.');
            profile.household_id = updatedProfile.household_id;
          } else if (!updatedProfile?.household_id) {
            setError('Kunde inte skapa hushåll för användaren');
            setLoading(false);
            return;
          } else {
            // Allt gick bra, uppdatera profilen
            profile.household_id = updatedProfile.household_id;
            setError(null);
          }
        }

        // Säkerställ att household_id finns innan vi fortsätter
        if (!profile.household_id) {
          setError('Användaren har fortfarande inget hushåll - kan inte fortsätta');
          setLoading(false);
          return;
        }

        // Hämta alla medlemmar i hushållet
        const { data: membersData, error: membersError } = await getHouseholdMembers(profile.household_id);
        
        if (membersError) {
          console.error('Fel vid hämtning av medlemmar:', membersError);
          setError(`Fel vid hämtning av medlemmar: ${membersError.message || 'Okänt fel'}`);
        } else if (membersData) {
          setMembers(membersData);
          console.log('Hämtade hushållsmedlemmar:', membersData.length);
        }
        
        // Hämta belöningar för hushållet
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('household_id', profile.household_id);
          
        if (rewardsError) {
          console.error('Fel vid hämtning av belöningar:', rewardsError);
          setError(`Fel vid hämtning av belöningar: ${rewardsError.message || 'Okänt fel'}`);
        } else if (rewardsData) {
          setRewards(rewardsData);
        }
        
        // Hämta antal inlösta belöningar för statistik
        const { count, error: countError } = await supabase
          .from('redeemed_rewards')
          .select('id', { count: 'exact' })
          .in('user_id', membersData?.map(m => m.id) || []);
          
        if (countError) {
          console.error('Fel vid hämtning av inlösta belöningar:', countError);
          setError(`Fel vid hämtning av inlösta belöningar: ${countError.message || 'Okänt fel'}`);
        } else if (count !== null) {
          setRedeemedCount(count);
        }
      } catch (err: any) {
        console.error('Oväntat fel vid datahämtning:', err);
        setError(`Oväntat fel: ${err?.message || 'Okänt fel'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [profile]);

  const handleRedeemReward = async () => {
    if (!selectedReward || !selectedMember) return;
    
    const member = members.find(m => m.id === selectedMember);
    if (!member || member.points < selectedReward.points_cost) return;
    
    try {
      // Minska poäng för medlemmen
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: member.points - selectedReward.points_cost })
        .eq('id', selectedMember);
        
      if (updateError) {
        console.error('Fel vid uppdatering av poäng:', updateError);
        return;
      }
      
      // Registrera inlöst belöning
      const { error: insertError } = await supabase
        .from('redeemed_rewards')
        .insert({ reward_id: selectedReward.id, user_id: selectedMember });
        
      if (insertError) {
        console.error('Fel vid registrering av inlöst belöning:', insertError);
        return;
      }
      
      // Uppdatera lokal data
      setMembers(
        members.map(m => 
          m.id === selectedMember 
            ? { ...m, points: m.points - selectedReward.points_cost } 
            : m
        )
      );
      
      setRedeemedCount(prev => prev + 1);
    } catch (err) {
      console.error('Oväntat fel vid inlösning:', err);
    }
    
    setIsModalOpen(false);
    setSelectedReward(null);
    setSelectedMember(null);
  };

  // Visa laddningsindikator när data hämtas
  if (loading) {
    return (
      <Sidebar>
        <div className="p-6 flex justify-center items-center h-full">
          <p>Laddar data...</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Belöningar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Lös in dina poäng mot roliga belöningar</p>
        </header>

        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Poängställning</h2>
            </div>
            <div className="p-6 space-y-4">
              {members.map(member => (
                <div key={member.id} className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xl">
                    {member.avatar_url || (member.full_name?.[0] || member.email[0])}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium">{member.full_name || member.email}</h3>
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
              {members.length === 0 && (
                <div className="text-center text-gray-500">
                  Inga medlemmar tillagda
                </div>
              )}
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
                    {members.length > 0 
                      ? Math.round(members.reduce((sum, member) => sum + member.points, 0) / members.length) 
                      : 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Främsta deltagare</h3>
                  <p className="text-2xl font-bold mt-2">
                    {members.length > 0 
                      ? (members.reduce((top, member) => 
                          member.points > top.points ? member : top
                        , members[0]).full_name || members[0].email)
                      : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inlösta belöningar</h3>
                  <p className="text-2xl font-bold mt-2">{redeemedCount}</p>
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
                        {reward.points_cost} poäng
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                        Lös in
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {rewards.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  Inga belöningar tillagda
                </div>
              )}
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
                    {selectedReward.points_cost} poäng
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
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Välj person</option>
                  {members.map(member => (
                    <option 
                      key={member.id} 
                      value={member.id}
                      disabled={member.points < selectedReward.points_cost}
                    >
                      {member.full_name || member.email} ({member.points} poäng)
                      {member.points < selectedReward.points_cost ? ' - Inte tillräckligt med poäng' : ''}
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
                  disabled={!selectedMember || (selectedMember && members.find(m => m.id === selectedMember)?.points || 0) < selectedReward.points_cost}
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