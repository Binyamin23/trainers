import { AppointmentIntentParseResult } from "./appointmentIntent.types";

interface AppointmentConversationReply {
  reply: string;
  completedIntent: AppointmentIntentParseResult;
}

const DEFAULT_DURATION_MINUTES = 30;

const timezoneOffsetPattern = /([+-])(\d{2}):(\d{2})$/;

const padDatePart = (value: number, length = 2): string =>
  String(value).padStart(length, "0");

const formatWithTimezoneOffset = (date: Date, offset: string): string => {
  const match = offset.match(timezoneOffsetPattern);

  if (!match) {
    return date.toISOString();
  }

  const direction = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  const offsetMs = direction * (hours * 60 + minutes) * 60000;
  const localDate = new Date(date.getTime() + offsetMs);

  return `${localDate.getUTCFullYear()}-${padDatePart(
    localDate.getUTCMonth() + 1
  )}-${padDatePart(localDate.getUTCDate())}T${padDatePart(
    localDate.getUTCHours()
  )}:${padDatePart(localDate.getUTCMinutes())}:${padDatePart(
    localDate.getUTCSeconds()
  )}${offset}`;
};

const formatEndTime = (startsAtValue: string, endsAt: Date): string => {
  const timezoneOffset = startsAtValue.match(timezoneOffsetPattern)?.[0];

  if (timezoneOffset) {
    return formatWithTimezoneOffset(endsAt, timezoneOffset);
  }

  return endsAt.toISOString();
};

const addDefaultEndTime = (
  parsedIntent: AppointmentIntentParseResult
): AppointmentIntentParseResult => {
  if (parsedIntent.endsAt || !parsedIntent.startsAt) {
    return parsedIntent;
  }

  const startsAt = new Date(parsedIntent.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return parsedIntent;
  }

  const endsAt = new Date(startsAt.getTime() + DEFAULT_DURATION_MINUTES * 60000);
  const endsAtValue = formatEndTime(parsedIntent.startsAt, endsAt);
  const formattedEndsAt = new Date(endsAtValue);

  if (
    Number.isNaN(formattedEndsAt.getTime()) ||
    formattedEndsAt.getTime() <= startsAt.getTime()
  ) {
    return parsedIntent;
  }

  return {
    ...parsedIntent,
    endsAt: endsAtValue,
    missingFields: parsedIntent.missingFields.filter(
      (field) => field !== "endsAt"
    ),
  };
};

export const buildAppointmentReply = (
  parsedIntent: AppointmentIntentParseResult
): AppointmentConversationReply => {
  const completedIntent = addDefaultEndTime(parsedIntent);

  if (
    completedIntent.intent === "CREATE_APPOINTMENT" &&
    !completedIntent.customerName
  ) {
    return {
      reply: "על איזה שם לקבוע את התור?",
      completedIntent,
    };
  }

  if (!completedIntent.phone) {
    return {
      reply: "מה מספר הטלפון שלך?",
      completedIntent,
    };
  }

  return {
    reply: "מעולה, אני בודק זמינות לתור הזה.",
    completedIntent,
  };
};
