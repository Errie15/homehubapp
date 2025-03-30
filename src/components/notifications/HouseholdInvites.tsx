'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { getUserInvitations, acceptHouseholdInvitation, rejectHouseholdInvitation } from '@/lib/supabase';

interface Invitation {
  id: string;
  from_user_name: string;
  household_name: string;
  created_at?: string;
  household_id: string;
}

interface HouseholdInvitesProps {
  userId: string;
  userEmail: string;
}

export default function HouseholdInvites({ userId, userEmail }: HouseholdInvitesProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchInvitations() {
      if (!userEmail) return;
      
      try {
        setLoading(true);
        const { data, error } = await getUserInvitations(userEmail);
        
        if (error) {
          console.error('Fel vid hämtning av inbjudningar:', error);
          
          // Hantera olika typer av fel
          if (error.message?.includes('inbjudningssystemet är inte konfigurerat')) {
            // Detta är ett systemkonfigurationsfel som inte bör visas för vanliga användare
            console.warn('Inbjudningssystemet är inte konfigurerat korrekt:', error);
            setInvitations([]);
            setError(null);
          } else {
            setError('Kunde inte hämta dina inbjudningar');
          }
          return;
        }
        
        setInvitations(data || []);
        setError(null);
      } catch (err) {
        console.error('Oväntat fel vid hämtning av inbjudningar:', err);
        setError('Ett oväntat fel uppstod');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvitations();
  }, [userEmail]);

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!userId) return;
    
    try {
      setProcessingId(invitationId);
      const { error } = await acceptHouseholdInvitation(invitationId, userId);
      
      if (error) {
        console.error('Fel vid accepterande av inbjudan:', error);
        // Mer användarvänligt felmeddelande
        alert(`Kunde inte acceptera inbjudan: ${error.message || 'Okänt fel'}`);
        return;
      }
      
      // Ta bort den accepterade inbjudan från listan
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Omdirigera till dashboard eller andra sidan om inbjudan accepterades
      alert('Du har anslutit till hushållet!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Oväntat fel vid accepterande av inbjudan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel';
      alert(`Ett oväntat fel uppstod: ${errorMessage}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      const { error } = await rejectHouseholdInvitation(invitationId);
      
      if (error) {
        console.error('Fel vid avvisning av inbjudan:', error);
        // Mer användarvänligt felmeddelande
        alert(`Kunde inte avvisa inbjudan: ${error.message || 'Okänt fel'}`);
        return;
      }
      
      // Ta bort den avvisade inbjudan från listan
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error('Oväntat fel vid avvisning av inbjudan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel';
      alert(`Ett oväntat fel uppstod: ${errorMessage}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="py-2">Laddar inbjudningar...</div>;
  }

  if (error) {
    return (
      <div className="py-2 text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Visa ingenting om det inte finns några inbjudningar
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Inbjudningar till hushåll</h3>
      
      <div className="space-y-3">
        {invitations.map(invitation => (
          <div 
            key={invitation.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <p className="mb-2">
              <span className="font-medium">{invitation.from_user_name}</span> har bjudit in dig att gå med i hushållet <span className="font-medium">{invitation.household_name}</span>.
            </p>
            
            <div className="flex space-x-3 mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? 'Bearbetar...' : 'Acceptera'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRejectInvitation(invitation.id)}
                disabled={processingId === invitation.id}
              >
                Avvisa
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 