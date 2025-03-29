"use client";

import { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Link from "next/link";

interface HouseholdMember {
  id: number;
  name: string;
  type: string;
  email: string;
  avatar?: string;
}

interface HouseholdSettings {
  householdName: string;
  members: HouseholdMember[];
  theme: "light" | "dark" | "system";
  notifications: "all" | "important" | "none";
  language: "sv" | "en";
  deleteAfterDays: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<HouseholdSettings>({
    householdName: "Anderssons",
    members: [
      {
        id: 1,
        name: "Lisa Andersson",
        type: "Förälder",
        email: "lisa@example.com",
        avatar: "/avatars/lisa.jpg",
      },
      {
        id: 2,
        name: "Mikael Andersson",
        type: "Förälder",
        email: "mikael@example.com",
        avatar: "/avatars/mikael.jpg",
      },
      {
        id: 3,
        name: "Emma Andersson",
        type: "Barn",
        email: "emma@example.com",
        avatar: "/avatars/emma.jpg",
      },
    ],
    theme: "light",
    notifications: "all",
    language: "sv",
    deleteAfterDays: 30,
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const handleAddMember = (event: React.FormEvent) => {
    event.preventDefault();
    // Lägg till ny medlem till household
    setShowAddMemberModal(false);
  };

  const handleRemoveMember = (id: number) => {
    // Ta bort medlem
    setSettings({
      ...settings,
      members: settings.members.filter((member) => member.id !== id),
    });
  };

  const handleDeleteHousehold = () => {
    // Radera hushåll
    setDeleteConfirmation(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-2">Inställningar</h1>
        <p className="text-gray-600 mb-6">
          Hantera ditt hushålls inställningar och medlemmar
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigationsmeny */}
          <Card className="lg:col-span-1 p-0 overflow-hidden">
            <nav>
              <ul className="divide-y divide-gray-200">
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-center ${
                      activeSection === "general"
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50"
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
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50"
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
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50"
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
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveSection("advanced")}
                  >
                    Avancerat
                  </button>
                </li>
              </ul>
            </nav>
          </Card>

          {/* Innehållspanel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Allmänna inställningar */}
            {activeSection === "general" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Allmänna inställningar
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="householdName"
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                    <Button type="button">Spara ändringar</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Medlemmar */}
            {activeSection === "members" && (
              <Card className="p-6">
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Avatar
                          size="md"
                          src={member.avatar}
                          alt={member.name}
                          name={member.name}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">
                            {member.type} • {member.email}
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
                </div>
              </Card>
            )}

            {/* Systeminställningar */}
            {activeSection === "system" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Systeminställningar
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tema
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={settings.theme === "light" ? "primary" : "outline"}
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, theme: "light" })
                        }
                      >
                        Ljust
                      </Button>
                      <Button
                        type="button"
                        variant={settings.theme === "dark" ? "primary" : "outline"}
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, theme: "dark" })
                        }
                      >
                        Mörkt
                      </Button>
                      <Button
                        type="button"
                        variant={settings.theme === "system" ? "primary" : "outline"}
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, theme: "system" })
                        }
                      >
                        System
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notifieringar
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={
                          settings.notifications === "all" ? "primary" : "outline"
                        }
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, notifications: "all" })
                        }
                      >
                        Alla
                      </Button>
                      <Button
                        type="button"
                        variant={
                          settings.notifications === "important"
                            ? "primary"
                            : "outline"
                        }
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, notifications: "important" })
                        }
                      >
                        Viktiga
                      </Button>
                      <Button
                        type="button"
                        variant={
                          settings.notifications === "none" ? "primary" : "outline"
                        }
                        className="justify-center"
                        onClick={() =>
                          setSettings({ ...settings, notifications: "none" })
                        }
                      >
                        Inga
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="button">Spara ändringar</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Avancerat */}
            {activeSection === "advanced" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Datahantering</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="deleteAfterDays"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Radera avklarade uppgifter efter
                      </label>
                      <div className="flex items-center">
                        <Input
                          id="deleteAfterDays"
                          type="number"
                          className="w-24 mr-2"
                          min="1"
                          max="365"
                          value={settings.deleteAfterDays}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              deleteAfterDays: parseInt(e.target.value, 10),
                            })
                          }
                        />
                        <span className="text-gray-700">dagar</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Avklarade uppgifter raderas automatiskt efter denna tid
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button type="button" variant="outline">
                        Exportera data (JSON)
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-red-200 bg-red-50">
                  <h2 className="text-xl font-semibold text-red-700 mb-4">
                    Farozon
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Följande åtgärder kan inte ångras. Var försiktig.
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setDeleteConfirmation(true)}
                  >
                    Radera hushåll permanent
                  </Button>
                </Card>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Namn
                </label>
                <Input type="text" placeholder="Fullständigt namn" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ
                </label>
                <Select 
                  defaultValue="adult"
                  options={[
                    { value: "adult", label: "Förälder" },
                    { value: "child", label: "Barn" },
                    { value: "other", label: "Annan" }
                  ]}
                >
                  <option value="adult">Förälder</option>
                  <option value="child">Barn</option>
                  <option value="other">Annan</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post
                </label>
                <Input type="email" placeholder="E-postadress" />
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
            <p className="text-gray-700">
              Är du säker på att du vill radera detta hushåll? Denna åtgärd kan
              inte ångras och all data kommer att försvinna permanent.
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
      </main>
    </div>
  );
}
