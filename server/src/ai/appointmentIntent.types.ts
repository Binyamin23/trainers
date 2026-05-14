export type AppointmentIntent =
  | "CREATE_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "UPDATE_APPOINTMENT"
  | "CHECK_AVAILABILITY"
  | "UNKNOWN";

export interface AppointmentIntentParseResult {
  intent: AppointmentIntent;
  customerName: string | null;
  phone: string | null;
  startsAt: string | null;
  endsAt: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  notes: string | null;
  confidence: number;
  missingFields: string[];
}
