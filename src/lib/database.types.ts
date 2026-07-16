/**
 * Typy schematu bazy Supabase — projekt BEAUTY (dhuvykwecsxgchzxufxw).
 * Katalog współdzieli bazę z aplikacją rezerwacyjną i korzysta z jej tabel:
 *   salons · services · gallery_assets · profiles
 * oraz z własnej, dodanej tabeli job_listings.
 * Można zregenerować przez `supabase gen types typescript`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Statusy z tabeli salons (BEAUTY) */
export type SalonStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'archived';
export type JobStatus = 'active' | 'draft' | 'closed';
export type JobType = 'hiring' | 'looking';
export type Employment = 'uop' | 'b2b' | 'zlecenie' | 'dowolna';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Database {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          status: SalonStatus;
          plan: string;
          short_description: string | null;
          description: string | null;
          email: string | null;
          phone: string | null;
          phone_secondary: string | null;
          city: string | null;
          address_line: string | null;
          postal_code: string | null;
          country_code: string;
          latitude: number | null;
          longitude: number | null;
          cover_image_url: string | null;
          logo_url: string | null;
          website_url: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          nip: string | null;
          regon: string | null;
          voivodeship: string | null;
          opening_hours: Json | null;
          booking_enabled: boolean;
          source: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          slug: string;
          status?: SalonStatus;
          plan?: string;
          short_description?: string | null;
          description?: string | null;
          email?: string | null;
          phone?: string | null;
          phone_secondary?: string | null;
          city?: string | null;
          address_line?: string | null;
          postal_code?: string | null;
          country_code?: string;
          latitude?: number | null;
          longitude?: number | null;
          cover_image_url?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          nip?: string | null;
          regon?: string | null;
          voivodeship?: string | null;
          opening_hours?: Json | null;
          booking_enabled?: boolean;
          source?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['salons']['Insert']>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          category_id: number | null;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          duration_min: number | null;
          price_from: number | null;
          price_to: number | null;
          currency_code: string;
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          category_id?: number | null;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          duration_min?: number | null;
          price_from?: number | null;
          price_to?: number | null;
          currency_code?: string;
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [];
      };
      gallery_assets: {
        Row: {
          id: string;
          salon_id: string;
          asset_type: string;
          storage_provider: string;
          file_path: string | null;
          public_url: string | null;
          alt_text: string | null;
          title: string | null;
          sort_order: number;
          is_cover: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          asset_type?: string;
          storage_provider?: string;
          file_path?: string | null;
          public_url?: string | null;
          alt_text?: string | null;
          title?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gallery_assets']['Insert']>;
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
          payment_status: PaymentStatus;
          price_pln: number | null;
          paid_at: string | null;
          expires_at: string | null;
          published_at: string | null;
          created_at: string;
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
          payment_status?: PaymentStatus;
          price_pln?: number | null;
          paid_at?: string | null;
          expires_at?: string | null;
          published_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['job_listings']['Insert']>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          salon_id: string;
          user_id: string | null;
          name: string;
          role_label: string | null;
          bio: string | null;
          photo_url: string | null;
          calendar_color: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          user_id?: string | null;
          name: string;
          role_label?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          calendar_color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          salon_id: string;
          author_name: string;
          rating: number;
          content: string | null;
          source: string;
          status: string;
          is_featured: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          author_name: string;
          rating: number;
          content?: string | null;
          source?: string;
          status?: string;
          is_featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_categories']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          account_type: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          account_type?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      trainings: {
        Row: {
          id: string;
          slug: string | null;
          title: string;
          category: string | null;
          description: string | null;
          format: string;
          city: string | null;
          event_date: string | null;
          price_pln: number;
          seats_total: number | null;
          seats_taken: number;
          cover_url: string | null;
          is_certified: boolean;
          status: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          title: string;
          category?: string | null;
          description?: string | null;
          format?: string;
          city?: string | null;
          event_date?: string | null;
          price_pln?: number;
          seats_total?: number | null;
          seats_taken?: number;
          cover_url?: string | null;
          is_certified?: boolean;
          status?: string;
          source?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trainings']['Insert']>;
        Relationships: [];
      };
      training_enrollments: {
        Row: {
          id: string;
          training_id: string;
          user_id: string | null;
          buyer_name: string | null;
          buyer_email: string | null;
          payment_method: string;
          payment_status: string;
          amount_pln: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          user_id?: string | null;
          buyer_name?: string | null;
          buyer_email?: string | null;
          payment_method?: string;
          payment_status?: string;
          amount_pln?: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['training_enrollments']['Insert']>;
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
export type Service = Database['public']['Tables']['services']['Row'];
export type GalleryAsset = Database['public']['Tables']['gallery_assets']['Row'];
export type JobListing = Database['public']['Tables']['job_listings']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Staff = Database['public']['Tables']['staff']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];
export type Training = Database['public']['Tables']['trainings']['Row'];
export type TrainingEnrollment = Database['public']['Tables']['training_enrollments']['Row'];

/** Salon z dołączonymi relacjami (jak w zapytaniach z `select(...)`) */
export type SalonWithRelations = Salon & {
  services?: Service[];
  gallery_assets?: GalleryAsset[];
};

/** Specjalista (staff) z salonem macierzystym — karta specjalisty (§8) */
export type SpecialistWithSalon = Pick<
  Staff,
  'id' | 'name' | 'role_label' | 'photo_url' | 'salon_id'
> & {
  salon: Pick<Salon, 'id' | 'name' | 'slug' | 'city'> | null;
};
