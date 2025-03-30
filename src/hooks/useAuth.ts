import { useState, useEffect } from 'react';
import { supabase, getCurrentUser, getUserProfile, ensureUserHasHousehold, createUserProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfileData {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  points?: number;
  completed_tasks?: number;
  avatar_url?: string;
  household_id?: string;
  notifications_enabled?: boolean;
  theme?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
}

// Interface för felmeddelanden
interface ErrorWithMessage {
  message?: string;
  [key: string]: unknown;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadUser() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Hämta användardata från Supabase Auth
        const user = await getCurrentUser();
        
        if (!user) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            error: null, // Ingen inloggad användare är inte ett fel, bara ett tomt tillstånd
          });
          
          // Omdirigera till inloggningssidan om användaren besöker en skyddad sida
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            console.log('Ingen inloggad användare, omdirigerar till inloggningssidan');
            window.location.href = '/auth';
          }
          return;
        }
        
        console.log("Användare inloggad:", user.id);
        
        // Hämta användarens profildata från databasen
        const { data: profile, error: profileError } = await getUserProfile(user.id);
        
        if (profileError) {
          let errorMessage = "Kunde inte ladda användarprofil";
          
          // Förbättra felmeddelandet för vanligt förekommande fel
          const typedError = profileError as unknown as ErrorWithMessage;
          if (typedError.message?.includes("infinite recursion detected in policy")) {
            errorMessage = "Det finns ett konfigurationsfel i databasen. Kontakta administratören om felet kvarstår.";
          } else if (typedError.message) {
            errorMessage = typedError.message;
          }
          
          console.warn("Fel vid hämtning av profil:", profileError);
          
          // Skapa en ny profil automatiskt
          console.log("Skapar ny profil för användare:", user.id);
          const { data: newProfile, error: createError } = await createUserProfile(user.id, {
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Användare"
          });
          
          if (createError) {
            console.error("Kunde inte skapa användarprofil:", createError);
            setState({
              user,
              profile: { id: user.id }, // Skapa åtminstone ett grundläggande profilobjekt
              isLoading: false,
              error: errorMessage,
            });
            return;
          }
          
          // Försök skapa ett hushåll för den nya profilen
          if (newProfile) {
            console.log("Skapar hushåll för ny profil:", user.id);
            try {
              const { data: updatedProfile, error: householdError } = await ensureUserHasHousehold(
                user.id, 
                newProfile
              );
              
              if (householdError) {
                console.error("Fel vid skapande av hushåll för ny profil:", householdError);
                setState({
                  user,
                  profile: newProfile,
                  isLoading: false,
                  error: "Skapade profil men kunde inte skapa hushåll. Vissa funktioner kan vara begränsade.",
                });
                return;
              }
              
              console.log("Profil och hushåll skapade framgångsrikt:", updatedProfile);
              setState({
                user,
                profile: updatedProfile,
                isLoading: false,
                error: null,
              });
            } catch (err) {
              console.error("Oväntat fel vid skapande av hushåll:", err);
              setState({
                user,
                profile: newProfile,
                isLoading: false,
                error: "Ett oväntat fel uppstod vid skapande av hushåll.",
              });
            }
            return;
          }
          
          setState({
            user,
            profile: newProfile,
            isLoading: false,
            error: null,
          });
          return;
        }
        
        // Kontrollera om det finns en household_id, annars skapa ett hushåll
        if (profile && !profile.household_id) {
          console.log("Profil saknar hushåll, skapar ett");
          try {
            const { data: updatedProfile, error: householdError } = await ensureUserHasHousehold(user.id, profile);
            
            if (householdError) {
              console.error("Fel vid skapande av hushåll:", householdError);
              
              // Även om vi får ett fel, kanske vi fortfarande har ett hushålls-ID i resultatet
              // Detta händer när hushållet skapades, men profilen inte kunde uppdateras i databasen
              if (updatedProfile?.household_id) {
                console.log("Hushåll skapades, men profilen kunde inte uppdateras i databasen. Använder tillfällig lösning.");
                
                // Sätt hushålls-ID i den befintliga profilen så att UI fungerar korrekt
                setState({
                  user,
                  profile: { ...profile, household_id: updatedProfile.household_id },
                  isLoading: false,
                  error: "Hushåll skapades, men kunde inte länkas permanent till profilen. Vissa funktioner kan vara begränsade."
                });
                return;
              }
              
              setState({
                user,
                profile,
                isLoading: false,
                error: `Kunde inte skapa hushåll: ${householdError.message || 'Okänt fel'}`,
              });
              return;
            }
            
            console.log("Hushåll skapat framgångsrikt:", updatedProfile?.household_id);
            setState({
              user,
              profile: updatedProfile,
              isLoading: false,
              error: null,
            });
            return;
          } catch (err) {
            console.error("Oväntat fel vid skapande av hushåll:", err);
            setState({
              user,
              profile,
              isLoading: false,
              error: "Ett oväntat fel uppstod vid skapande av hushåll.",
            });
            return;
          }
        }
        
        setState({
          user,
          profile: profile || { id: user.id },
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('Fel vid inläsning av användare:', err);
        
        // Hantera AuthSessionMissingError 
        if (err instanceof Error && err.message && err.message.includes('Auth session missing')) {
          console.log('Auth-session saknas, återställer och omdirigerar till inloggningssidan');
          // Rensa lokal cache
          supabase.auth.signOut().then(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/auth';
            }
          });
          return;
        }
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Kunde inte hämta användardata',
        }));
      }
    }
    
    // Ladda användardata när komponenten monteras
    loadUser();
    
    // Lyssna på autentiseringshändelser
    let authListener: { subscription: { unsubscribe: () => void } } | undefined;
    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            error: null,
          });
        }
      });
      authListener = listener;
    } catch (err) {
      const error = err as Error;
      console.error('Fel vid uppsättning av auth-lyssnare:', error);
      // Återställ sessionen om vi får ett autentiseringsfel
      if (typeof window !== 'undefined' && error.message && error.message.includes('Auth session missing')) {
        console.log('Auth-session saknas i lyssnaren, återställer och omdirigerar till inloggningssidan');
        // Rensa lokal cache
        supabase.auth.signOut().then(() => {
          window.location.href = '/auth';
        });
      }
    }
    
    // Rensa lyssnare när komponenten avmonteras
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  return state;
}

export default useAuth; 