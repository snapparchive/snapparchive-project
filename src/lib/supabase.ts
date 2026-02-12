import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          company_name: string | null;
          company_size: string | null;
          use_case: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          company_name?: string | null;
          company_size?: string | null;
          use_case?: string | null;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          company_name?: string | null;
          company_size?: string | null;
          use_case?: string | null;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          title: string;
          file_name: string;
          file_url: string;
          file_size: number;
          file_type: string;
          thumbnail_url: string | null;
          ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
          ocr_text: string | null;
          is_public: boolean;
          public_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          title: string;
          file_name: string;
          file_url: string;
          file_size: number;
          file_type: string;
          thumbnail_url?: string | null;
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';
          ocr_text?: string | null;
          is_public?: boolean;
          public_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          title?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number;
          file_type?: string;
          thumbnail_url?: string | null;
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';
          ocr_text?: string | null;
          is_public?: boolean;
          public_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_tags: {
        Row: {
          id: string;
          document_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: 'trial' | 'basic' | 'pro' | 'enterprise';
          status: 'active' | 'cancelled' | 'expired';
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          cancelled_at: string | null;
          amount_paid: number | null;
          auto_renew: boolean | null;
          last_payment_at: string | null;
          payment_failed_at: string | null;
          payment_failure_reason: string | null;
          auto_renew_off_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: 'trial' | 'basic' | 'pro' | 'enterprise';
          status?: 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          amount_paid?: number | null;
          auto_renew?: boolean | null;
          last_payment_at?: string | null;
          payment_failed_at?: string | null;
          payment_failure_reason?: string | null;
          auto_renew_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: 'trial' | 'basic' | 'pro' | 'enterprise';
          status?: 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          amount_paid?: number | null;
          auto_renew?: boolean | null;
          last_payment_at?: string | null;
          payment_failed_at?: string | null;
          payment_failure_reason?: string | null;
          auto_renew_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
