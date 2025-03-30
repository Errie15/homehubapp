-- Denna fil fixar problemet med oändlig rekursion i profiles-tabellens policyer
-- Kör denna SQL i Supabase SQL Editor

-- 1. Ta bort alla befintliga policyer för profiles-tabellen
DROP POLICY IF EXISTS "Användare kan se sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan se profiler från samma hushåll" ON profiles;
DROP POLICY IF EXISTS "Användare kan uppdatera sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan se sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan uppdatera sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan skapa sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan infoga sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan läsa sin egen profil" ON profiles;

-- 2. Se till att RLS är aktiverat för tabellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Skapa enklare, icke-rekursiva RLS-policyer
-- Policy för att läsa egna data
CREATE POLICY "Användare kan läsa sin egen profil"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy för att uppdatera egna data
CREATE POLICY "Användare kan uppdatera sin egen profil"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy för att infoga egna data
CREATE POLICY "Användare kan infoga sin egen profil"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Skapa en separat policy för att läsa andra medlemmar i hushållet
-- Använd två steg för att undvika recursive policy problems 
CREATE OR REPLACE FUNCTION get_user_household_id(user_id UUID) 
RETURNS UUID
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT household_id FROM profiles WHERE id = user_id;
$$;

-- Använd funktionen i policyn för att undvika rekursion
CREATE POLICY "Användare kan se medlemmar i sitt hushåll"
ON profiles FOR SELECT
USING (
  household_id IS NOT NULL AND 
  household_id = get_user_household_id(auth.uid()) AND
  id <> auth.uid()
);

-- 5. Skapa en RPC-funktion för att kringgå RLS vid uppdatering av hushålls-ID
CREATE OR REPLACE FUNCTION update_profile_household(target_user_id UUID, target_household_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Kringgår RLS
AS $$
BEGIN
  -- Uppdatera profilen med hushålls-ID
  UPDATE profiles
  SET household_id = target_household_id
  WHERE id = target_user_id;
  
  -- Returnera den uppdaterade profilen
  RETURN QUERY SELECT * FROM profiles WHERE id = target_user_id;
END;
$$;

-- 6. Skapa en RPC-funktion för att kringgå RLS vid skapande av hushåll för en användare
CREATE OR REPLACE FUNCTION create_household_for_user(user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Kringgår RLS
AS $$
DECLARE
  new_household_id UUID;
  user_profile profiles;
BEGIN
  -- Kontrollera om användaren redan har ett hushåll
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  IF user_profile.household_id IS NOT NULL THEN
    -- Användaren har redan ett hushåll, returnera profilen som den är
    RETURN QUERY SELECT * FROM profiles WHERE id = user_id;
    RETURN;
  END IF;
  
  -- Skapa ett nytt hushåll för användaren
  INSERT INTO households (name, created_by)
  VALUES ('Mitt hushåll', user_id)
  RETURNING id INTO new_household_id;
  
  -- Uppdatera profilen med household_id
  UPDATE profiles
  SET household_id = new_household_id
  WHERE id = user_id;
  
  -- Returnera den uppdaterade profilen
  RETURN QUERY SELECT * FROM profiles WHERE id = user_id;
END;
$$;

-- 7. Skapa en funktion för att hämta hushållsmedlemmar
CREATE OR REPLACE FUNCTION get_household_members(target_household_id UUID)
RETURNS SETOF profiles
LANGUAGE SQL
SECURITY DEFINER -- Kringgår RLS
AS $$
  SELECT * FROM profiles WHERE household_id = target_household_id;
$$; 