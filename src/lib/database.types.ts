export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          role: 'student' | 'employer' | 'tpo' | 'admin'
          full_name: string | null
          profile_completed: boolean
          password: string
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          role: 'student' | 'employer' | 'tpo' | 'admin'
          full_name?: string | null
          profile_completed?: boolean
          password: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          role?: 'student' | 'employer' | 'tpo' | 'admin'
          full_name?: string | null
          profile_completed?: boolean
          password: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_profiles: {
        Row: {
          id: string
          user_id: string
          college: string | null
          degree: string | null
          graduation_year: number | null
          skills: string[] | null
          resume_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          college?: string | null
          degree?: string | null
          graduation_year?: number | null
          skills?: string[] | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          college?: string | null
          degree?: string | null
          graduation_year?: number | null
          skills?: string[] | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employer_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          industry: string | null
          company_size: string | null
          logo_url: string | null
          description: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          industry?: string | null
          company_size?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          industry?: string | null
          company_size?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_listings: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          type: 'job' | 'internship'
          location: string
          remote: boolean
          skills_required: string[]
          salary_min: number | null
          salary_max: number | null
          application_deadline: string
          created_at: string
          updated_at: string
          status: 'draft' | 'published' | 'closed'
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          description: string
          type: 'job' | 'internship'
          location: string
          remote: boolean
          skills_required: string[]
          salary_min?: number | null
          salary_max?: number | null
          application_deadline: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published' | 'closed'
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string
          type?: 'job' | 'internship'
          location?: string
          remote?: boolean
          skills_required?: string[]
          salary_min?: number | null
          salary_max?: number | null
          application_deadline?: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published' | 'closed'
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          student_id: string
          resume_url: string
          cover_letter: string | null
          video_url: string | null
          status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          student_id: string
          resume_url: string
          cover_letter?: string | null
          video_url?: string | null
          status?: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          student_id?: string
          resume_url?: string
          cover_letter?: string | null
          video_url?: string | null
          status?: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
