export type HebrewTimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface ParsedHebrewTime {
  time?: string;
  timeOfDay?: HebrewTimeOfDay;
  matchedText?: string;
}

export interface TimeRange {
  startsAt: string;
  endsAt: string;
}

const normalizeMessage = (message: string): string =>
  message.trim().replace(/\s+/g, " ");

const padTimePart = (value: number): string => String(value).padStart(2, "0");

const formatTime = (hours: number, minutes = 0): string =>
  `${padTimePart(hours)}:${padTimePart(minutes)}`;

const isValidTime = (hours: number, minutes: number): boolean =>
  hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;

const getTimeOfDayFromText = (message: string): ParsedHebrewTime | null => {
  const timeOfDayMatches: Array<{
    pattern: RegExp;
    timeOfDay: HebrewTimeOfDay;
  }> = [
    { pattern: /אחר\s+הצהריים/, timeOfDay: "afternoon" },
    { pattern: /בצהריים|צהריים/, timeOfDay: "afternoon" },
    { pattern: /בבוקר|בוקר/, timeOfDay: "morning" },
    { pattern: /בערב|ערב/, timeOfDay: "evening" },
    { pattern: /בלילה|לילה/, timeOfDay: "night" },
  ];

  for (const option of timeOfDayMatches) {
    const match = message.match(option.pattern);

    if (match) {
      return {
        timeOfDay: option.timeOfDay,
        matchedText: match[0],
      };
    }
  }

  return null;
};

const applyTimeOfDayToHour = (
  hour: number,
  timeOfDay?: HebrewTimeOfDay
): number => {
  if (timeOfDay === "morning") {
    return hour === 12 ? 0 : hour;
  }

  if (timeOfDay === "afternoon" || timeOfDay === "evening") {
    return hour >= 1 && hour <= 11 ? hour + 12 : hour;
  }

  if (timeOfDay === "night") {
    return hour >= 1 && hour <= 5 ? hour + 12 : hour;
  }

  return hour;
};

const parseExplicitClockTime = (message: string): ParsedHebrewTime | null => {
  const match = message.match(/(?:^|[^\d])(\d{1,2}):(\d{2})(?:[^\d]|$)/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!isValidTime(hours, minutes)) {
    return null;
  }

  return {
    time: formatTime(hours, minutes),
    matchedText: match[0].trim(),
  };
};

const parseHourWithTimeOfDay = (message: string): ParsedHebrewTime | null => {
  const match = message.match(
    /(?:^|[^\d])(\d{1,2})(?:\s+)(בבוקר|בוקר|בצהריים|צהריים|אחר\s+הצהריים|בערב|ערב|בלילה|לילה)(?:[^\d]|$)/
  );

  if (!match) {
    return null;
  }

  const dayPart = getTimeOfDayFromText(match[2]);

  if (!dayPart?.timeOfDay) {
    return null;
  }

  const parsedHour = applyTimeOfDayToHour(Number(match[1]), dayPart.timeOfDay);

  if (!isValidTime(parsedHour, 0)) {
    return null;
  }

  return {
    time: formatTime(parsedHour),
    timeOfDay: dayPart.timeOfDay,
    matchedText: match[0].trim(),
  };
};

const parsePrefixedHour = (message: string): ParsedHebrewTime | null => {
  const match = message.match(/(?:בשעה|שעה|ב[-־])\s*(\d{1,2})(?:[^\d]|$)/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);

  if (!isValidTime(hours, 0)) {
    return null;
  }

  return {
    time: formatTime(hours),
    matchedText: match[0].trim(),
  };
};

export const getTimeRangeFromTimeOfDay = (
  timeOfDay?: HebrewTimeOfDay
): TimeRange | undefined => {
  if (timeOfDay === "morning") {
    return { startsAt: "08:00", endsAt: "12:00" };
  }

  if (timeOfDay === "afternoon") {
    return { startsAt: "12:00", endsAt: "17:00" };
  }

  if (timeOfDay === "evening") {
    return { startsAt: "17:00", endsAt: "22:00" };
  }

  if (timeOfDay === "night") {
    return { startsAt: "22:00", endsAt: "24:00" };
  }

  return undefined;
};

export const parseHebrewTime = (message: string): ParsedHebrewTime => {
  const normalizedMessage = normalizeMessage(message);
  const parsedTime =
    parseExplicitClockTime(normalizedMessage) ??
    parseHourWithTimeOfDay(normalizedMessage) ??
    parsePrefixedHour(normalizedMessage);
  const parsedTimeOfDay = getTimeOfDayFromText(normalizedMessage);

  if (parsedTime) {
    return {
      ...parsedTime,
      timeOfDay: parsedTime.timeOfDay ?? parsedTimeOfDay?.timeOfDay,
      matchedText: parsedTime.matchedText ?? parsedTimeOfDay?.matchedText,
    };
  }

  return parsedTimeOfDay ?? {};
};
