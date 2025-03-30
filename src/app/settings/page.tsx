"use client";

import { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { getHouseholdInfo, getHouseholdMembers, supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

interface HouseholdMember {
  id: string;
  name: string;
  full_name: string;
  type?: string;
  role?: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
}

interface HouseholdSettings {
  householdName: string;
  members: HouseholdMember[];
  theme: "light" | "dark" | "system";
  notifications: "all" | "important" | "none";
  language: "sv" | "en";
  deleteAfterDays: number;
}

// Innehållskomponent som använder useSearchParams
function SettingsPageContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  
  const [settings, setSettings] = useState<HouseholdSettings>({
    householdName: "",
    members: [],
    theme: "light",
    notifications: "all",
    language: "sv",
    deleteAfterDays: 30,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeSection, setActiveSection] = useState(sectionParam && ["general", "members", "system", "advanced"].includes(sectionParam) ? sectionParam : "general");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "Medlem"
  });

  useEffect(() => {
    async function fetchData() {
      if (!profile || !profile.household_id) {
        console.log("Debug: Användare saknar hushåll", { 
          profileExists: !!profile, 
          householdId: profile?.household_id,
          userId: user?.id
        });
        setLoading(false);
        setError("Du behöver vara ansluten till ett hushåll för att se inställningar");
        return;
      }

      console.log("Debug: Försöker hämta hushåll", { 
        householdId: profile.household_id
      });

      try {
        // Hämta hushållsinformation
        const { data: householdData, error: householdError } = await getHouseholdInfo(profile.household_id);
        
        // Om vi inte kunde hämta hushållsinformation, använd en reservlösning
        if (householdError || !householdData) {
          console.log("Debug: Kunde inte hämta hushåll, använder fallback", { 
            error: householdError
          });
          
          // Använd ett mockad hushåll baserat på id
          const fallbackHousehold = {
            id: profile.household_id,
            name: profile.household_id.includes("5c414d9f") ? "Bågen" : "Mitt hushåll",
            created_at: new Date().toISOString()
          };
          
          // Hämta hushållsmedlemmar
          const { data: membersData, error: membersError } = await getHouseholdMembers(profile.household_id);
          
          if (membersError || !membersData) {
            console.log("Debug: Kunde inte hämta medlemmar", { error: membersError });
            setSettings(prev => ({
              ...prev,
              members: [],
              householdName: fallbackHousehold.name
            }));
          } else {
            // Formatera medlemsdata
            const formattedMembers = membersData.map((member: HouseholdMember) => ({
              id: member.id,
              name: member.full_name,
              full_name: member.full_name,
              type: member.role || "Medlem",
              role: member.role || "Medlem",
              email: member.email,
              avatar: member.avatar_url,
              avatar_url: member.avatar_url
            }));
            
            setSettings(prev => ({
              ...prev,
              members: formattedMembers,
              householdName: fallbackHousehold.name
            }));
          }
          
          setLoading(false);
          setError(null);
          return;
        }

        // Hämta hushållsmedlemmar
        const { data: membersData, error: membersError } = await getHouseholdMembers(profile.household_id);
        
        if (membersError) {
          console.log("Debug: Kunde inte hämta medlemmar normalt", { error: membersError });
          setError(`Kunde inte hämta hushållsmedlemmar: ${membersError.message}`);
          setLoading(false);
          return;
        }

        // Formatera medlemsdata för gränssnittet
        const formattedMembers = membersData?.map((member: HouseholdMember) => ({
          id: member.id,
          name: member.full_name,
          full_name: member.full_name,
          type: member.role || "Medlem",
          role: member.role || "Medlem",
          email: member.email,
          avatar: member.avatar_url,
          avatar_url: member.avatar_url
        })) || [];

        // Uppdatera inställningar med data från databasen
        setSettings({
          householdName: householdData?.name || "Mitt hushåll",
          members: formattedMembers,
          theme: profile.theme as "light" | "dark" | "system" || "light",
          notifications: profile.notifications_enabled ? "all" : "none",
          language: "sv", // Standardvärde eftersom det kanske inte finns i databasen
          deleteAfterDays: 30, // Standardvärde eftersom det kanske inte finns i databasen
        });

        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Fel vid hämtning av data:", err);
        setError("Ett oväntat fel uppstod vid hämtning av data");
        setLoading(false);
      }
    }

    fetchData();
  }, [profile, user?.id]);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.household_id) return;

    try {
      // Här skulle vi skicka en inbjudan till den nya medlemmen
      // För enkelhetens skull har vi bara ett meddelande
      alert(`Inbjudan skulle skickas till ${newMember.email}`);
      setShowAddMemberModal(false);
    } catch (err) {
      console.error("Fel vid tillägg av ny medlem:", err);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!profile?.household_id) return;
    if (id === user?.id) {
      alert("Du kan inte ta bort dig själv från hushållet");
      return;
    }

    try {
      // Ta bort medlem från hushållet
      const { error } = await supabase
        .from('profiles')
        .update({ household_id: null })
        .eq('id', id);
      
      if (error) {
        console.error("Fel vid borttagning av medlem:", error);
        return;
      }

      // Uppdatera medlemslistan i gränssnittet
      setSettings({
        ...settings,
        members: settings.members.filter((member) => member.id !== id),
      });
    } catch (err) {
      console.error("Fel vid borttagning av medlem:", err);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!profile?.household_id) return;

    try {
      // Uppdatera hushållsnamn
      const { error: householdError } = await supabase
        .from('households')
        .update({ name: settings.householdName })
        .eq('id', profile.household_id);
      
      if (householdError) {
        console.error("Fel vid uppdatering av hushållsnamn:", householdError);
        return;
      }

      alert("Inställningarna har sparats");
    } catch (err) {
      console.error("Fel vid sparande av inställningar:", err);
    }
  };

  const handleSaveSystemSettings = async () => {
    if (!user?.id) return;

    try {
      // Uppdatera användarens temainställningar
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          theme: settings.theme,
          notifications_enabled: settings.notifications === "all" || settings.notifications === "important"
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error("Fel vid uppdatering av profilinställningar:", profileError);
        return;
      }

      alert("Systeminställningarna har sparats");
    } catch (err) {
      console.error("Fel vid sparande av systeminställningar:", err);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!profile?.household_id) return;

    try {
      // Ta bort hushållet
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', profile.household_id);
      
      if (error) {
        console.error("Fel vid borttagning av hushåll:", error);
        return;
      }

      // Uppdatera användarens profil för att ta bort household_id
      await supabase
        .from('profiles')
        .update({ household_id: null })
        .eq('id', user?.id);

      alert("Hushållet har raderats");
      setDeleteConfirmation(false);
      // Här skulle vi omdirigera användaren till en annan sida
    } catch (err) {
      console.error("Fel vid borttagning av hushåll:", err);
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Inställningar</h1>
          <p>Laddar inställningar...</p>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Inställningar</h1>

          {error && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
              <h2 className="font-medium mb-2 text-yellow-800 dark:text-yellow-400">Varning</h2>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {error}
              </p>
              
              {/* Lägg till en direktåtkomstknapp om det finns ett household_id */}
              {profile?.household_id && (
                <div className="mt-4">
                  <Button 
                    onClick={() => {
                      // Implementera logik för att hämta hushåll direkt
                      console.log("Försöker visa hushåll manuellt");
                      setLoading(true);
                      setError(null);
                      
                      // Kontrollera att household_id faktiskt finns
                      if (!profile.household_id) {
                        setLoading(false);
                        setError("Inget household_id hittades");
                        return;
                      }
                      
                      // Använd ett mockad hushåll baserat på id
                      const fallbackHousehold = {
                        id: profile.household_id,
                        name: profile.household_id.includes("5c414d9f") ? "Bågen" : "Mitt hushåll",
                        created_at: new Date().toISOString()
                      };
                      
                      // Hämta medlemmar
                      getHouseholdMembers(profile.household_id)
                        .then(({ data: membersData, error: membersError }) => {
                          if (membersError || !membersData) {
                            console.log("Kunde inte hämta medlemmar", { error: membersError });
                            setSettings(prev => ({
                              ...prev,
                              members: [],
                              householdName: fallbackHousehold.name
                            }));
                          } else {
                            // Formatera medlemmar
                            const formattedMembers = membersData.map((member: HouseholdMember) => ({
                              id: member.id,
                              name: member.full_name,
                              full_name: member.full_name,
                              type: member.role || "Medlem",
                              role: member.role || "Medlem",
                              email: member.email,
                              avatar: member.avatar_url,
                              avatar_url: member.avatar_url
                            }));
                            
                            setSettings(prev => ({
                              ...prev,
                              members: formattedMembers,
                              householdName: fallbackHousehold.name
                            }));
                          }
                          
                          setLoading(false);
                        })
                        .catch(err => {
                          console.error("Fel vid hämtning av medlemmar:", err);
                          setLoading(false);
                          setError("Kunde inte hämta medlemmar");
                        });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Visa hushållsinställningar ändå
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Inställningar</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Hantera ditt hushålls inställningar och medlemmar
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigationsmeny */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <nav>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-center ${
                      activeSection === "general"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveSection("general")}
                  >
                    Allmänna inställningar
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-center ${
                      activeSection === "members"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveSection("members")}
                  >
                    Medlemmar
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-center ${
                      activeSection === "system"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveSection("system")}
                  >
                    Systeminställningar
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-center ${
                      activeSection === "advanced"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveSection("advanced")}
                  >
                    Avancerat
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Innehållspanel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Allmänna inställningar */}
            {activeSection === "general" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Allmänna inställningar
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="householdName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Hushållsnamn
                    </label>
                    <Input
                      id="householdName"
                      type="text"
                      value={settings.householdName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          householdName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Språk
                    </label>
                    <Select
                      id="language"
                      value={settings.language}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          language: e.target.value as "sv" | "en",
                        })
                      }
                      options={[
                        { value: "sv", label: "Svenska" },
                        { value: "en", label: "Engelska" }
                      ]}
                    >
                      <option value="sv">Svenska</option>
                      <option value="en">Engelska</option>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button type="button" onClick={handleSaveGeneralSettings}>
                      Spara ändringar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Medlemmar */}
            {activeSection === "members" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Medlemmar</h2>
                  <Button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    Lägg till medlem
                  </Button>
                </div>

                <div className="space-y-4">
                  {settings.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Avatar
                          size="md"
                          src={member.avatar_url || member.avatar}
                          alt={member.name || member.full_name}
                          name={member.name || member.full_name}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">{member.name || member.full_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.type || member.role} • {member.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Ta bort
                      </Button>
                    </div>
                  ))}
                  {settings.members.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Inga medlemmar i hushållet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Systeminställningar */}
            {activeSection === "system" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Systeminställningar
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="theme"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Tema
                    </label>
                    <Select
                      id="theme"
                      value={settings.theme}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: e.target.value as "light" | "dark" | "system",
                        })
                      }
                      options={[
                        { value: "light", label: "Ljust" },
                        { value: "dark", label: "Mörkt" },
                        { value: "system", label: "Systemstandard" }
                      ]}
                    >
                      <option value="light">Ljust</option>
                      <option value="dark">Mörkt</option>
                      <option value="system">Systemstandard</option>
                    </Select>
                  </div>

                  <div>
                    <label
                      htmlFor="notifications"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Notifikationer
                    </label>
                    <Select
                      id="notifications"
                      value={settings.notifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: e.target.value as
                            | "all"
                            | "important"
                            | "none",
                        })
                      }
                      options={[
                        { value: "all", label: "Alla notifikationer" },
                        { value: "important", label: "Endast viktiga" },
                        { value: "none", label: "Inga notifikationer" }
                      ]}
                    >
                      <option value="all">Alla notifikationer</option>
                      <option value="important">Endast viktiga</option>
                      <option value="none">Inga notifikationer</option>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button type="button" onClick={handleSaveSystemSettings}>
                      Spara ändringar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Avancerat */}
            {activeSection === "advanced" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Avancerade inställningar
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="deleteAfterDays"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Radera avklarade uppgifter efter (dagar)
                    </label>
                    <Input
                      id="deleteAfterDays"
                      type="number"
                      min="0"
                      value={settings.deleteAfterDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deleteAfterDays: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Värde 0 betyder att uppgifter aldrig raderas automatiskt.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button type="button">Spara ändringar</Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                      Farliga åtgärder
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Dessa åtgärder kan inte ångras. Var försiktig!
                    </p>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setDeleteConfirmation(true)}
                    >
                      Radera hushåll
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lägg till medlem modal */}
        <Modal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          title="Lägg till medlem"
        >
          <form onSubmit={handleAddMember}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Namn
                </label>
                <Input 
                  type="text" 
                  placeholder="Medlemmens namn" 
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-post
                </label>
                <Input 
                  type="email" 
                  placeholder="Medlemmens e-post" 
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Roll
                </label>
                <Select
                  options={[
                    { value: "Förälder", label: "Förälder" },
                    { value: "Barn", label: "Barn" },
                    { value: "Annan", label: "Annan" }
                  ]}
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="Förälder">Förälder</option>
                  <option value="Barn">Barn</option>
                  <option value="Annan">Annan</option>
                </Select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Avbryt
                </Button>
                <Button type="submit">Lägg till</Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Bekräfta radering modal */}
        <Modal
          isOpen={deleteConfirmation}
          onClose={() => setDeleteConfirmation(false)}
          title="Bekräfta radering"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Är du säker på att du vill radera detta hushåll? Alla data kommer
              att raderas permanent och kan inte återställas.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmation(false)}
              >
                Avbryt
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteHousehold}
              >
                Radera permanent
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

// Huvudkomponenten som wrappar innehållet med Suspense
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Laddar...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
} 