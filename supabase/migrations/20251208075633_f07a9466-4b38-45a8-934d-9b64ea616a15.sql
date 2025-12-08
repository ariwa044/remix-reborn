-- Add transfer_pin and wallet columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS transfer_pin TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS username TEXT DEFAULT NULL;

-- Create crypto wallets table
CREATE TABLE public.crypto_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  balance DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, coin_symbol, network)
);

-- Enable RLS on crypto_wallets
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for crypto_wallets
CREATE POLICY "Users can view their own wallets"
ON public.crypto_wallets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
ON public.crypto_wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
ON public.crypto_wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Create transfers table
CREATE TABLE public.transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('local', 'international')),
  recipient_name TEXT NOT NULL,
  recipient_account TEXT NOT NULL,
  recipient_bank TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  swift_code TEXT,
  routing_number TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transfers
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for transfers
CREATE POLICY "Users can view their own transfers"
ON public.transfers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transfers"
ON public.transfers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create ATM cards table
CREATE TABLE public.atm_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  card_number TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'visa',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on atm_cards
ALTER TABLE public.atm_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for atm_cards
CREATE POLICY "Users can view their own card"
ON public.atm_cards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card"
ON public.atm_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to generate card on user signup
CREATE OR REPLACE FUNCTION public.generate_atm_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  card_num TEXT;
  exp_date TEXT;
  card_cvv TEXT;
BEGIN
  -- Generate 16 digit card number starting with 4 (Visa)
  card_num := '4' || LPAD(FLOOR(RANDOM() * 999999999999999)::TEXT, 15, '0');
  -- Generate expiry date 5 years from now
  exp_date := TO_CHAR(CURRENT_DATE + INTERVAL '5 years', 'MM/YY');
  -- Generate 3 digit CVV
  card_cvv := LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0');
  
  INSERT INTO public.atm_cards (user_id, card_number, card_holder_name, expiry_date, cvv)
  VALUES (NEW.user_id, card_num, COALESCE(NEW.full_name, 'CARD HOLDER'), exp_date, card_cvv);
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate ATM card when profile is created
CREATE TRIGGER on_profile_created_generate_card
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_atm_card();

-- Trigger for updated_at on crypto_wallets
CREATE TRIGGER update_crypto_wallets_updated_at
  BEFORE UPDATE ON public.crypto_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();