# Ändringslogg

## 2025-03-30: Buggfixar för inbjudningssystem och utloggning

### 1. Utloggningsknapp på profilsidan

- Implementerade en utloggningsknapp på profilsidan
- Knappen använder den befintliga signOut-funktionen från Supabase
- Efter utloggning dirigeras användaren till inloggningssidan
- Utloggningsknappen visar en laddningsindikator under utloggningsprocessen

### 2. Fixat fel i inbjudningssystemet

#### Skapande av tabell och policys
- Lagt till SQL för att skapa tabellen `household_invitations`
- Implementerat RLS-policys för tabellen för att upprätthålla säkerheten
- Filen `add_household_invitations.sql` måste köras mot databasen för att implementera dessa ändringar

#### Förbättrad felhantering
- Kontrollerar om tabellen existerar innan den används
- Förbättrat felhantering i alla inbjudningsrelaterade funktioner
- Separerat olika typer av fel för att ge mer specifika felmeddelanden
- Användarvänliga felmeddelanden istället för generiska "okänt fel"

#### Förbättringar i inbjudningskomponenten
- Förbättrad felhantering i komponenten HouseholdInvites
- Systemkonfigurationsfel döljs för användaren
- Bättre meddelandevisning för olika felscenarier

### Installation
För att implementera alla ändringar:

1. Uppdatera applikationskoden
2. Kör följande SQL mot databasen:
```sql
-- Skapa en tabell för hushållsinbjudningar om den inte finns
CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) NOT NULL,
  from_user_name TEXT NOT NULL,
  to_email TEXT NOT NULL,
  household_id UUID REFERENCES households(id) NOT NULL,
  household_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Aktivera Row Level Security
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- RLS-policys för inbjudningar
-- Tillåt användare att se inbjudningar de har skickat
CREATE POLICY "Användare kan se inbjudningar de har skickat"
  ON household_invitations FOR SELECT
  USING (from_user_id = auth.uid());

-- Tillåt användare att se inbjudningar de har fått (via e-post)
CREATE POLICY "Användare kan se inbjudningar de har fått"
  ON household_invitations FOR SELECT
  USING (to_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Tillåt användare att skapa nya inbjudningar för sitt hushåll
CREATE POLICY "Användare kan skapa inbjudningar för sitt hushåll"
  ON household_invitations FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- Tillåt användare att uppdatera status för inbjudningar de har fått
CREATE POLICY "Användare kan uppdatera status för inbjudningar de har fått"
  ON household_invitations FOR UPDATE
  USING (
    to_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- För administratören (om detta behövs)
CREATE POLICY "Admin kan hantera alla inbjudningar"
  ON household_invitations
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
  );
``` 