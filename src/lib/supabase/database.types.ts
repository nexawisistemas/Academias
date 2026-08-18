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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      access_events: {
        Row: {
          branch_id: string
          direction: string
          id: number
          member_id: string
          method: string
          occurred_at: string
          organization_id: string
          reason: string | null
        }
        Insert: {
          branch_id: string
          direction?: string
          id?: never
          member_id: string
          method?: string
          occurred_at?: string
          organization_id: string
          reason?: string | null
        }
        Update: {
          branch_id?: string
          direction?: string
          id?: never
          member_id?: string
          method?: string
          occurred_at?: string
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          branch_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip: unknown
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          ip?: unknown
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip?: unknown
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: Json
          created_at: string
          email: string | null
          id: string
          is_main: boolean
          name: string
          organization_id: string
          phone: string | null
          settings: Json
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_main?: boolean
          name: string
          organization_id: string
          phone?: string | null
          settings?: Json
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_main?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          settings?: Json
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          checked_in_at: string | null
          created_at: string
          id: string
          member_id: string
          organization_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          organization_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          organization_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          branch_id: string
          capacity: number
          class_type_id: string | null
          coach_profile_id: string | null
          created_at: string
          ends_at: string
          id: string
          organization_id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number
          class_type_id?: string | null
          coach_profile_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          organization_id: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number
          class_type_id?: string | null
          coach_profile_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          organization_id?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_coach_profile_id_fkey"
            columns: ["coach_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          active: boolean
          color: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_campaigns: {
        Row: {
          audience: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          name: string
          organization_id: string
          recipients_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          audience: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          name: string
          organization_id: string
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          name?: string
          organization_id?: string
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          actor_profile_id: string | null
          completed_at: string | null
          content: string | null
          created_at: string
          id: string
          lead_id: string
          organization_id: string
          scheduled_for: string | null
          type: string
        }
        Insert: {
          actor_profile_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          organization_id: string
          scheduled_for?: string | null
          type: string
        }
        Update: {
          actor_profile_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          organization_id?: string
          scheduled_for?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          interest: string | null
          last_contact_at: string | null
          lost_at: string | null
          next_action_at: string | null
          notes: string | null
          organization_id: string
          owner_profile_id: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
          won_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          lost_at?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization_id: string
          owner_profile_id?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          won_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          lost_at?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization_id?: string
          owner_profile_id?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          kind: string
          organization_id: string
          status: string
          updated_at: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          kind?: string
          organization_id: string
          status?: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          kind?: string
          organization_id?: string
          status?: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          active: boolean
          created_at: string
          equipment: string | null
          id: string
          instructions: string | null
          media_url: string | null
          muscle_group: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          media_url?: string | null
          muscle_group?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          media_url?: string | null
          muscle_group?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          due_date: string
          id: string
          member_id: string
          organization_id: string
          paid_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          member_id: string
          organization_id: string
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          member_id?: string
          organization_id?: string
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_contracts: {
        Row: {
          accepted_at: string | null
          accepted_ip: unknown
          created_at: string
          document_path: string | null
          id: string
          member_id: string
          organization_id: string
          status: string
          subscription_id: string | null
          terms_version: string
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: unknown
          created_at?: string
          document_path?: string | null
          id?: string
          member_id: string
          organization_id: string
          status?: string
          subscription_id?: string | null
          terms_version?: string
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: unknown
          created_at?: string
          document_path?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          status?: string
          subscription_id?: string | null
          terms_version?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_contracts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_contracts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_workouts: {
        Row: {
          assigned_by: string | null
          created_at: string
          ends_on: string | null
          id: string
          member_id: string
          organization_id: string
          starts_on: string
          status: string
          updated_at: string
          workout_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          member_id: string
          organization_id: string
          starts_on?: string
          status?: string
          updated_at?: string
          workout_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_workouts_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_workouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: Json
          birth_date: string | null
          branch_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          emergency_contact: Json
          full_name: string
          goal: string | null
          id: string
          inactive_at: string | null
          joined_at: string
          medical_notes: string | null
          organization_id: string
          phone: string | null
          source_lead_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: Json
          birth_date?: string | null
          branch_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: Json
          full_name: string
          goal?: string | null
          id?: string
          inactive_at?: string | null
          joined_at?: string
          medical_notes?: string | null
          organization_id: string
          phone?: string | null
          source_lead_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          birth_date?: string | null
          branch_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: Json
          full_name?: string
          goal?: string | null
          id?: string
          inactive_at?: string | null
          joined_at?: string
          medical_notes?: string | null
          organization_id?: string
          phone?: string | null
          source_lead_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: true
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          access_limit_per_week: number | null
          active: boolean
          benefits: Json
          billing_cycle: string
          created_at: string
          description: string | null
          enrollment_fee_cents: number
          id: string
          name: string
          organization_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          access_limit_per_week?: number | null
          active?: boolean
          benefits?: Json
          billing_cycle?: string
          created_at?: string
          description?: string | null
          enrollment_fee_cents?: number
          id?: string
          name: string
          organization_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          access_limit_per_week?: number | null
          active?: boolean
          benefits?: Json
          billing_cycle?: string
          created_at?: string
          description?: string | null
          enrollment_fee_cents?: number
          id?: string
          name?: string
          organization_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          membership_id: string
          role_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          membership_id: string
          role_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          membership_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          organization_id: string
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id: string
          profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id?: string
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          branding: Json
          created_at: string
          features: Json
          lgpd: Json
          locale: string
          organization_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          features?: Json
          lgpd?: Json
          locale?: string
          organization_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          features?: Json
          lgpd?: Json
          locale?: string
          organization_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          legal_name: string | null
          metadata: Json
          name: string
          phone: string | null
          saas_plan: string
          slug: string
          status: string
          tax_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          name: string
          phone?: string | null
          saas_plan?: string
          slug: string
          status?: string
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          name?: string
          phone?: string | null
          saas_plan?: string
          slug?: string
          status?: string
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          organization_id: string
          paid_at: string
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          organization_id: string
          paid_at?: string
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          organization_id?: string
          paid_at?: string
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      physical_assessments: {
        Row: {
          assessed_at: string
          assessor_profile_id: string | null
          body_fat_percent: number | null
          created_at: string
          height_cm: number | null
          id: string
          measurements: Json
          member_id: string
          notes: string | null
          organization_id: string
          weight_kg: number | null
        }
        Insert: {
          assessed_at?: string
          assessor_profile_id?: string | null
          body_fat_percent?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          measurements?: Json
          member_id: string
          notes?: string | null
          organization_id: string
          weight_kg?: number | null
        }
        Update: {
          assessed_at?: string
          assessor_profile_id?: string | null
          body_fat_percent?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          measurements?: Json
          member_id?: string
          notes?: string | null
          organization_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_assessor_profile_id_fkey"
            columns: ["assessor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          metadata: Json
          phone: string | null
          platform_role: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          metadata?: Json
          phone?: string | null
          platform_role?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          metadata?: Json
          phone?: string | null
          platform_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      retention_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_at: string | null
          id: string
          lead_id: string | null
          member_id: string | null
          notes: string | null
          organization_id: string
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id: string
          priority?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          notes?: string | null
          organization_id?: string
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          branch_id: string | null
          created_at: string
          discount_cents: number
          ends_on: string | null
          id: string
          member_id: string
          next_billing_on: string | null
          organization_id: string
          plan_id: string
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          branch_id?: string | null
          created_at?: string
          discount_cents?: number
          ends_on?: string | null
          id?: string
          member_id: string
          next_billing_on?: string | null
          organization_id: string
          plan_id: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          branch_id?: string | null
          created_at?: string
          discount_cents?: number
          ends_on?: string | null
          id?: string
          member_id?: string
          next_billing_on?: string | null
          organization_id?: string
          plan_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_items: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          load_guidance: string | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sequence: number
          sets: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          load_guidance?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sequence?: number
          sets?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          load_guidance?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sequence?: number
          sets?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          active: boolean
          created_at: string
          goal: string | null
          id: string
          level: string | null
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      capture_public_lead: {
        Args: {
          p_email?: string
          p_full_name: string
          p_interest?: string
          p_phone?: string
          p_slug: string
        }
        Returns: string
      }
      convert_lead_to_member: {
        Args: { p_branch_id?: string; p_lead_id: string; p_plan_id?: string }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          p_branch_name: string
          p_city?: string
          p_legal_name?: string
          p_name: string
          p_slug: string
          p_state?: string
          p_tax_id?: string
        }
        Returns: string
      }
      generate_due_invoices: {
        Args: { p_organization_id: string }
        Returns: number
      }
      get_public_gym_site: { Args: { p_slug: string }; Returns: Json }
      refresh_retention_tasks: {
        Args: { p_organization_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
