import {
  AiChatDateReference,
  AiChatIntent,
  AiChatIntentType,
  AiChatRequest,
  AiChatResponse,
  AiChatTimeOfDay,
} from "./ai.types";
import {
  clearConversationState,
  CancellationOption,
  ConversationState,
  getConversationState,
  updateConversationState,
} from "./conversation-state";
import { parseHebrewDate } from "./date-parser";
import { getTimeRangeFromTimeOfDay, parseHebrewTime } from "./time-parser";
import { availabilityService } from "../services/availability.service";
import { appointmentsService } from "../services/appointments.service";
import { traineesService } from "../services/trainees.service";
import { trainersService } from "../services/trainers.service";

const availabilityKeywords = ["תור", "פנוי", "פנויה", "זמין", "זמינות"];
const bookingKeywords = ["לקבוע", "קבע", "להזמין", "לשריין", "רוצה תור"];
const cancellationKeywords = ["לבטל", "בטל", "ביטול", "לא יכול להגיע"];
const normalizeMessage = (message: string): string =>
  message.trim().replace(/\s+/g, " ").toLowerCase();

const collectMatches = (message: string, keywords: string[]): string[] =>
  keywords.filter((keyword) => message.includes(keyword));

const getIntentType = (
  availabilityMatches: string[],
  bookingMatches: string[],
  cancellationMatches: string[],
  dateReference: AiChatDateReference,
  timeOfDay: AiChatTimeOfDay
): AiChatIntentType => {
  if (cancellationMatches.length > 0) {
    return "CANCEL_APPOINTMENT";
  }

  if (bookingMatches.length > 0) {
    return "BOOK_APPOINTMENT";
  }

  if (
    availabilityMatches.length > 0 ||
    dateReference !== null ||
    timeOfDay !== null
  ) {
    return "CHECK_AVAILABILITY";
  }

  return "UNKNOWN";
};

const getConfidence = (
  intent: AiChatIntentType,
  matchedKeywords: string[]
): number => {
  if (intent === "UNKNOWN") {
    return 0.2;
  }

  return Math.min(0.95, 0.55 + matchedKeywords.length * 0.1);
};

const buildReply = (intent: AiChatIntent): string => {
  if (intent.intent === "CHECK_AVAILABILITY") {
    return "בשמחה, אבדוק אילו תורים פנויים עבורך.";
  }

  if (intent.intent === "BOOK_APPOINTMENT") {
    return "בשמחה, אפשר להתקדם לקביעת תור.";
  }

  if (intent.intent === "CANCEL_APPOINTMENT") {
    return "הבנתי, אפשר לעזור בביטול התור.";
  }

  return "לא הבנתי לגמרי את הבקשה. אפשר לכתוב אם ברצונך לבדוק זמינות, לקבוע תור או לבטל תור.";
};

const isTimeOnlyFollowUp = (intent: AiChatIntent): boolean =>
  Boolean(
    intent.time &&
      !intent.date &&
      intent.matchedKeywords.length === (intent.matchedTimeText ? 1 : 0)
  );

const mergeIntentWithState = (
  intent: AiChatIntent,
  state?: ConversationState
): AiChatIntent => {
  if (!state) {
    return intent;
  }

  return {
    ...intent,
    date: intent.date ?? state.lastDate ?? null,
    time: intent.time ?? state.lastTime ?? null,
  };
};

const applyFollowUpIntent = (
  intent: AiChatIntent,
  state?: ConversationState
): AiChatIntent => {
  if (
    state?.lastIntent === "CANCEL_APPOINTMENT" &&
    state.lastCancellationOptions?.length &&
    (intent.date || intent.time || getMessageIndex(intent.originalMessage))
  ) {
    return {
      ...intent,
      intent: "CANCEL_APPOINTMENT",
      confidence: Math.max(intent.confidence, 0.85),
    };
  }

  if (
    state?.lastIntent === "CHECK_AVAILABILITY" &&
    state.lastDate &&
    isTimeOnlyFollowUp(intent)
  ) {
    return {
      ...intent,
      intent: "BOOK_APPOINTMENT",
      confidence: Math.max(intent.confidence, 0.85),
      date: state.lastDate,
    };
  }

  return intent;
};

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const createDateTime = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60000);

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const getMessageIndex = (message: string): number | null => {
  const match = message.trim().match(/^\d+$/);

  if (!match) {
    return null;
  }

  return Number(match[0]);
};

const filterSlotsByTimeRange = (
  availableSlots: string[],
  startsAt: string,
  endsAt: string
): string[] => {
  const startMinutes = toMinutes(startsAt);
  const endMinutes = toMinutes(endsAt);

  return availableSlots.filter((slot) => {
    const slotMinutes = toMinutes(slot);

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
};

interface ResolvedTrainer {
  trainerId: string | null;
  needsTrainerChoice: boolean;
}

const resolveTrainer = async (
  trainerId?: string,
  phone?: string | null
): Promise<ResolvedTrainer> => {
  if (trainerId) {
    return { trainerId, needsTrainerChoice: false };
  }

  if (phone) {
    const trainee = await traineesService.getTraineeByPhone(phone);

    if (trainee) {
      return {
        trainerId: trainee.trainerId,
        needsTrainerChoice: trainee.trainerId === null,
      };
    }
  }

  // TODO: Ask the customer to choose a trainer instead of falling back.
  const trainers = await trainersService.listTrainers();

  return {
    trainerId: trainers[0]?.id ?? null,
    needsTrainerChoice: false,
  };
};

const buildAvailabilityReply = (
  intent: AiChatIntent,
  allAvailableSlots: string[],
  availableSlots: string[]
): string => {
  if (!intent.date) {
    return "לאיזה תאריך תרצה לבדוק זמינות?";
  }

  if (intent.time) {
    if (allAvailableSlots.includes(intent.time)) {
      return `כן, יש תור פנוי בתאריך ${intent.date} בשעה ${intent.time}. רוצה שאקבע לך?`;
    }

    if (allAvailableSlots.length > 0) {
      return `השעה ${intent.time} לא פנויה, אבל יש תורים פנויים ב: ${allAvailableSlots.join(
        ", "
      )}`;
    }

    return `לא מצאתי תורים פנויים בתאריך ${intent.date}.`;
  }

  if (availableSlots.length > 0) {
    return `יש תורים פנויים בתאריך ${intent.date}: ${availableSlots.join(
      ", "
    )}`;
  }

  return `לא מצאתי תורים פנויים בתאריך ${intent.date}.`;
};

const handleAvailabilityIntent = async (
  input: AiChatRequest,
  intent: AiChatIntent,
  state?: ConversationState
): Promise<AiChatResponse> => {
  if (!intent.date) {
    return {
      data: {
        ...intent,
        trainerId: input.trainerId ?? state?.lastTrainerId ?? null,
        availableSlots: [],
      },
      reply: buildAvailabilityReply(intent, [], []),
    };
  }

  const resolvedTrainer = await resolveTrainer(
    input.trainerId ?? state?.lastTrainerId ?? undefined,
    intent.phone
  );
  const trainerId = resolvedTrainer.trainerId;

  if (resolvedTrainer.needsTrainerChoice) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לאיזה מאמן תרצה לקבוע את התור?",
    };
  }

  if (!trainerId) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לא מצאתי מאמן זמין לבדוק מולו תורים.",
    };
  }

  const availability = await availabilityService.getAvailableSlots(
    trainerId,
    intent.date
  );
  let availableSlots = availability.availableSlots;

  if (intent.time) {
    availableSlots = availability.availableSlots.includes(intent.time)
      ? [intent.time]
      : availability.availableSlots;
  } else if (intent.timeRange) {
    availableSlots = filterSlotsByTimeRange(
      availability.availableSlots,
      intent.timeRange.startsAt,
      intent.timeRange.endsAt
    );
  }

  if (intent.phone) {
    updateConversationState(intent.phone, {
      lastIntent: intent.intent,
      lastDate: intent.date,
      lastTime: intent.time,
      lastTrainerId: trainerId,
      lastAvailableSlots: availableSlots,
    });
  }

  return {
    data: {
      ...intent,
      trainerId,
      availableSlots,
    },
    reply: buildAvailabilityReply(
      intent,
      availability.availableSlots,
      availableSlots
    ),
  };
};

const buildBookingMissingDataResponse = (
  intent: AiChatIntent,
  reply: string,
  trainerId: string | null
): AiChatResponse => ({
  data: {
    ...intent,
    trainerId,
    availableSlots: [],
  },
  reply,
});

const handleBookingIntent = async (
  input: AiChatRequest,
  intent: AiChatIntent,
  state?: ConversationState
): Promise<AiChatResponse> => {
  const contextualTrainerId = input.trainerId ?? state?.lastTrainerId ?? null;

  if (!intent.date) {
    return buildBookingMissingDataResponse(
      intent,
      "לאיזה תאריך תרצה לקבוע את התור?",
      contextualTrainerId
    );
  }

  if (!intent.time) {
    return buildBookingMissingDataResponse(
      intent,
      "באיזו שעה תרצה לקבוע את התור?",
      contextualTrainerId
    );
  }

  if (!intent.phone) {
    return buildBookingMissingDataResponse(
      intent,
      "אני צריך מספר טלפון כדי לקבוע את התור.",
      contextualTrainerId
    );
  }

  const trainee = await traineesService.getTraineeByPhone(intent.phone);

  if (!trainee) {
    return buildBookingMissingDataResponse(
      intent,
      "מה השם שלך כדי שאוכל לפתוח לך כרטיס מתאמן?",
      contextualTrainerId
    );
  }

  const resolvedTrainer = await resolveTrainer(
    input.trainerId ?? state?.lastTrainerId ?? undefined,
    intent.phone
  );
  const trainerId = resolvedTrainer.trainerId;

  if (resolvedTrainer.needsTrainerChoice) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לאיזה מאמן תרצה לקבוע את התור?",
    };
  }

  if (!trainerId) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לא מצאתי מאמן זמין לקביעת התור.",
    };
  }

  const availability = await availabilityService.getAvailableSlots(
    trainerId,
    intent.date
  );

  if (!availability.availableSlots.includes(intent.time)) {
    return {
      data: {
        ...intent,
        trainerId,
        availableSlots: availability.availableSlots,
      },
      reply:
        availability.availableSlots.length > 0
          ? `השעה ${intent.time} לא פנויה, אבל יש תורים פנויים ב: ${availability.availableSlots.join(
              ", "
            )}`
          : `לא מצאתי תורים פנויים בתאריך ${intent.date}.`,
    };
  }

  const startsAt = createDateTime(intent.date, intent.time);
  const appointment = await appointmentsService.createAppointment({
    traineeId: trainee.id,
    trainerId,
    startsAt,
    endsAt: addMinutes(startsAt, 30),
    notes: `Created from AI chat: ${intent.originalMessage}`,
  });

  clearConversationState(intent.phone);

  return {
    data: {
      ...intent,
      trainerId,
      appointment,
      availableSlots: [intent.time],
    },
    reply: `מעולה, קבעתי לך תור בתאריך ${intent.date} בשעה ${intent.time}.`,
  };
};

const toCancellationOption = (
  appointment: CancellationOption
): CancellationOption => ({
  id: appointment.id,
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
});

const formatCancellationOptions = (
  appointments: CancellationOption[]
): string =>
  appointments
    .map(
      (appointment, index) =>
        `${index + 1}. ${formatDate(appointment.startsAt)} בשעה ${formatTime(
          appointment.startsAt
        )}`
    )
    .join(", ");

const findCancellationMatch = (
  intent: AiChatIntent,
  appointments: CancellationOption[]
): CancellationOption | null => {
  const requestedIndex = getMessageIndex(intent.originalMessage);

  if (
    requestedIndex !== null &&
    requestedIndex >= 1 &&
    requestedIndex <= appointments.length
  ) {
    return appointments[requestedIndex - 1];
  }

  const matches = appointments.filter((appointment) => {
    const dateMatches = intent.date
      ? formatDate(appointment.startsAt) === intent.date
      : true;
    const timeMatches = intent.time
      ? formatTime(appointment.startsAt) === intent.time
      : true;

    if (!intent.date && !intent.time) {
      return false;
    }

    return dateMatches && timeMatches;
  });

  return matches.length === 1 ? matches[0] : null;
};

const cancelAppointmentFromChat = async (
  intent: AiChatIntent,
  appointment: CancellationOption
): Promise<AiChatResponse> => {
  const cancelledAppointment = await appointmentsService.cancelAppointment(
    appointment.id
  );

  if (!cancelledAppointment) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לא מצאתי תור פעיל על המספר הזה.",
    };
  }

  if (intent.phone) {
    clearConversationState(intent.phone);
  }

  return {
    data: {
      ...intent,
      trainerId: cancelledAppointment.trainerId,
      appointment: cancelledAppointment,
      availableSlots: [],
    },
    reply: `ביטלתי לך את התור בתאריך ${formatDate(
      cancelledAppointment.startsAt
    )} בשעה ${formatTime(cancelledAppointment.startsAt)}.`,
  };
};

const buildMultipleCancellationOptionsResponse = (
  intent: AiChatIntent,
  appointments: CancellationOption[]
): AiChatResponse => {
  if (intent.phone) {
    updateConversationState(intent.phone, {
      lastIntent: "CANCEL_APPOINTMENT",
      lastCancellationOptions: appointments.map(toCancellationOption),
    });
  }

  return {
    data: {
      ...intent,
      trainerId: null,
      availableSlots: [],
    },
    reply: `מצאתי כמה תורים פעילים. איזה מהם תרצה לבטל? ${formatCancellationOptions(
      appointments
    )}`,
  };
};

const handleCancellationIntent = async (
  intent: AiChatIntent,
  state?: ConversationState
): Promise<AiChatResponse> => {
  if (!intent.phone) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "אני צריך מספר טלפון כדי למצוא את התור שלך.",
    };
  }

  if (state?.lastIntent === "CANCEL_APPOINTMENT") {
    const stateMatch = findCancellationMatch(
      intent,
      state.lastCancellationOptions ?? []
    );

    if (stateMatch) {
      return cancelAppointmentFromChat(intent, stateMatch);
    }
  }

  const appointments = await appointmentsService.getActiveAppointmentsByPhone(
    intent.phone
  );

  if (appointments.length === 0) {
    return {
      data: {
        ...intent,
        trainerId: null,
        availableSlots: [],
      },
      reply: "לא מצאתי תור פעיל על המספר הזה.",
    };
  }

  if (appointments.length === 1) {
    return cancelAppointmentFromChat(intent, appointments[0]);
  }

  const matchedAppointment = findCancellationMatch(intent, appointments);

  if (matchedAppointment) {
    return cancelAppointmentFromChat(intent, matchedAppointment);
  }

  return buildMultipleCancellationOptionsResponse(intent, appointments);
};

const parseMessage = (input: AiChatRequest): AiChatIntent => {
  const normalizedMessage = normalizeMessage(input.message);
  const availabilityMatches = collectMatches(
    normalizedMessage,
    availabilityKeywords
  );
  const bookingMatches = collectMatches(normalizedMessage, bookingKeywords);
  const cancellationMatches = collectMatches(
    normalizedMessage,
    cancellationKeywords
  );
  const parsedDate = parseHebrewDate(normalizedMessage);
  const dateReference = parsedDate.dateReference ?? null;
  const parsedTime = parseHebrewTime(normalizedMessage);
  const timeOfDay = parsedTime.timeOfDay ?? null;
  const matchedKeywords = [
    ...availabilityMatches,
    ...bookingMatches,
    ...cancellationMatches,
    ...(parsedDate.matchedText ? [parsedDate.matchedText] : []),
    ...(parsedTime.matchedText ? [parsedTime.matchedText] : []),
  ];
  const intent = getIntentType(
    availabilityMatches,
    bookingMatches,
    cancellationMatches,
    dateReference,
    timeOfDay
  );

  return {
    intent,
    confidence: getConfidence(intent, matchedKeywords),
    originalMessage: input.message,
    phone:
      typeof input.phone === "string" && input.phone.trim().length > 0
        ? input.phone.trim()
        : null,
    date: parsedDate.date ?? null,
    dateReference,
    matchedDateText: parsedDate.matchedText ?? null,
    time: parsedTime.time ?? null,
    timeOfDay,
    timeRange: getTimeRangeFromTimeOfDay(timeOfDay ?? undefined) ?? null,
    matchedTimeText: parsedTime.matchedText ?? null,
    matchedKeywords,
  };
};

export const aiService = {
  async chat(input: AiChatRequest): Promise<AiChatResponse> {
    const parsedIntent = parseMessage(input);
    const state = parsedIntent.phone
      ? getConversationState(parsedIntent.phone)
      : undefined;
    const followUpIntent = applyFollowUpIntent(parsedIntent, state);
    const intent = mergeIntentWithState(followUpIntent, state);

    if (intent.intent === "CHECK_AVAILABILITY") {
      return handleAvailabilityIntent(input, intent, state);
    }

    if (intent.intent === "BOOK_APPOINTMENT") {
      return handleBookingIntent(input, intent, state);
    }

    if (intent.intent === "CANCEL_APPOINTMENT") {
      return handleCancellationIntent(intent, state);
    }

    return {
      data: {
        ...intent,
        trainerId: input.trainerId ?? state?.lastTrainerId ?? null,
        availableSlots: [],
      },
      reply: buildReply(intent),
    };
  },
};
