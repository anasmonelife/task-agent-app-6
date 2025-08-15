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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          permission_name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          permission_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          permission_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          admin_user_id: string
          created_at: string
          granted_by: string | null
          id: string
          permission_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      agent_permissions: {
        Row: {
          agent_id: string
          created_at: string
          granted_by: string | null
          id: string
          permission_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ratings: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          rated_by: string
          rating: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          rated_by: string
          rating: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          rated_by?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          panchayath_id: string
          phone: string | null
          role: Database["public"]["Enums"]["agent_role"]
          superior_id: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          panchayath_id: string
          phone?: string | null
          role: Database["public"]["Enums"]["agent_role"]
          superior_id?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          panchayath_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["agent_role"]
          superior_id?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_superior_id_fkey"
            columns: ["superior_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activities: {
        Row: {
          activity_date: string
          activity_description: string
          agent_id: string
          created_at: string
          id: string
          mobile_number: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          activity_description: string
          agent_id: string
          created_at?: string
          id?: string
          mobile_number: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_description?: string
          agent_id?: string
          created_at?: string
          id?: string
          mobile_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      management_team_members: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "management_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      management_teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          team_password: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          team_password?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          team_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      panchayath_locations: {
        Row: {
          district: string
          id: string
          panchayath: string
          state: string
        }
        Insert: {
          district: string
          id?: string
          panchayath: string
          state: string
        }
        Update: {
          district?: string
          id?: string
          panchayath?: string
          state?: string
        }
        Relationships: []
      }
      panchayath_notes: {
        Row: {
          agent_id: string | null
          category: string
          created_at: string
          created_by: string
          id: string
          note: string
          panchayath_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          category?: string
          created_at?: string
          created_by: string
          id?: string
          note: string
          panchayath_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          panchayath_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "panchayath_notes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panchayath_notes_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
        ]
      }
      panchayaths: {
        Row: {
          created_at: string
          district: string
          id: string
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_remarks: {
        Row: {
          created_at: string
          id: string
          remark: string
          task_id: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          remark: string
          task_id: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          remark?: string
          task_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_remarks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          allocated_to_agent: string | null
          allocated_to_team: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          allocated_to_agent?: string | null
          allocated_to_team?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          allocated_to_agent?: string | null
          allocated_to_team?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_allocated_to_agent_fkey"
            columns: ["allocated_to_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_allocated_to_team_fkey"
            columns: ["allocated_to_team"]
            isOneToOne: false
            referencedRelation: "management_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_leader_id: {
        Row: {
          id: string | null
        }
        Insert: {
          id?: string | null
        }
        Update: {
          id?: string | null
        }
        Relationships: []
      }
      team_leader_panchayaths: {
        Row: {
          created_at: string
          id: string
          panchayath_id: string
          team_leader_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          panchayath_id: string
          team_leader_id: string
        }
        Update: {
          created_at?: string
          id?: string
          panchayath_id?: string
          team_leader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_leader_panchayaths_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_leader_panchayaths_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "team_leaders"
            referencedColumns: ["id"]
          },
        ]
      }
      team_leaders: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_notifications: {
        Row: {
          agent_mobile: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          task_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          agent_mobile: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          task_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_mobile?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          task_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "management_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "management_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_registration_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          mobile_number: string
          panchayath_id: string | null
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          mobile_number: string
          panchayath_id?: string | null
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          mobile_number?: string
          panchayath_id?: string | null
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_registration_requests_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_team_by_id: {
        Args: { team_id: string }
        Returns: {
          description: string
          id: string
          name: string
          team_password: string
        }[]
      }
    }
    Enums: {
      agent_role: "coordinator" | "supervisor" | "group-leader" | "pro"
      registration_status: "pending" | "approved" | "rejected"
      task_priority: "high" | "medium" | "normal"
      task_status: "pending" | "completed" | "cancelled"
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
      agent_role: ["coordinator", "supervisor", "group-leader", "pro"],
      registration_status: ["pending", "approved", "rejected"],
      task_priority: ["high", "medium", "normal"],
      task_status: ["pending", "completed", "cancelled"],
    },
  },
} as const
