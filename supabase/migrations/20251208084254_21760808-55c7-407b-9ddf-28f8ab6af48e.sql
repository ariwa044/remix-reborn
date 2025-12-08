-- Add account_number column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- Create function to generate unique 10-digit account number
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_number TEXT;
  account_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 10 random digits
    new_account_number := LPAD(FLOOR(RANDOM() * 9999999999)::TEXT, 10, '0');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE account_number = new_account_number) INTO account_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT account_exists;
  END LOOP;
  
  RETURN new_account_number;
END;
$$;

-- Update handle_new_user to include account number generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, account_number)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email, public.generate_account_number());
  RETURN new;
END;
$$;

-- Generate account numbers for existing users who don't have one
UPDATE public.profiles 
SET account_number = public.generate_account_number() 
WHERE account_number IS NULL;

-- Create internal_transfers table for user-to-user transfers
CREATE TABLE IF NOT EXISTS public.internal_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on internal_transfers
ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for internal_transfers
CREATE POLICY "Users can view their own transfers" ON public.internal_transfers
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert transfers as sender" ON public.internal_transfers
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create crypto_transfers table for internal crypto transfers
CREATE TABLE IF NOT EXISTS public.crypto_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  network TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on crypto_transfers
ALTER TABLE public.crypto_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for crypto_transfers
CREATE POLICY "Users can view their own crypto transfers" ON public.crypto_transfers
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert crypto transfers as sender" ON public.crypto_transfers
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Add policy for users to view other users' account numbers for transfers
CREATE POLICY "Users can search accounts by number" ON public.profiles
FOR SELECT USING (true);