"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUserProfile, getHouseholdMembers } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  points: number;
  completed_tasks: number;
  joined_date: string;
  avatar_url: string;
  preferences: {
    notifications: boolean;
    theme: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile: userProfile, isLoading, error: authError } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);

  // Omdirigeringskontroll - om ingen användare är inloggad och inläsningen är klar
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [isLoading, user, router]);

  // Konvertera användardata till profildata
  useEffect(() => {
    if (user) {
      // Även om vi har fel med att hämta profil, kan vi fortfarande visa användardata
      // från auth-objektet för att förhindra tomt gränssnitt
      setProfile({
        id: user.id,
        name: userProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Användare",
        email: user.email || "",
        role: userProfile?.role || "Användare",
        points: userProfile?.points || 0,
        completed_tasks: userProfile?.completed_tasks || 0,
        joined_date: formatDate(user.created_at || new Date().toISOString()),
        avatar_url: userProfile?.avatar_url || "",
        preferences: {
          notifications: userProfile?.notifications_enabled || false,
          theme: userProfile?.theme || "light",
        },
      });
      
      // Om det finns ett fel från useAuth, visa det men fortsätt att visa UI
      if (authError) {
        // Uppdatera felmeddelandet för att vara mer användarvänligt
        if (authError.includes("infinite recursion detected in policy")) {
          setError("Det finns ett konfigurationsfel i databasen. Kontakta administratören om felet kvarstår.");
        } else if (authError.includes("Kunde inte skapa hushåll")) {
          setError(`Det gick inte att skapa ett hushåll för din profil. Detta kan begränsa vissa funktioner i appen. Försök logga ut och in igen.`);
        } else {
          setError(`Kunde inte ladda fullständig profildata: ${authError}`);
        }
      } else {
        setError(null);
      }
    }
  }, [user, userProfile, authError]);

  // Hämta hushållsmedlemmar om användaren har ett hushåll
  useEffect(() => {
    async function fetchHouseholdMembers() {
      console.log("Debug: Profildata", { 
        userProfile, 
        householdId: userProfile?.household_id,
        userId: user?.id
      });
      
      if (userProfile?.household_id) {
        setIsLoadingMembers(true);
        try {
          const { data, error } = await getHouseholdMembers(userProfile.household_id);
          
          console.log("Debug: Hushållsmedlemmar", { 
            data, 
            error, 
            householdId: userProfile.household_id 
          });
          
          if (error) {
            console.error("Fel vid hämtning av hushållsmedlemmar:", error);
          } else {
            // Säkerställ att nuvarande användare finns med i listan
            let foundCurrentUser = false;
            if (data && data.length > 0) {
              // Kontrollera om den aktuella användaren redan finns i listan
              foundCurrentUser = data.some((member: any) => member.id === user?.id);
            }

            // Om användaren inte finns i listan eller listan är tom men vi har ett hushåll
            if (!foundCurrentUser && userProfile) {
              // Använd användarens riktiga namn istället för "Du"
              const userName = userProfile.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Erik";
              
              // Lägg till aktuell användare i listan
              const currentUserMember = {
                id: user?.id || '',
                full_name: userName,
                name: userName,
                email: userProfile.email || user?.email || '',
                avatar_url: userProfile.avatar_url || '',
                role: userProfile.role || 'Användare',
                points: userProfile.points || 0,
                completed_tasks: userProfile.completed_tasks || 0
              };
              
              // Sätt medlemslistan med aktuell användare
              setHouseholdMembers(data ? [currentUserMember] : [currentUserMember]);
            } else {
              // Så att vi inte får "Namnlös användare" - ersätt med korrekt namn
              const enhancedData = data?.map((member: any) => {
                // Om det är den aktuella användaren och den saknar namn
                if (member.id === user?.id && (!member.full_name || member.full_name === 'Namnlös användare')) {
                  const userName = userProfile?.full_name || 
                                  user?.user_metadata?.name || 
                                  user?.email?.split('@')[0] || 
                                  "Erik";
                  return {
                    ...member,
                    full_name: userName,
                    name: userName
                  };
                }
                return member;
              }) || [];
              
              // Använd listan som den är
              setHouseholdMembers(enhancedData);
            }
          }
        } catch (err) {
          console.error("Oväntat fel vid hämtning av hushållsmedlemmar:", err);
        } finally {
          setIsLoadingMembers(false);
        }
      }
    }
    
    fetchHouseholdMembers();
  }, [userProfile?.household_id, user, userProfile]);

  const handleEditProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    
    if (!profile?.id) {
      setSaveError("Ingen användar-ID hittades");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Hämta formulärdata
      const formData = new FormData(event.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const role = formData.get('role') as string;
      
      if (!name?.trim()) {
        setSaveError("Namn måste anges");
        setIsSaving(false);
        return;
      }
      
      // Uppdatera lokalt UI först för snabbare respons
      if (profile) {
        setProfile({
          ...profile,
          name: name,
          role: role || "Användare",
        });
      }
      
      // Spara till databasen
      const { error } = await updateUserProfile(profile.id, {
        full_name: name,
        role: role || "Användare",
      });
      
      if (error) {
        console.error("Databasfel vid uppdatering:", error);
        
        // Hantera policyfel mer användarvänligt
        if (error.message?.includes("infinite recursion detected in policy")) {
          throw new Error("Databasrättighetsfel. Kontakta administratören om felet kvarstår.");
        } else {
          throw new Error(error.message || "Databasfel vid uppdatering");
        }
      }
      
      setShowEditModal(false);
    } catch (err) {
      console.error("Fel vid uppdatering av profil:", err);
      setSaveError(err instanceof Error ? err.message : "Kunde inte spara ändringar");
    } finally {
      setIsSaving(false);
    }
  };

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      console.error("Fel vid datumformatering:", e);
      return "Okänt datum";
    }
  }

  // Visa laddningsskärm
  if (isLoading) {
    return (
      <Sidebar>
        <div className="p-6 flex justify-center items-center min-h-screen">
          <p>Laddar profil...</p>
        </div>
      </Sidebar>
    );
  }

  // Visa en logga in-sida om ingen användare finns och inläsningen är klar
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
          <h2 className="font-medium mb-2 text-red-800 dark:text-red-400">Ingen användare inloggad</h2>
          <p className="text-sm text-red-600 dark:text-red-400">
            Du måste logga in för att se din profil
          </p>
          <Link 
            href="/auth"
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Gå till inloggning
          </Link>
        </div>
      </div>
    );
  }

  // Visa fel men tillåt fortfarande att profilen visas
  return (
    <Sidebar>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Min Profil</h1>

        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {error}
            </p>
          </div>
        )}

        {profile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profilinformation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex flex-col items-center">
                <Avatar
                  size="xl"
                  src={profile.avatar_url}
                  alt={profile.name}
                  name={profile.name}
                />
                <h2 className="text-xl font-semibold mt-4">{profile.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.role}</p>
                
                <div className="w-full grid grid-cols-2 gap-4 my-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Poäng</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{profile.points}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avklarade</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{profile.completed_tasks}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Gick med {profile.joined_date}
                </p>
                
                <Button 
                  className="mt-6 w-full" 
                  onClick={() => setShowEditModal(true)}
                  variant="outline"
                >
                  Redigera profil
                </Button>
              </div>
            </div>

            {/* Användarinfo och kommande funktioner */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Välkommen till din profil</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Här kan du se statistik över dina genomförda uppgifter och de poäng du har samlat. När du slutför uppgifter i appen kommer din statistik att uppdateras automatiskt.
              </p>
              
              {/* Hushållssektion */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-3">Mitt hushåll</h3>
                
                {userProfile?.household_id ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Du är medlem i ett hushåll. Här kan du se alla medlemmar i ditt hushåll.
                    </p>
                    
                    {isLoadingMembers ? (
                      <p className="text-sm text-gray-500">Laddar hushållsmedlemmar...</p>
                    ) : householdMembers.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Medlemmar:</p>
                        <ul className="space-y-2">
                          {householdMembers.map(member => (
                            <li key={member.id} className="flex items-center py-2 px-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                              <Avatar 
                                size="sm" 
                                src={member.avatar_url} 
                                name={member.full_name || "Användare"} 
                              />
                              <div className="ml-3">
                                <p className="font-medium">{member.full_name || "Användare"}</p>
                                <p className="text-xs text-gray-500">{member.role || "Medlem"}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Inga andra medlemmar hittades i ditt hushåll.</p>
                    )}
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => router.push('/settings?section=members')}
                      >
                        Hantera hushåll
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Du har inget hushåll än. Ett hushåll hjälper dig att dela uppgifter med andra.
                    </p>
                    <Button 
                      className="mt-3" 
                      variant="outline"
                      onClick={() => router.push('/settings?section=general')}
                    >
                      Skapa hushåll
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Kommande funktioner */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Kommande funktioner</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-center">
                    <span className="mr-2">🏆</span>
                    <span>Märken och belöningar för genomförda uppgifter</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📊</span>
                    <span>Detaljerad statistik över genomförda aktiviteter</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">👨‍👩‍👧‍👦</span>
                    <span>Möjlighet att bjuda in familjemedlemmar till ditt hushåll</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
            <h2 className="font-medium mb-2 text-red-800 dark:text-red-400">Kunde inte ladda profil</h2>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || "Ett okänt fel har uppstått"}
            </p>
          </div>
        )}

        {/* Redigera profil modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Redigera profil"
        >
          <form onSubmit={handleEditProfile}>
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {saveError}
                </div>
              )}
              
              <div className="flex justify-center mb-4">
                <Avatar
                  size="lg"
                  src={profile?.avatar_url || ""}
                  alt={profile?.name || ""}
                  name={profile?.name || ""}
                />
              </div>
              <div>
                <Button type="button" variant="outline" className="w-full">
                  Ändra profilbild
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Namn
                </label>
                <Input
                  type="text"
                  name="name"
                  defaultValue={profile?.name || ""}
                  placeholder="Ditt namn"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-post
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={profile?.email || ""}
                  placeholder="Din e-post"
                  disabled={true}
                />
                <p className="text-sm text-gray-500 mt-1">E-post kan inte ändras direkt</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Roll
                </label>
                <Input
                  type="text"
                  name="role"
                  defaultValue={profile?.role || ""}
                  placeholder="Din roll"
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Sparar..." : "Spara ändringar"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}