export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      atm_cards: {
        Row: {
          card_holder_name: string
          card_number: string
          card_type: string
          created_at: string
          cvv: string
          expiry_date: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          card_holder_name: string
          card_number: string
          card_type?: string
          created_at?: string
          cvv: string
          expiry_date: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          card_holder_name?: string
          card_number?: string
          card_type?: string
          created_at?: string
          cvv?: string
          expiry_date?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_transfers: {
        Row: {
          amount: number
          coin_symbol: string
          created_at: string
          id: string
          network: string
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          coin_symbol: string
          created_at?: string
          id?: string
          network: string
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          coin_symbol?: string
          created_at?: string
          id?: string
          network?: string
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          balance: number | null
          coin_name: string
          coin_symbol: string
          created_at: string
          id: string
          network: string
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          balance?: number | null
          coin_name: string
          coin_symbol: string
          created_at?: string
          id?: string
          network: string
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          balance?: number | null
          coin_name?: string
          coin_symbol?: string
          created_at?: string
          id?: string
          network?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      internal_transfers: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string | null
          address: string | null
          balance: number | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          phone: string | null
          profile_picture_url: string | null
          savings_balance: number | null
          transfer_pin: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          savings_balance?: number | null
          transfer_pin?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          savings_balance?: number | null
          transfer_pin?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          amount: number
          created_at: string
          crypto_amount: number | null
          crypto_symbol: string | null
          currency: string | null
          description: string | null
          id: string
          recipient_account: string | null
          recipient_bank: string | null
          recipient_name: string | null
          reference_id: string | null
          status: string | null
          transaction_type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_name?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_name?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          recipient_account: string
          recipient_bank: string
          recipient_name: string
          routing_number: string | null
          status: string
          swift_code: string | null
          transfer_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          recipient_account: string
          recipient_bank: string
          recipient_name: string
          routing_number?: string | null
          status?: string
          swift_code?: string | null
          transfer_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          recipient_account?: string
          recipient_bank?: string
          recipient_name?: string
          routing_number?: string | null
          status?: string
          swift_code?: string | null
          transfer_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_account_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
