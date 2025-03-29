-- Först ta bort eventuella triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ta bort funktioner
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ta bort policys (inte nödvändigt om vi tar bort tabellerna, men bra för tydlighetens skull)
DROP POLICY IF EXISTS "Användare kan se sin egen profil" ON profiles;
DROP POLICY IF EXISTS "Användare kan se profiler från samma hushåll" ON profiles;
DROP POLICY IF EXISTS "Användare kan uppdatera sin egen profil" ON profiles;

DROP POLICY IF EXISTS "Användare kan se sitt eget hushåll" ON households;
DROP POLICY IF EXISTS "Användare kan uppdatera sitt eget hushåll" ON households;

DROP POLICY IF EXISTS "Användare kan se uppgifter från sitt hushåll" ON tasks;
DROP POLICY IF EXISTS "Användare kan lägga till uppgifter i sitt hushåll" ON tasks;
DROP POLICY IF EXISTS "Användare kan uppdatera uppgifter i sitt hushåll" ON tasks;
DROP POLICY IF EXISTS "Användare kan ta bort uppgifter i sitt hushåll" ON tasks;

DROP POLICY IF EXISTS "Användare kan se schemalagda uppgifter från sitt hushåll" ON scheduled_tasks;
DROP POLICY IF EXISTS "Användare kan lägga till schemalagda uppgifter i sitt hushåll" ON scheduled_tasks;
DROP POLICY IF EXISTS "Användare kan uppdatera schemalagda uppgifter i sitt hushåll" ON scheduled_tasks;
DROP POLICY IF EXISTS "Användare kan ta bort schemalagda uppgifter i sitt hushåll" ON scheduled_tasks;

DROP POLICY IF EXISTS "Användare kan se belöningar från sitt hushåll" ON rewards;
DROP POLICY IF EXISTS "Användare kan lägga till belöningar i sitt hushåll" ON rewards;
DROP POLICY IF EXISTS "Användare kan uppdatera belöningar i sitt hushåll" ON rewards;
DROP POLICY IF EXISTS "Användare kan ta bort belöningar i sitt hushåll" ON rewards;

DROP POLICY IF EXISTS "Användare kan se inlösta belöningar från sitt hushåll" ON redeemed_rewards;
DROP POLICY IF EXISTS "Användare kan lösa in belöningar i sitt hushåll" ON redeemed_rewards;

-- Ta bort tabeller i rätt ordning (för att respektera foreign keys)
DROP TABLE IF EXISTS redeemed_rewards;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS scheduled_tasks;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS profiles;

-- Nu kan vi skapa våra tabeller och policys på nytt

-- Användarprofiler
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  household_id UUID,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Hushåll
CREATE TABLE households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Lägg till foreign key constraint för profiles -> households
ALTER TABLE profiles 
ADD CONSTRAINT fk_household
FOREIGN KEY (household_id) REFERENCES households(id);

-- Uppgifter
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  household_id UUID REFERENCES households(id),
  points INTEGER DEFAULT 10,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Schemaläggning
CREATE TABLE scheduled_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  household_id UUID REFERENCES households(id),
  day_of_week INTEGER NOT NULL,
  start_time TIME,
  end_time TIME,
  points INTEGER DEFAULT 10,
  category TEXT,
  is_recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Belöningar
CREATE TABLE rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  image TEXT,
  household_id UUID REFERENCES households(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Inlösta belöningar
CREATE TABLE redeemed_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reward_id UUID REFERENCES rewards(id),
  user_id UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Aktivera Row Level Security för alla tabeller
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- RLS-policys för profiles
-- Tillåt användare att läsa sina egna uppgifter och profiler från samma hushåll
CREATE POLICY "Användare kan se sin egen profil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Användare kan se profiler från samma hushåll"
  ON profiles FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Användare kan uppdatera sin egen profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS-policys för households
-- Tillåt användare att se sitt eget hushåll
CREATE POLICY "Användare kan se sitt eget hushåll"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan uppdatera sitt eget hushåll"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- RLS-policys för tasks
-- Tillåt användare att se uppgifter från sitt hushåll
CREATE POLICY "Användare kan se uppgifter från sitt hushåll"
  ON tasks FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan lägga till uppgifter i sitt hushåll"
  ON tasks FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan uppdatera uppgifter i sitt hushåll"
  ON tasks FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan ta bort uppgifter i sitt hushåll"
  ON tasks FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- RLS-policys för scheduled_tasks
-- Samma princip som för tasks
CREATE POLICY "Användare kan se schemalagda uppgifter från sitt hushåll"
  ON scheduled_tasks FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan lägga till schemalagda uppgifter i sitt hushåll"
  ON scheduled_tasks FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan uppdatera schemalagda uppgifter i sitt hushåll"
  ON scheduled_tasks FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan ta bort schemalagda uppgifter i sitt hushåll"
  ON scheduled_tasks FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- RLS-policys för rewards
-- Tillåt användare att se belöningar från sitt hushåll
CREATE POLICY "Användare kan se belöningar från sitt hushåll"
  ON rewards FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan lägga till belöningar i sitt hushåll"
  ON rewards FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan uppdatera belöningar i sitt hushåll"
  ON rewards FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Användare kan ta bort belöningar i sitt hushåll"
  ON rewards FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- RLS-policys för redeemed_rewards
-- Tillåt användare att se inlösta belöningar från sitt hushåll
CREATE POLICY "Användare kan se inlösta belöningar från sitt hushåll"
  ON redeemed_rewards FOR SELECT
  USING (
    reward_id IN (
      SELECT id FROM rewards WHERE household_id IN (
        SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Användare kan lösa in belöningar i sitt hushåll"
  ON redeemed_rewards FOR INSERT
  WITH CHECK (
    reward_id IN (
      SELECT id FROM rewards WHERE household_id IN (
        SELECT household_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

-- Speciallösning för cirkulärt beroende mellan profiles och households
-- Vi behöver en annan approach för att hantera skapandet av första användaren och hushållet

-- Skapa en förbättrad funktion för att automatiskt skapa profiler och hushåll
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Skapa först en profil utan household_id
  INSERT INTO public.profiles (id, name, email, avatar_url, points)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',  -- Använd full_name från metadata
    new.email,                             -- Ta e-post direkt från auth
    new.raw_user_meta_data->>'avatar_url', 
    0
  );
  
  -- Skapa ett nytt hushåll för användaren
  INSERT INTO public.households (name, created_by)
  VALUES ('Mitt hushåll', new.id)
  RETURNING id INTO new_household_id;
  
  -- Uppdatera profilen med household_id
  UPDATE public.profiles
  SET household_id = new_household_id
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa en trigger som anropar funktionen efter registrering
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 