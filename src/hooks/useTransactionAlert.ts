import { supabase } from '@/integrations/supabase/client';

interface TransactionAlertParams {
  email: string;
  fullName: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  balance: number;
  transactionId: string;
  recipientName?: string;
  recipientAccount?: string;
}

export const sendTransactionAlert = async (params: TransactionAlertParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-transaction-alert', {
      body: params,
    });

    if (error) {
      console.error('Error sending transaction alert:', error);
      return { success: false, error };
    }

    console.log('Transaction alert sent successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error sending transaction alert:', error);
    return { success: false, error };
  }
};
