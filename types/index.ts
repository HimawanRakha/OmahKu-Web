// ─── ENUM Types (sesuai skema database PERSIS) ──────────────────────────────

export type UserRole = "user" | "agent" | "admin";
export type ListingType = "sale" | "rent";
export type RentPeriod = "day" | "month" | "year";
export type PropertyStatus = "available" | "booked" | "sold" | "rented" | "inactive";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

// FIX: TransactionStatus sesuai schema ENUM('pending','success','failed','cancelled')
// Sebelumnya ada 'confirmed' dan 'expired' yang salah — itu milik BookingStatus
export type TransactionStatus = "pending" | "success" | "failed" | "cancelled";

export type TransactionType = "sale" | "rent";
export type CertificateType = "SHM" | "HGB" | "SHGB" | "Girik" | "Lainnya";
export type FacingDirection = "utara" | "timur" | "selatan" | "barat" | "timur_laut" | "tenggara" | "barat_daya" | "barat_laut";

// ─── Table Row Types (nama kolom PERSIS sesuai schema) ──────────────────────

export interface User {
  id: number;
  NIK: string; // uppercase sesuai schema: NIK CHAR(16)
  username: string;
  full_name: string;
  email: string;
  phone_number: string;
  password: string; // FIX: 'password' bukan 'password_hash'
  role: UserRole;
  // TIDAK ADA profile_photo_url di schema
  created_at: Date;
  deleted_at: Date | null;
}

export interface AgentProfile {
  id: number;
  user_id: number;
  agency_name: string | null;
  license_number: string | null;
  bio: string | null;
  verified_at: Date | null;
  created_at: Date;
  // TIDAK ADA updated_at di schema agent_profile
  deleted_at: Date | null;
}

export interface PropertyCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface Location {
  id: number;
  province: string;
  city: string;
  district: string;
  postal_code: string | null;
  // TIDAK ADA created_at di schema location
}

export interface Property {
  id: number;
  owner_id: number;
  agent_id: number | null;
  category_id: number;
  location_id: number;
  title: string;
  description: string | null;
  address_detail: string;
  land_area: number | null;
  building_area: number | null;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  year_built: number | null;
  certificate_type: CertificateType | null;
  facing_direction: FacingDirection | null;
  listing_type: ListingType;
  price: number;
  rent_period: RentPeriod | null;
  status: PropertyStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
  deleted_at: Date | null;
}

export interface Facility {
  id: number;
  name: string;
  is_countable: boolean;
  icon: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface PropertyFacility {
  property_id: number;
  facility_id: number;
  quantity: number;
  notes: string | null;
  // TIDAK ADA id di schema — PK adalah (property_id, facility_id)
}

export interface Review {
  id: number;
  transaction_id: number;
  property_id: number;
  reviewer_id: number; // FIX: 'reviewer_id' bukan 'user_id'
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PriceHistory {
  id: number;
  property_id: number;
  old_price: number | null;
  new_price: number;
  changed_by: number | null; // nullable — bisa NULL jika diubah sistem
  changed_at: Date; // FIX: 'changed_at' bukan 'created_at'
  // TIDAK ADA deleted_at — price_history bersifat immutable
}

export interface Wishlist {
  id: number;
  user_id: number;
  property_id: number;
  created_at: Date;
  deleted_at: Date | null;
}

export interface Booking {
  id: number;
  property_id: number;
  customer_id: number; // FIX: 'customer_id' bukan 'user_id'
  requested_start_date: Date | null;
  requested_end_date: Date | null;
  status: BookingStatus;
  notes: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface Transaction {
  id: number;
  booking_id: number;
  property_id: number;
  customer_id: number; // FIX: 'customer_id' bukan 'user_id'
  agent_id: number | null;
  transaction_type: TransactionType;
  agreed_amount: number;
  status: TransactionStatus;
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface RentTransaction {
  transaction_id: number;
  start_date: Date;
  end_date: Date;
  price_per_period: number;
  additional_fee: number;
}

export interface SaleTransaction {
  transaction_id: number;
  transfer_date: Date | null;
  certificate_number: string | null;
}

// ─── Joined / View Types ────────────────────────────────────────────────────

export interface PropertyWithDetails extends Property {
  category_name: string;
  province: string;
  city: string;
  district: string;
  postal_code: string | null;
  avg_rating: number | null;
  review_count: number;
  primary_image_url: string | null;
  agent_name: string;
  agent_photo_url: null; // selalu null — tidak ada di schema
  agent_verified: boolean;
  agency_name: string | null;
  license_number: string | null;
}

export interface PropertyCardData {
  id: number;
  title: string;
  price: number;
  listing_type: ListingType;
  rent_period: RentPeriod | null;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  building_area: number | null;
  district: string;
  city: string;
  avg_rating: number | null;
  review_count: number;
  primary_image_url: string | null;
  agent_name: string;
  agent_photo_url: null;
  agent_verified: boolean;
  is_wishlisted?: boolean;
}

export interface AgentCardData {
  id: number;
  full_name: string;
  agent_photo_url: null;
  agency_name: string | null;
  license_number: string | null;
  verified_at: Date | null;
  active_property_count: number;
  avg_rating: number | null;
}

export interface AgentProfileWithStats {
  id: number;
  full_name: string;
  agent_photo_url: null;
  agency_name: string | null;
  license_number: string | null;
  bio: string | null;
  verified_at: Date | null;
  created_at: Date;
  total_transactions: number;
  total_revenue: number | null;
  avg_rating: number | null;
  active_property_count: number;
}

export interface TransactionWithDetails extends Transaction {
  property_title: string;
  property_image_url: string | null;
  has_review: boolean;
  rent_start_date?: Date;
  rent_end_date?: Date;
  rent_price_per_period?: number;
  rent_additional_fee?: number;
  sale_transfer_date?: Date | null;
  sale_certificate_number?: string | null;
}

export interface ReviewWithUser extends Review {
  reviewer_name: string;
}

export interface FacilityWithDetails extends PropertyFacility {
  facility_name: string;
  facility_icon: string | null;
  is_countable: boolean;
}

export interface PriceHistoryWithUser extends PriceHistory {
  changed_by_name: string | null; // null jika changed_by IS NULL
  property_title?: string;
}

// ─── Analytics Types (Q1, Q1b, Q2, Q3, Q4) ────────────────────────────────

export interface AgentRevenueSummary {
  total_revenue: number;
  total_transactions: number;
  avg_transaction_value: number;
}

export interface MonthlyRevenue {
  revenue_year: number;
  revenue_month: number;
  total_revenue: number;
}

export interface PropertyRatingRank {
  property_id: number;
  property_title: string;
  avg_rating: number;
  review_count: number;
}

// ─── Form / Input Types ─────────────────────────────────────────────────────

export interface PropertyFormStep1 {
  title: string;
  description: string;
  listing_type: ListingType;
  price: number;
  rent_period?: RentPeriod; // wajib jika listing_type='rent' (validasi trigger)
}

export interface PropertyFormStep2 {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  land_area: number | null;
  building_area: number | null;
  year_built: number | null;
  certificate_type: CertificateType | null;
  facing_direction: FacingDirection | null;
  address_detail: string;
  facilities: Array<{
    facility_id: number;
    quantity?: number;
    notes?: string;
  }>;
}

export interface PropertyFormStep3 {
  location_id: number;
}

export interface PropertyFormStep4 {
  images: Array<{
    image_url: string;
    sort_order: number;
    is_primary: boolean;
  }>;
}

export interface RegisterUserInput {
  full_name: string;
  NIK: string; // 16 digit
  username: string;
  email: string;
  phone_number: string;
  password: string;
  role: "user" | "agent";
  agency_name?: string;
  license_number?: string;
  bio?: string;
}

export interface LoginInput {
  identifier: string; // email atau username
  password: string;
}

// ─── Filter / Sort Types ────────────────────────────────────────────────────

export interface PropertyFilters {
  listing_type?: ListingType;
  category_id?: number;
  price_min?: number;
  price_max?: number;
  rent_period?: RentPeriod;
  province?: string;
  city?: string;
  district?: string;
  building_area_min?: number;
  building_area_max?: number;
  land_area_min?: number;
  land_area_max?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  status?: PropertyStatus[];
  certificate_type?: CertificateType;
  facing_direction?: FacingDirection;
  min_rating?: number;
  floors?: number;
  year_built_min?: number;
  year_built_max?: number;
  search?: string;
}

export type PropertySortOption = "newest" | "price_asc" | "price_desc" | "rating_desc" | "most_reviewed";
