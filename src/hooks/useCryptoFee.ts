import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoFee {
  id: string;
  coin_symbol: string;
  coin_name: string;
  fee_amount: number;
  is_active: boolean;
}

export const useCryptoFees = () => {
  const { data: cryptoFees, isLoading } = useQuery({
    queryKey: ['crypto-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_fee_settings')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching crypto fees:', error);
        return [];
      }
      
      return data as CryptoFee[];
    },
  });

  const getActiveFee = () => {
    if (!cryptoFees || cryptoFees.length === 0) return null;
    return cryptoFees[0]; // Return first active fee
  };

  return { cryptoFees: cryptoFees ?? [], getActiveFee, isLoading };
};
