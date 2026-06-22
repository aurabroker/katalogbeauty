/**
 * Typy schematu bazy Supabase (ręcznie utrzymywane na podstawie schematu projektu).
 * Można je w przyszłości zregenerować przez `supabase gen types typescript`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SalonStatus = 'active' | 'draft' | 'paused';
export type JobStatus = 'active' | 'draft' | 'closed';
export type JobType = 'hiring' | 'looking';
export type Employment = 'uop' | 'b2b' | 'zlecenie' | 'dowolna';
export type JobPaymentStatus = 'unpaid' | 'paid';

export interface Database {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string | null;
          tagline: string | null;
          description: string | null;
          city: string;
          street: string | null;
          postal_code: string | null;
          voivodeship: string | null;
          phone: string | null;
          email_contact: string | null;
          website: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          nip: string | null;
          regon: string | null;
          opening_hours: Json | null;
          status: SalonStatus;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug?: string | null;
          tagline?: string | null;
          description?: string | null;
          city: string;
          street?: string | null;
          postal_code?: string | null;
          voivodeship?: string | null;
          phone?: string | null;
          email_contact?: string | null;
          website?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          nip?: string | null;
          regon?: string | null;
          opening_hours?: Json | null;
          status?: SalonStatus;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['salons']['Insert']>;
        Relationships: [];
      };
      salon_services: {
        Row: {
          id: string;
          salon_id: string;
          service_name: string;
          price_from: number | null;
          price_to: number | null;
          duration_min: number | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          service_name: string;
          price_from?: number | null;
          price_to?: number | null;
          duration_min?: number | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['salon_services']['Insert']>;
        Relationships: [];
      };
      salon_photos: {
        Row: {
          id: string;
          salon_id: string;
          url: string;
          storage_path: string | null;
          is_cover: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          url: string;
          storage_path?: string | null;
          is_cover?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['salon_photos']['Insert']>;
        Relationships: [];
      };
      job_listings: {
        Row: {
          id: string;
          owner_id: string;
          type: JobType;
          title: string;
          city: string;
          voivodeship: string | null;
          description: string | null;
          salary_from: number | null;
          salary_to: number | null;
          employment: Employment | null;
          phone: string | null;
          email: string | null;
          status: JobStatus;
          payment_status: JobPaymentStatus;
          paid_at: string | null;
          price_pln: number | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type: JobType;
          title: string;
          city: string;
          voivodeship?: string | null;
          description?: string | null;
          salary_from?: number | null;
          salary_to?: number | null;
          employment?: Employment | null;
          phone?: string | null;
          email?: string | null;
          status?: JobStatus;
          payment_status?: JobPaymentStatus;
          paid_at?: string | null;
          price_pln?: number | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['job_listings']['Insert']>;
        Relationships: [];
      };
      katalog_profiles: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['katalog_profiles']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_katalog_admin: { Args: Record<string, never>; Returns: boolean };
      katalog_admin_stats: { Args: Record<string, never>; Returns: Json };
      katalog_admin_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          created_at: string;
          salons_count: number;
          jobs_count: number;
          is_admin: boolean;
        }[];
      };
      katalog_set_admin: { Args: { target: string; make_admin: boolean }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

/** Wygodne aliasy wierszy tabel */
export type Salon = Database['public']['Tables']['salons']['Row'];
export type SalonService = Database['public']['Tables']['salon_services']['Row'];
export type SalonPhoto = Database['public']['Tables']['salon_photos']['Row'];
export type JobListing = Database['public']['Tables']['job_listings']['Row'];

/** Salon z dołączonymi relacjami (jak w zapytaniach z `select(...)`) */
export type SalonWithRelations = Salon & {
  salon_services?: SalonService[];
  salon_photos?: SalonPhoto[];
};
