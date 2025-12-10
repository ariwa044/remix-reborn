-- Create deposit_addresses table for admin-managed deposit addresses
CREATE TABLE public.deposit_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_symbol text NOT NULL UNIQUE,
  coin_name text NOT NULL,
  network text NOT NULL,
  wallet_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Anyone can read deposit addresses (users need to see them)
CREATE POLICY "Anyone can read deposit addresses" 
ON public.deposit_addresses 
FOR SELECT 
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert deposit addresses" 
ON public.deposit_addresses 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update deposit addresses" 
ON public.deposit_addresses 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete deposit addresses" 
ON public.deposit_addresses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create crypto_fee_settings table for per-coin fee configuration
CREATE TABLE public.crypto_fee_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_symbol text NOT NULL UNIQUE,
  coin_name text NOT NULL,
  fee_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_fee_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read fee settings
CREATE POLICY "Anyone can read crypto fee settings" 
ON public.crypto_fee_settings 
FOR SELECT 
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert crypto fee settings" 
ON public.crypto_fee_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update crypto fee settings" 
ON public.crypto_fee_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all transfers (needed for pending transfers section)
CREATE POLICY "Admins can view all internal transfers" 
ON public.internal_transfers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update internal transfers
CREATE POLICY "Admins can update internal transfers" 
ON public.internal_transfers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all transaction history
CREATE POLICY "Admins can view all transaction history" 
ON public.transaction_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to update transaction history status
CREATE POLICY "Admins can update transaction history" 
ON public.transaction_history 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));