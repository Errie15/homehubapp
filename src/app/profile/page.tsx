"use client";

import { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  points: number;
  completedTasks: number;
  joinedDate: string;
  avatar: string;
  preferences: {
    notifications: boolean;
    theme: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Lisa Andersson",
    email: "lisa.andersson@example.com",
    role: "Förälder",
    points: 1250,
    completedTasks: 48,
    joinedDate: "15 Jan 2023",
    avatar: "/avatars/lisa.jpg",
    preferences: {
      notifications: true,
      theme: "light",
    },
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("aktiviteter");

  const recentActivities = [
    { id: 1, task: "Städade köket", date: "Idag, 14:30", points: 50 },
    { id: 2, task: "Handlade", date: "Igår, 10:15", points: 75 },
    { id: 3, task: "Tvättade", date: "3 dagar sedan", points: 30 },
  ];

  const badges = [
    { id: 1, name: "Första uppgiften", icon: "🏆", date: "15 Jan 2023" },
    { id: 2, name: "10 uppgifter", icon: "⭐", date: "1 Feb 2023" },
    { id: 3, name: "Städmästare", icon: "🧹", date: "15 Mars 2023" },
    { id: 4, name: "Organisatör", icon: "📋", date: "10 April 2023" },
  ];

  const handleEditProfile = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Uppdatera profilen här
    // Använd setProfile-funktionen för att lösa ESLint-felet
    const formData = new FormData(event.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    
    setProfile({
      ...profile,
      name: name || profile.name,
      email: email || profile.email,
      role: role || profile.role,
    });
    
    setShowEditModal(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Min Profil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profilinformation */}
          <Card className="md:col-span-1 p-6">
            <div className="flex flex-col items-center">
              <Avatar
                size="xl"
                src={profile.avatar}
                alt={profile.name}
                name={profile.name}
              />
              <h2 className="text-xl font-semibold mt-4">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-gray-600 mb-4">{profile.role}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 my-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Poäng</p>
                  <p className="text-xl font-bold text-blue-600">{profile.points}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avklarade</p>
                  <p className="text-xl font-bold text-green-600">{profile.completedTasks}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Gick med {profile.joinedDate}
              </p>
              
              <Button 
                className="mt-6 w-full" 
                onClick={() => setShowEditModal(true)}
                variant="outline"
              >
                Redigera profil
              </Button>
            </div>
          </Card>

          {/* Aktiviteter och märken */}
          <Card className="md:col-span-2 p-0 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`flex-1 py-3 px-4 text-center ${
                    activeTab === "aktiviteter"
                      ? "border-b-2 border-blue-500 font-medium text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("aktiviteter")}
                >
                  Senaste aktiviteter
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-center ${
                    activeTab === "badges"
                      ? "border-b-2 border-blue-500 font-medium text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("badges")}
                >
                  Märken
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "aktiviteter" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Senaste aktiviteter</h3>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activity.task}</p>
                          <p className="text-sm text-gray-500">{activity.date}</p>
                        </div>
                        <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                          <span className="text-green-700 font-medium">
                            +{activity.points} poäng
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/aktiviteter" className="block text-blue-600 text-center mt-4">
                    Visa alla aktiviteter
                  </Link>
                </div>
              )}

              {activeTab === "badges" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Mina märken</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="text-2xl mr-3">{badge.icon}</div>
                        <div>
                          <p className="font-medium">{badge.name}</p>
                          <p className="text-sm text-gray-500">{badge.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Redigera profil modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Redigera profil"
        >
          <form onSubmit={handleEditProfile}>
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <Avatar
                  size="lg"
                  src={profile.avatar}
                  alt={profile.name}
                  name={profile.name}
                />
              </div>
              <div>
                <Button type="button" variant="outline" className="w-full">
                  Ändra profilbild
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Namn
                </label>
                <Input
                  type="text"
                  name="name"
                  defaultValue={profile.name}
                  placeholder="Ditt namn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={profile.email}
                  placeholder="Din e-post"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll
                </label>
                <Input
                  type="text"
                  name="role"
                  defaultValue={profile.role}
                  placeholder="Din roll"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Avbryt
                </Button>
                <Button type="submit">Spara ändringar</Button>
              </div>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}