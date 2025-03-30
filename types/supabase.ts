export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          description: string
          points: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          description: string
          points: number
          timestamp: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          description?: string
          points?: number
          timestamp?: string
        }
      }
      discord_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          channel: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          channel: string
          points: number
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          channel?: string
          points?: number
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          time: string
          location: string
          points: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          date: string
          time: string
          location: string
          points: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          date?: string
          time?: string
          location?: string
          points?: number
        }
      }
      event_participation: {
        Row: {
          id: string
          event_id: string
          user_id: string
          joined_at: string
          points_awarded: boolean
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          joined_at?: string
          points_awarded?: boolean
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          joined_at?: string
          points_awarded?: boolean
        }
      }
      github_contributions: {
        Row: {
          id: string
          user_id: string
          title: string
          url: string
          repo_name: string
          type: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          url: string
          repo_name: string
          type: string
          points: number
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          url?: string
          repo_name?: string
          type?: string
          points?: number
          created_at?: string
        }
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          event_id: string
          checked_in_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          checked_in_at: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          checked_in_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string
          created_at?: string
        }
      }
    }
  }
}

