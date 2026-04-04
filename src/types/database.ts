export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'member' | 'producer' | 'referent' | 'treasurer' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type UnitType = 'unit' | 'weight' | 'volume' | 'bundle';
export type ContractNature = 'subscription' | 'flexible';
export type ContractStatus = 'draft' | 'open' | 'active' | 'closed' | 'archived';
export type SubscriptionStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'received' | 'deposited' | 'late' | 'cancelled';
export type PaymentMethod = 'check' | 'transfer' | 'cash' | 'card';
export type ShiftStatus = 'confirmed' | 'cancelled' | 'absent';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Producer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_bio: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  image_url: string | null;
  logo_url: string | null;
  website: string | null;
  status: UserStatus;
  stock_enabled: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  producer_id: string;
  name: string;
  description: string | null;
  unit_type: UnitType;
  packaging: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ContractModel {
  id: string;
  producer_id: string;
  name: string;
  description: string | null;
  nature: ContractNature;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  enroll_start: string | null;
  enroll_end: string | null;
  payment_strategy: string | null;
  joker_config: Json;
  stock_config: Json;
  created_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  model_id: string;
  status: SubscriptionStatus;
  total_amount: number | null;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  due_date: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  reference: string | null;
  received_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; first_name: string; last_name: string; email: string };
        Update: Partial<Profile>;
      };
      producers: {
        Row: Producer;
        Insert: Partial<Producer> & { name: string; slug: string };
        Update: Partial<Producer>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { producer_id: string; name: string };
        Update: Partial<Product>;
      };
      contract_models: {
        Row: ContractModel;
        Insert: Partial<ContractModel> & { producer_id: string; name: string; nature: ContractNature; start_date: string; end_date: string };
        Update: Partial<ContractModel>;
      };
      contracts: {
        Row: Contract;
        Insert: Partial<Contract> & { user_id: string; model_id: string };
        Update: Partial<Contract>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { contract_id: string; amount: number; due_date: string };
        Update: Partial<Payment>;
      };
      posts: {
        Row: Post;
        Insert: Partial<Post> & { title: string; slug: string };
        Update: Partial<Post>;
      };
    };
  };
}
