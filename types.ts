
export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY';

export enum BlockType {
  TEXT = 'TEXT',
  TODO = 'TODO',
  LINK = 'LINK',
  IMAGE = 'IMAGE',
  LOCATION = 'LOCATION',
  EXPENSE = 'EXPENSE',
  TRANSPORT = 'TRANSPORT'
}

export type TransportMode = 'WALK' | 'BUS' | 'TRAIN' | 'TAXI' | 'FLIGHT';
export type BookingStatus = 'NONE' | 'BOOKED' | 'PENDING' | 'CANCELED';
export type ExpenseCategory = 'FLIGHT' | 'ACCOMMODATION' | 'FOOD' | 'TRANSPORT' | 'SHOPPING' | 'TOUR' | 'OTHER';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; 
  checked?: boolean; 
  meta?: any; 
  // Expense meta: { amount: number, currency: Currency, category: ExpenseCategory, isPaid: boolean }
  // Transport meta: { mode: TransportMode, color: string, duration: string }
  // Location meta: { status: BookingStatus, lat?: number, lng?: number, time?: string }
  children?: ContentBlock[]; 
}

export interface DayPlan {
  id: string;
  date: string;
  location: string;
  blocks: ContentBlock[];
}

export type PlaceCategory = 'RESTAURANT' | 'CAFE' | 'GELATO' | 'BAR' | 'ATTRACTION' | 'ACCOMMODATION' | 'TRANSPORT';

export interface SavedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  description: string;
  imageUrl: string;
  lat?: number; 
  lng?: number;
  isSaved: boolean;
  bookingStatus?: BookingStatus;
  googleMapLink?: string;
  region?: string; // New: User defined region tag (e.g., "Rome", "Dolomites")
}

export type ScrapPlatform = 'BLOG' | 'INSTAGRAM' | 'YOUTUBE' | 'OTHER';

export interface Scrap {
  id: string;
  title: string;
  url: string;
  platform: ScrapPlatform;
  note: string;
}

export interface ManualExpense {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  isPaid: boolean;
  date?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface TravelDoc {
  id: string;
  type: 'IMAGE' | 'PDF' | 'QR';
  name: string;
  url: string; // In a real app this would be a blob url or storage url
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  budget: number;
  currency: Currency;
  members: string[]; 
  savedPlaces: SavedPlace[];
  scraps: Scrap[];
  
  // New Fields
  manualExpenses: ManualExpense[];
  checklists: ChecklistGroup[];
  documents: TravelDoc[];
}

export type ViewMode = 'SCHEDULE' | 'SAVED' | 'TOOLS' | 'MAP';
