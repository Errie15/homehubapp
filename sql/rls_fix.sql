-- Denna fil innehåller SQL för att fixa RLS-policyn för profiles-tabellen
-- Kör denna SQL i Supabase SQL Editor

-- 1. Ta bort eventuella befintliga RLS-policys för profiles-tabellen
DROP POLICY IF EXISTS "Användare kan se sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan uppdatera sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan se medlemmar i sitt hushåll" ON profiles;
DROP POLICY IF EXISTS "Användare kan se sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan uppdatera sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan skapa sin egen profil (förenklad)" ON profiles;
DROP POLICY IF EXISTS "Användare kan se profiler från samma hushåll" ON profiles;

-- 2. Se till att RLS är aktiverat för tabellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Lägg till policy för läsning av egen profil
CREATE POLICY "Användare kan se sin egen profil (förenklad)" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 4. Lägg till policy för att uppdatera sin egen profil
CREATE POLICY "Användare kan uppdatera sin egen profil (förenklad)" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Lägg till policy för att infoga sin egen profil
CREATE POLICY "Användare kan skapa sin egen profil (förenklad)" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 6. Lägg till policy för att se profiler från samma hushåll
CREATE POLICY "Användare kan se profiler från samma hushåll"
ON profiles FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);

-- 7. Skapa en hjälpfunktion för att hämta profil som kringgår RLS-problem
CREATE OR REPLACE FUNCTION get_user_profile(target_user_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM profiles WHERE id = target_user_id LIMIT 1;
$$;

-- 8. Skapa en hjälpfunktion för att uppdatera eller skapa profil som kringgår RLS
CREATE OR REPLACE FUNCTION handle_profile_upsert(user_id UUID, profile_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Kontrollera om profilen finns
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Uppdatera befintlig profil
    UPDATE profiles 
    SET 
      name = COALESCE(profile_data->>'name', name),
      role = COALESCE(profile_data->>'role', role),
      avatar_url = COALESCE(profile_data->>'avatar_url', avatar_url),
      updated_at = now()
    WHERE id = user_id
    RETURNING to_jsonb(profiles.*) INTO result;
  ELSE
    -- Skapa ny profil
    INSERT INTO profiles (
      id, 
      name, 
      role, 
      avatar_url, 
      points, 
      created_at
    ) 
    VALUES (
      user_id, 
      profile_data->>'name', 
      COALESCE(profile_data->>'role', 'Användare'), 
      profile_data->>'avatar_url',
      COALESCE((profile_data->>'points')::int, 0),
      now()
    )
    RETURNING to_jsonb(profiles.*) INTO result;
  END IF;
  
  RETURN result;
END;
$$; 