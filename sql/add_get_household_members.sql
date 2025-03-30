-- Denna fil lägger till en funktion för att hämta medlemmar i ett hushåll
-- Kör denna SQL i Supabase SQL Editor

-- 1. Skapa en RPC-funktion för att hämta hushållsmedlemmar som kringgår RLS
CREATE OR REPLACE FUNCTION get_household_members(target_household_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER -- Kringgår RLS
AS $$
    SELECT * FROM profiles WHERE household_id = target_household_id;
$$; 