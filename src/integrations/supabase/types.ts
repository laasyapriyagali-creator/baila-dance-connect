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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          city: string | null
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          level: string
          recurrence: string | null
          style: string
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          level?: string
          recurrence?: string | null
          style: string
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          level?: string
          recurrence?: string | null
          style?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          again_from: boolean
          again_to: boolean
          created_at: string
          from_user: string
          id: string
          seen_at: string | null
          status: Database["public"]["Enums"]["connection_status"]
          to_user: string
          updated_at: string
        }
        Insert: {
          again_from?: boolean
          again_to?: boolean
          created_at?: string
          from_user: string
          id?: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          to_user: string
          updated_at?: string
        }
        Update: {
          again_from?: boolean
          again_to?: boolean
          created_at?: string
          from_user?: string
          id?: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          to_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      dance_dates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          request_id: string
          starts_at: string
          style: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          request_id: string
          starts_at: string
          style?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          request_id?: string
          starts_at?: string
          style?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "dance_dates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      dance_videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          is_main: boolean
          position: number
          poster_url: string | null
          storage_path: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_main?: boolean
          position?: number
          poster_url?: string | null
          storage_path: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_main?: boolean
          position?: number
          poster_url?: string | null
          storage_path?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          organizer_id: string
          starts_at: string
          style: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organizer_id: string
          starts_at: string
          style?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organizer_id?: string
          starts_at?: string
          style?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      feed_skips: {
        Row: {
          created_at: string
          id: string
          skipped_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skipped_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skipped_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          availability: string[]
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          dance_styles: string[]
          display_name: string | null
          experience: string | null
          favorite_style: string | null
          headline: string | null
          id: string
          languages: string[]
          onboarded: boolean
          paused: boolean
          role: Database["public"]["Enums"]["app_role"]
          socials: Json
          updated_at: string
          username: string | null
          years_dancing: number | null
        }
        Insert: {
          age?: number | null
          availability?: string[]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          dance_styles?: string[]
          display_name?: string | null
          experience?: string | null
          favorite_style?: string | null
          headline?: string | null
          id: string
          languages?: string[]
          onboarded?: boolean
          paused?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          socials?: Json
          updated_at?: string
          username?: string | null
          years_dancing?: number | null
        }
        Update: {
          age?: number | null
          availability?: string[]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          dance_styles?: string[]
          display_name?: string | null
          experience?: string | null
          favorite_style?: string | null
          headline?: string | null
          id?: string
          languages?: string[]
          onboarded?: boolean
          paused?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          socials?: Json
          updated_at?: string
          username?: string | null
          years_dancing?: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          reason: string
          reported_id: string
          reporter_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          reason: string
          reported_id: string
          reporter_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          reported_id?: string
          reporter_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "dance_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          age_max: number
          age_min: number
          autoplay: boolean
          blur_explicit: boolean
          created_at: string
          discoverable: boolean
          discovery_styles: string[]
          emergency_contact: string | null
          max_distance_km: number
          notif_again: boolean
          notif_decisions: boolean
          notif_master: boolean
          notif_reminders: boolean
          notif_requests: boolean
          trusted_contact: string | null
          updated_at: string
          user_id: string
          video_quality: string
          videos_public: boolean
        }
        Insert: {
          age_max?: number
          age_min?: number
          autoplay?: boolean
          blur_explicit?: boolean
          created_at?: string
          discoverable?: boolean
          discovery_styles?: string[]
          emergency_contact?: string | null
          max_distance_km?: number
          notif_again?: boolean
          notif_decisions?: boolean
          notif_master?: boolean
          notif_reminders?: boolean
          notif_requests?: boolean
          trusted_contact?: string | null
          updated_at?: string
          user_id: string
          video_quality?: string
          videos_public?: boolean
        }
        Update: {
          age_max?: number
          age_min?: number
          autoplay?: boolean
          blur_explicit?: boolean
          created_at?: string
          discoverable?: boolean
          discovery_styles?: string[]
          emergency_contact?: string | null
          max_distance_km?: number
          notif_again?: boolean
          notif_decisions?: boolean
          notif_master?: boolean
          notif_reminders?: boolean
          notif_requests?: boolean
          trusted_contact?: string | null
          updated_at?: string
          user_id?: string
          video_quality?: string
          videos_public?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_pair: { Args: { _a: string; _b: string }; Returns: boolean }
      videos_visible: { Args: { _owner: string }; Returns: boolean }
    }
    Enums: {
      app_role: "dancer" | "instructor" | "organizer"
      connection_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "completed"
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
      app_role: ["dancer", "instructor", "organizer"],
      connection_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "completed",
      ],
    },
  },
} as const
