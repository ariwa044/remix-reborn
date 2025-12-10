-- Drop old policies that check profiles.is_admin causing recursion
DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can update all crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "Admins can view all crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "Admins can insert transaction history" ON public.transaction_history;
DROP POLICY IF EXISTS "Admins can update all transfers" ON public.transfers;
DROP POLICY IF EXISTS "Admins can view all transfers" ON public.transfers;

-- Recreate policies using has_role function
CREATE POLICY "Admins can insert admin logs" 
ON public.admin_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view admin logs" 
ON public.admin_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all crypto wallets" 
ON public.crypto_wallets 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all crypto wallets" 
ON public.crypto_wallets 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transaction history" 
ON public.transaction_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all transfers" 
ON public.transfers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all transfers" 
ON public.transfers 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));