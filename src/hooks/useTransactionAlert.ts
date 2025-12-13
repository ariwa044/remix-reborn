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
    const response = await fetch('/api/send-transaction-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending transaction alert:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('Transaction alert sent successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error sending transaction alert:', error);
    return { success: false, error };
  }
};
