-- Add balance and is_blocked fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS savings_balance DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create transaction_history table for all transactions
CREATE TABLE IF NOT EXISTS public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'transfer_out', 'transfer_in', 'deposit', 'crypto_convert', 'crypto_send', 'admin_credit', 'admin_debit'
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  reference_id TEXT,
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_bank TEXT,
  crypto_symbol TEXT,
  crypto_amount DECIMAL(24, 8),
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transaction_history
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own transaction history
CREATE POLICY "Users can view own transaction history" ON public.transaction_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Only admins can insert admin logs
CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Allow admins to manage all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Allow admins to manage all crypto wallets
CREATE POLICY "Admins can view all crypto wallets" ON public.crypto_wallets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all crypto wallets" ON public.crypto_wallets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Allow admins to manage all transfers
CREATE POLICY "Admins can view all transfers" ON public.transfers
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all transfers" ON public.transfers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Allow admins to insert transaction history for any user
CREATE POLICY "Admins can insert transaction history" ON public.transaction_history
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );