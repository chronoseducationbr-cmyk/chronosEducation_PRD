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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      enrollments: {
        Row: {
          contract_sent_at: string | null
          contract_signed_at: string | null
          contract_url: string | null
          created_at: string
          id: string
          inscription_fee_cents: number
          referred_by_email: string | null
          status: string
          student_address: string | null
          student_birth_date: string | null
          student_email: string | null
          student_graduation_year: number | null
          student_name: string
          student_school: string | null
          summercamp_installment_cents: number
          summercamp_installments: number
          summercamp_start_date: string | null
          tuition_installment_cents: number
          tuition_installments: number
          tuition_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string
          id?: string
          inscription_fee_cents?: number
          referred_by_email?: string | null
          status?: string
          student_address?: string | null
          student_birth_date?: string | null
          student_email?: string | null
          student_graduation_year?: number | null
          student_name?: string
          student_school?: string | null
          summercamp_installment_cents?: number
          summercamp_installments?: number
          summercamp_start_date?: string | null
          tuition_installment_cents?: number
          tuition_installments?: number
          tuition_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string
          id?: string
          inscription_fee_cents?: number
          referred_by_email?: string | null
          status?: string
          student_address?: string | null
          student_birth_date?: string | null
          student_email?: string | null
          student_graduation_year?: number | null
          student_name?: string
          student_school?: string | null
          summercamp_installment_cents?: number
          summercamp_installments?: number
          summercamp_start_date?: string | null
          tuition_installment_cents?: number
          tuition_installments?: number
          tuition_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount_cents: number
          boleto_url: string | null
          created_at: string
          discount_percent: number
          due_date: string | null
          enrollment_id: string
          id: string
          installment_number: number
          paid_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          boleto_url?: string | null
          created_at?: string
          discount_percent?: number
          due_date?: string | null
          enrollment_id: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          boleto_url?: string | null
          created_at?: string
          discount_percent?: number
          due_date?: string | null
          enrollment_id?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          invited_by: string | null
          status: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_code: string
          invited_by?: string | null
          status?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          status?: string
          used_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          plan_id: string
          price_cents: number
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          plan_id: string
          price_cents: number
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: string
          plan_id?: string
          price_cents?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          plan_type: string
          price_cents: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          plan_type: string
          price_cents: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          plan_type?: string
          price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          referred_by_email: string | null
          student_address: string | null
          student_age: number | null
          student_birth_date: string | null
          student_email: string | null
          student_graduation_year: number | null
          student_name: string | null
          student_photo_url: string | null
          student_school: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          referred_by_email?: string | null
          student_address?: string | null
          student_age?: number | null
          student_birth_date?: string | null
          student_email?: string | null
          student_graduation_year?: number | null
          student_name?: string | null
          student_photo_url?: string | null
          student_school?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          referred_by_email?: string | null
          student_address?: string | null
          student_age?: number | null
          student_birth_date?: string | null
          student_email?: string | null
          student_graduation_year?: number | null
          student_name?: string | null
          student_photo_url?: string | null
          student_school?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          correct_count: number
          created_at: string
          enrollment_id: string
          id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          enrollment_id: string
          id?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          enrollment_id?: string
          id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_enrollment_id: string
          referred_student_email: string
          referrer_enrollment_id: string
          referrer_student_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_enrollment_id: string
          referred_student_email: string
          referrer_enrollment_id: string
          referrer_student_email: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_enrollment_id?: string
          referred_student_email?: string
          referrer_enrollment_id?: string
          referrer_student_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_enrollment_id_fkey"
            columns: ["referred_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_enrollment_id_fkey"
            columns: ["referrer_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_admin_invitations: {
        Args: never
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          status: string
          used_at: string
        }[]
      }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
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
