export type AiChatIntentType =
  | "CHECK_AVAILABILITY"
  | "BOOK_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "UNKNOWN";

export type AiChatTimeOfDay =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | null;
export type AiChatDateReference = string | null;

export interface AiChatTimeRange {
  startsAt: string;
  endsAt: string;
}

export interface AiChatRequest {
  message: string;
  phone?: string;
  customerName?: string;
  trainerId?: string;
}

export interface AiChatIntent {
  intent: AiChatIntentType;
  confidence: number;
  originalMessage: string;
  phone: string | null;
  date: string | null;
  dateReference: AiChatDateReference;
  matchedDateText: string | null;
  time: string | null;
  timeOfDay: AiChatTimeOfDay;
  timeRange: AiChatTimeRange | null;
  matchedTimeText: string | null;
  matchedKeywords: string[];
}

export interface AiChatResponse {
  data: AiChatIntent & {
    trainerId: string | null;
    appointment?: unknown;
    availableSlots: string[];
  };
  reply: string;
}
