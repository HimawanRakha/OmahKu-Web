// ─── ENUM Types (sesuai skema database) ───────────────────────────────────

export type UserRole = "user" | "agent" | "admin";

export type ListingType = "sale" | "rent";

export type RentPeriod = "day" | "month" | "year";

export type PropertyStatus =
  | "available"
  | "booked"
  | "sold"
  | "rented"
  | "inactive";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "expired";

export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "success"
  | "failed";

export type TransactionType = "sale" | "rent";

export type CertificateType = "SHM" | "HGB" | "SHGB" | "Girik" | "Lainnya";

// ─── Table Row Types ────────────────────────────────────────────────────────

export interface User {
  id: number;
  full_name: string;
  nik: string;
  username: string;
  email: string;
  phone_number: string;
  password_hash: string;
  role: UserRole;
  profile_photo_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface AgentProfile {
  id: number;
  user_id: number;
  agency_name: string;
  license_number: string;
  bio: string | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PropertyCategory {
  id: number;
  name: string;
  created_at: Date;
}

export interface Location {
  id: number;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  created_at: Date;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  listing_type: ListingType;
  price: number;
  rent_period: RentPeriod | null;
  category_id: number;
  location_id: number;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  land_area: number;
  building_area: number;
  year_built: number | null;
  certificate_type: CertificateType;
  facing_direction: string;
  agent_id: number;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: Date;
}

export interface Facility {
  id: number;
  name: string;
  icon: string;
  is_countable: boolean;
  created_at: Date;
}

export interface PropertyFacility {
  id: number;
  property_id: number;
  facility_id: number;
  quantity: number | null;
  notes: string | null;
}

export interface Review {
  id: number;
  property_id: number;
  user_id: number;
  transaction_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PriceHistory {
  id: number;
  property_id: number;
  old_price: number;
  new_price: number;
  changed_by: number;
  created_at: Date;
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
  user_id: number;
  status: BookingStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: number;
  property_id: number;
  booking_id: number;
  user_id: number;
  agent_id: number;
  transaction_type: TransactionType;
  status: TransactionStatus;
  agreed_amount: number;
  created_at: Date;
  updated_at: Date;
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

// ─── Joined / View Types (untuk query kompleks) ─────────────────────────────

export interface PropertyWithDetails extends Property {
  category_name: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  avg_rating: number | null;
  review_count: number;
  primary_image_url: string | null;
  agent_name: string;
  agent_photo_url: string | null;
  agent_verified: boolean;
  agency_name: string;
  license_number: string;
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
  building_area: number;
  district: string;
  city: string;
  avg_rating: number | null;
  review_count: number;
  primary_image_url: string | null;
  agent_name: string;
  agent_photo_url: string | null;
  agent_verified: boolean;
  is_wishlisted?: boolean;
}

export interface AgentCardData {
  id: number;
  full_name: string;
  profile_photo_url: string | null;
  agency_name: string;
  license_number: string;
  verified_at: Date | null;
  active_property_count: number;
  avg_rating: number | null;
}

export interface AgentProfileWithStats {
  id: number;
  full_name: string;
  profile_photo_url: string | null;
  agency_name: string;
  license_number: string;
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
  facility_icon: string;
  is_countable: boolean;
}

export interface PriceHistoryWithUser extends PriceHistory {
  changed_by_name: string;
}

// ─── Analytics Types (Q1, Q1b, Q2) ────────────────────────────────────────

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
  rent_period?: RentPeriod;
}

export interface PropertyFormStep2 {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  land_area: number;
  building_area: number;
  year_built: number | null;
  certificate_type: CertificateType;
  facing_direction: string;
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
  nik: string;
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
  identifier: string;
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
  facing_direction?: string;
  min_rating?: number;
  floors?: number;
  year_built_min?: number;
  year_built_max?: number;
  search?: string;
}

export type PropertySortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "most_reviewed";
