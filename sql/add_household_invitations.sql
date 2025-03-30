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

-- Ta bort eventuella befintliga policyer för att undvika dubbletter
DROP POLICY IF EXISTS "Användare kan se inbjudningar de har skickat" ON household_invitations;
DROP POLICY IF EXISTS "Användare kan se inbjudningar de har fått" ON household_invitations;
DROP POLICY IF EXISTS "Användare kan skapa inbjudningar för sitt hushåll" ON household_invitations;
DROP POLICY IF EXISTS "Användare kan uppdatera status för inbjudningar de har fått" ON household_invitations;

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

