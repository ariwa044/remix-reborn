import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTransferFee = () => {
  const { data: transferFee, isLoading } = useQuery({
    queryKey: ['transfer-fee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'transfer_fee')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching transfer fee:', error);
        return 25; // Default fee
      }
      
      return parseFloat(data?.setting_value || '25');
    },
  });

  return { transferFee: transferFee ?? 25, isLoading };
};
