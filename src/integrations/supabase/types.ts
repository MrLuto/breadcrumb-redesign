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
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      closed_days: {
        Row: {
          created_at: string | null
          date: string | null
          day_of_week: number | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          day_of_week?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          day_of_week?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          preferred_payment_method:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          city: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string | null
          customer_type: string | null
          delivery_address: string | null
          email: string | null
          id: string
          phone: string | null
          postcode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          customer_type?: string | null
          delivery_address?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          customer_type?: string | null
          delivery_address?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          delivery_cost: number
          id: string
          is_active: boolean
          min_order_amount: number | null
          postcode_prefix: string
          updated_at: string
          zone_name: string
        }
        Insert: {
          created_at?: string
          delivery_cost?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          postcode_prefix: string
          updated_at?: string
          zone_name: string
        }
        Update: {
          created_at?: string
          delivery_cost?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          postcode_prefix?: string
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status_type"]
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status_type"]
          subtotal: number
          total: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status_type"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_postcodes: {
        Row: {
          city: string | null
          created_at: string
          id: string
          in_delivery_area: boolean
          ip_address: string
          postcode: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          in_delivery_area?: boolean
          ip_address: string
          postcode: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          in_delivery_area?: boolean
          ip_address?: string
          postcode?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_postcode: string | null
          city: string
          company_id: string | null
          company_name: string
          confirmation_token: string | null
          contact_person: string
          created_at: string
          customer_type: string | null
          delivery_address: string
          delivery_asap: boolean | null
          delivery_cost: number
          delivery_date: string
          delivery_time: string | null
          delivery_zone: string | null
          department: string | null
          email: string
          id: string
          invoice_id: string | null
          kvk_number: string | null
          notes: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status_type"]
          order_type: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          payment_status: Database["public"]["Enums"]["payment_status_type"]
          phone: string
          postcode: string
          print_count: number | null
          printed_at: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postcode?: string | null
          city: string
          company_id?: string | null
          company_name: string
          confirmation_token?: string | null
          contact_person: string
          created_at?: string
          customer_type?: string | null
          delivery_address: string
          delivery_asap?: boolean | null
          delivery_cost?: number
          delivery_date: string
          delivery_time?: string | null
          delivery_zone?: string | null
          department?: string | null
          email: string
          id?: string
          invoice_id?: string | null
          kvk_number?: string | null
          notes?: string | null
          order_number: string
          order_status?: Database["public"]["Enums"]["order_status_type"]
          order_type?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          phone: string
          postcode: string
          print_count?: number | null
          printed_at?: string | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postcode?: string | null
          city?: string
          company_id?: string | null
          company_name?: string
          confirmation_token?: string | null
          contact_person?: string
          created_at?: string
          customer_type?: string | null
          delivery_address?: string
          delivery_asap?: boolean | null
          delivery_cost?: number
          delivery_date?: string
          delivery_time?: string | null
          delivery_zone?: string | null
          department?: string | null
          email?: string
          id?: string
          invoice_id?: string | null
          kvk_number?: string | null
          notes?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status_type"]
          order_type?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          payment_status?: Database["public"]["Enums"]["payment_status_type"]
          phone?: string
          postcode?: string
          print_count?: number | null
          printed_at?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          dietary_info: Json | null
          display_order: number
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dietary_info?: Json | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dietary_info?: Json | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
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
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      verify_order_token: {
        Args: { order_id: string; token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator"
      invoice_status_type: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      order_status_type:
        | "new"
        | "confirmed"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      payment_method_type: "direct" | "invoice" | "monthly_invoice"
      payment_status_type: "pending" | "paid" | "invoiced" | "refunded"
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
      app_role: ["admin", "moderator"],
      invoice_status_type: ["draft", "sent", "paid", "overdue", "cancelled"],
      order_status_type: [
        "new",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method_type: ["direct", "invoice", "monthly_invoice"],
      payment_status_type: ["pending", "paid", "invoiced", "refunded"],
    },
  },
} as const
