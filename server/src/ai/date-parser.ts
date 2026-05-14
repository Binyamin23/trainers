export interface ParsedHebrewDate {
  date?: string;
  dateReference?: string;
  matchedText?: string;
}

const weekdayMap: Record<string, number> = {
  "ראשון": 0,
  "שני": 1,
  "שלישי": 2,
  "רביעי": 3,
  "חמישי": 4,
  "שישי": 5,
  "שבת": 6,
};

const padDatePart = (value: number): string => String(value).padStart(2, "0");

const normalizeMessage = (message: string): string =>
  message.trim().replace(/\s+/g, " ");

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date => {
  const nextDate = startOfDay(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate()
  )}`;

const isValidDayMonth = (day: number, month: number, year: number): boolean => {
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
};

const parseDayMonthDate = (
  message: string,
  baseDate: Date
): ParsedHebrewDate | null => {
  const match = message.match(/(?:^|[^\d])(\d{1,2})[/.](\d{1,2})(?:[^\d]|$)/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const currentYear = baseDate.getFullYear();

  if (!isValidDayMonth(day, month, currentYear)) {
    return null;
  }

  let parsedDate = startOfDay(new Date(currentYear, month - 1, day));

  if (parsedDate < startOfDay(baseDate)) {
    parsedDate = startOfDay(new Date(currentYear + 1, month - 1, day));
  }

  return {
    date: formatDate(parsedDate),
    dateReference: "explicit_date",
    matchedText: match[0].trim(),
  };
};

const parseWeekdayDate = (
  message: string,
  baseDate: Date
): ParsedHebrewDate | null => {
  const match = message.match(
    /ביום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?:\s+(הבא))?/
  );

  if (!match) {
    return null;
  }

  const targetDay = weekdayMap[match[1]];
  let daysToAdd = targetDay - startOfDay(baseDate).getDay();

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  if (match[2]) {
    daysToAdd += 7;
  }

  return {
    date: formatDate(addDays(baseDate, daysToAdd)),
    dateReference: match[2] ? `following_${match[1]}` : `next_${match[1]}`,
    matchedText: match[0],
  };
};

const parseRelativeDate = (
  message: string,
  baseDate: Date
): ParsedHebrewDate | null => {
  if (message.includes("מחרתיים")) {
    return {
      date: formatDate(addDays(baseDate, 2)),
      dateReference: "day_after_tomorrow",
      matchedText: "מחרתיים",
    };
  }

  if (message.includes("מחר")) {
    return {
      date: formatDate(addDays(baseDate, 1)),
      dateReference: "tomorrow",
      matchedText: "מחר",
    };
  }

  if (message.includes("היום")) {
    return {
      date: formatDate(addDays(baseDate, 0)),
      dateReference: "today",
      matchedText: "היום",
    };
  }

  const twoWeeksMatch = message.match(/(?:עוד|בעוד)\s+שבועיים/);

  if (twoWeeksMatch) {
    return {
      date: formatDate(addDays(baseDate, 14)),
      dateReference: "in_14_days",
      matchedText: twoWeeksMatch[0],
    };
  }

  const oneWeekMatch = message.match(/(?:עוד|בעוד)\s+שבוע/);

  if (oneWeekMatch) {
    return {
      date: formatDate(addDays(baseDate, 7)),
      dateReference: "in_7_days",
      matchedText: oneWeekMatch[0],
    };
  }

  const daysMatch = message.match(/(?:עוד|בעוד)\s+(\d{1,3})\s+ימים/);

  if (daysMatch) {
    const daysToAdd = Number(daysMatch[1]);

    return {
      date: formatDate(addDays(baseDate, daysToAdd)),
      dateReference: `in_${daysToAdd}_days`,
      matchedText: daysMatch[0],
    };
  }

  return null;
};

export const parseHebrewDate = (
  message: string,
  baseDate = new Date()
): ParsedHebrewDate => {
  const normalizedMessage = normalizeMessage(message);

  return (
    parseRelativeDate(normalizedMessage, baseDate) ??
    parseWeekdayDate(normalizedMessage, baseDate) ??
    parseDayMonthDate(normalizedMessage, baseDate) ??
    {}
  );
};
