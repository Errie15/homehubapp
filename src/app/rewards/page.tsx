'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase, ensureUserHasHousehold, getHouseholdMembers, getRedeemedRewards } from '@/lib/supabase';

type Member = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  points: number;
};

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image: string | null;
  household_id: string;
};

type RedeemedReward = {
  id: string;
  reward_id: string;
  user_id: string;
  created_at: string;
  rewards: {
    id: string;
    title: string | null;
    description: string | null;
    points_cost: number | null;
    image: string | null;
    household_id: string | null;
  };
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};

export default function RewardsPage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemedCount, setRedeemedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [newReward, setNewReward] = useState<{
    title: string;
    description: string;
    points_cost: number;
    image: string;
  }>({
    title: '',
    description: '',
    points_cost: 100,
    image: '🎁'
  });

  // Lista med emoji-ikoner för belöningar
  const rewardIcons = ['🎁', '🏆', '🎮', '📱', '🍕', '🍦', '🎬', '🎯', '🎨', '📚', '🧸', '🎭', '🎪', '🎠', '🎡'];

  // Funktion för att beräkna topprankad medlem på ett säkert sätt
  const getTopMemberName = (): string => {
    if (members.length === 0) return '-';
    
    let topPoints = -1;
    let topName = '-';
    
    for (const member of members) {
      if (member.points > topPoints) {
        topPoints = member.points;
        topName = member.full_name || member.email || '-';
      }
    }
    
    return topName;
  };

  useEffect(() => {
    async function fetchData() {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      try {
        // Om användaren inte har ett hushåll, försök skapa ett
        if (!profile.household_id) {
          const { data: householdData, error: householdError } = await ensureUserHasHousehold(
            profile.id, 
            profile
          );
          
          if (householdError) {
            console.error('Fel vid skapande av hushåll:', householdError);
            setError(`Fel vid skapande av hushåll: ${householdError.message || 'Okänt fel'}`);
            setLoading(false);
            return;
          }
          
          if (householdData) {
            profile.household_id = householdData.household_id;
          }
        }
        
        // Hämta medlemmar i hushållet från den centrala funktionen
        if (!profile.household_id) {
          console.error('Inget hushåll att hämta medlemmar från');
          setError('Inget hushåll att hämta medlemmar från');
          setLoading(false);
          return;
        }
        
        const { data: membersData, error: membersError } = await getHouseholdMembers(profile.household_id);
        
        if (membersError) {
          console.error('Fel vid hämtning av medlemmar:', membersError);
          setError(`Fel vid hämtning av medlemmar: ${membersError.message || 'Okänt fel'}`);
        } else if (membersData) {
          setMembers(membersData);
          console.log('Hämtade hushållsmedlemmar:', membersData.length);
        } else {
          console.log('Inga hushållsmedlemmar hittades');
          setMembers([]);
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

        // Hämta inlösta belöningar
        const { data: redeemedData, error: redeemedError } = await getRedeemedRewards(profile.household_id);
        
        if (redeemedError) {
          console.error('Fel vid hämtning av inlösta belöningar:', redeemedError);
          setError(`Fel vid hämtning av inlösta belöningar: ${redeemedError.message || 'Okänt fel'}`);
        } else if (redeemedData) {
          try {
            // Säkerställ att data följer förväntad struktur
            const processedData = redeemedData.map(item => {
              try {
                // Validera och säkerställ alla nödvändiga fält
                if (!item) return null;
                
                // Konvertera rewards till korrekt format om det är en array
                const rewards = Array.isArray(item.rewards) && item.rewards.length > 0 
                  ? item.rewards[0] 
                  : (item.rewards || {
                      id: item.reward_id || '',
                      title: 'Okänd belöning',
                      description: null,
                      points_cost: 0,
                      image: null,
                      household_id: profile.household_id || null
                    });
                    
                // Säkerställ profiles-objektet
                const profiles = item.profiles || {
                  id: item.user_id || 'unknown',
                  full_name: null,
                  email: 'användare',
                  avatar_url: null
                };
                
                return {
                  id: item.id || `temp-${Math.random().toString(36).substring(7)}`,
                  reward_id: item.reward_id || '',
                  user_id: item.user_id || '',
                  created_at: item.created_at || new Date().toISOString(),
                  rewards: rewards,
                  profiles: profiles
                } as RedeemedReward;
              } catch (itemError) {
                console.warn('Fel vid bearbetning av belöningsdata:', itemError);
                return null;
              }
            }).filter(Boolean) as RedeemedReward[]; // Filtrera bort null-värden
            
            setRedeemedRewards(processedData);
          } catch (processError) {
            console.error('Fel vid bearbetning av belöningar:', processError);
            // Fallback till tom lista om bearbetning misslyckas helt
            setRedeemedRewards([]);
          }
        }
        
        // Hämta antal inlösta belöningar för statistik
        if (membersData && membersData.length > 0) {
          try {
            const { count, error: countError } = await supabase
              .from('redeemed_rewards')
              .select('id', { count: 'exact' })
              .in('user_id', membersData.map((m: Member) => m.id));
              
            if (countError) {
              console.error('Fel vid hämtning av inlösta belöningar:', countError);
              setError(`Fel vid hämtning av inlösta belöningar: ${countError.message || 'Okänt fel'}`);
            } else if (count !== null) {
              setRedeemedCount(count);
            }
          } catch (err: unknown) {
            console.error('Fel vid statistikberäkning för belöningar:', err);
          }
        } else {
          setRedeemedCount(0);
        }
      } catch (err: unknown) {
        console.error('Oväntat fel vid datahämtning:', err);
        setError(`Oväntat fel: ${err instanceof Error ? err.message : 'Okänt fel'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [profile]);

  const handleRedeemReward = async () => {
    if (!selectedReward || !selectedMember) return;
    
    const member = members.find((m: Member) => m.id === selectedMember);
    if (!member || member.points < selectedReward.points_cost) return;
    
    try {
      // Minska poäng för medlemmen
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: member.points - selectedReward.points_cost })
        .eq('id', selectedMember);
        
      if (updateError) {
        console.error('Fel vid uppdatering av poäng:', updateError);
        setError(`Fel vid uppdatering av poäng: ${updateError.message || JSON.stringify(updateError) || 'Okänt fel'}`);
        return;
      }
      
      // Registrera inlöst belöning
      const { data: insertData, error: insertError } = await supabase
        .from('redeemed_rewards')
        .insert({ reward_id: selectedReward.id, user_id: selectedMember })
        .select(`
          id,
          reward_id,
          user_id
        `)
        .single();
        
      if (insertError) {
        console.error('Fel vid registrering av inlöst belöning:', insertError);
        setError(`Fel vid registrering av inlöst belöning: ${insertError.message || JSON.stringify(insertError) || 'Okänt fel'}`);
        return;
      }
      
      // Uppdatera lokal data
      setMembers(
        members.map((m: Member) => 
          m.id === selectedMember 
            ? { ...m, points: m.points - selectedReward.points_cost } 
            : m
        )
      );
      
      setRedeemedCount(prev => prev + 1);
      
      // Lägg till den nya inlösta belöningen i listan med korrekt format
      if (insertData) {
        try {
          const newRedeemedReward: RedeemedReward = {
            id: insertData.id,
            reward_id: insertData.reward_id,
            user_id: insertData.user_id,
            created_at: new Date().toISOString(),
            rewards: {
              id: selectedReward.id,
              title: selectedReward.title,
              description: selectedReward.description,
              points_cost: selectedReward.points_cost,
              image: selectedReward.image,
              household_id: selectedReward.household_id
            },
            profiles: {
              id: selectedMember,
              full_name: member.full_name || null,
              email: member.email || null,
              avatar_url: member.avatar_url || null
            }
          };
          
          setRedeemedRewards(prev => [newRedeemedReward, ...prev]);
        } catch (formatErr) {
          console.error('Fel vid formatering av ny inlöst belöning:', formatErr);
          // Även om formatering misslyckas fortsätter vi, eftersom data redan har sparats i databasen
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Okänt fel';
      console.error('Oväntat fel vid inlösning:', err);
      setError(`Oväntat fel vid inlösning: ${errorMsg}`);
    }
    
    setIsModalOpen(false);
    setSelectedReward(null);
    setSelectedMember(null);
  };

  // Funktion för att lägga till en belöning
  const handleAddReward = async () => {
    if (!newReward.title || !newReward.points_cost || !profile?.household_id) {
      return; // Validera att obligatoriska fält är ifyllda
    }

    try {
      // Skapa belöning i databasen
      const { data: insertData, error: insertError } = await supabase
        .from('rewards')
        .insert({
          title: newReward.title,
          description: newReward.description || null,
          points_cost: newReward.points_cost,
          image: newReward.image || null,
          household_id: profile.household_id
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Fel vid tillägg av belöning:', insertError);
        setError(`Fel vid tillägg av belöning: ${insertError.message || 'Okänt fel'}`);
        return;
      }
      
      if (insertData) {
        // Lägg till belöningen i lokalt state
        setRewards([...rewards, insertData]);
      }
      
      // Återställ formuläret och stäng modalen
      setIsCreateModalOpen(false);
      setNewReward({
        title: '',
        description: '',
        points_cost: 100,
        image: '🎁'
      });
    } catch (err: unknown) {
      console.error('Oväntat fel vid skapande av belöning:', err);
      setError(`Oväntat fel: ${err instanceof Error ? err.message : 'Okänt fel'}`);
    }
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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Belöningar</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Lös in dina poäng mot roliga belöningar</p>
          </div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Lägg till belöning
          </button>
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
                    {getTopMemberName()}
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tillgängliga belöningar</h2>
            <button 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Lägg till ny
            </button>
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
                    {reward.image || '🎁'}
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
                  <p>Inga belöningar tillagda</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Skapa din första belöning
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sektion för inlösta belöningar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Inlösta belöningar</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {redeemedRewards.length > 0 ? (
                redeemedRewards.map((redeemed) => (
                  <div key={redeemed.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xl">
                        {redeemed.rewards.image || '🎁'}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium">{redeemed.rewards?.title || 'Okänd belöning'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Inlöst av {redeemed.profiles?.full_name || redeemed.profiles?.email || 'Okänd användare'} • {redeemed.created_at ? new Date(redeemed.created_at).toLocaleDateString('sv-SE') : 'Okänt datum'}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {redeemed.rewards?.points_cost || 0} poäng
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Inga inlösta belöningar ännu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal för att lösa in belöning */}
      {isModalOpen && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Lös in belöning</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">{selectedReward.image || '🎁'}</span>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Välj vem som löser in belöningen
                </label>
                <select 
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
                    </option>
                  ))}
                </select>
                
                {selectedMember && (() => {
                  const member = members.find(m => m.id === selectedMember);
                  if (member && member.points < selectedReward.points_cost) {
                    return (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Denna person har inte tillräckligt med poäng för att lösa in belöningen.
                      </p>
                    );
                  }
                  return null;
                })()}
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
                  disabled={!selectedMember || (() => {
                    const member = members.find(m => m.id === selectedMember);
                    return !member || member.points < selectedReward.points_cost;
                  })()}
                  className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lös in belöning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal för att lägga till ny belöning */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Skapa ny belöning</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titel *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newReward.title}
                    onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Titel på belöningen"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Beskrivning
                  </label>
                  <textarea
                    id="description"
                    value={newReward.description}
                    onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Beskriv belöningen"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="points_cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Poängkostnad *
                  </label>
                  <input
                    id="points_cost"
                    type="number"
                    min="1"
                    max="1000"
                    value={newReward.points_cost}
                    onChange={(e) => setNewReward({...newReward, points_cost: parseInt(e.target.value) || 100})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ikon
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {rewardIcons.map(icon => (
                      <div 
                        key={icon}
                        onClick={() => setNewReward({...newReward, image: icon})}
                        className={`h-12 w-12 flex items-center justify-center text-2xl rounded-lg border cursor-pointer ${
                          newReward.image === icon 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        }`}
                      >
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewReward({
                      title: '',
                      description: '',
                      points_cost: 100,
                      image: '🎁'
                    });
                  }}
                  className="py-2 px-4 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleAddReward}
                  disabled={!newReward.title || !newReward.points_cost}
                  className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skapa belöning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
} 