import https from "https";
import {
  AppointmentIntent,
  AppointmentIntentParseResult,
} from "./appointmentIntent.types";

const OPENAI_RESPONSES_PATH = "/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const intentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: [
        "CREATE_APPOINTMENT",
        "CANCEL_APPOINTMENT",
        "UPDATE_APPOINTMENT",
        "CHECK_AVAILABILITY",
        "UNKNOWN",
      ],
    },
    customerName: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    startsAt: { type: ["string", "null"] },
    endsAt: { type: ["string", "null"] },
    requestedDate: { type: ["string", "null"] },
    requestedTime: { type: ["string", "null"] },
    notes: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    missingFields: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "intent",
    "customerName",
    "phone",
    "startsAt",
    "endsAt",
    "requestedDate",
    "requestedTime",
    "notes",
    "confidence",
    "missingFields",
  ],
};

const instructions = `You parse appointment-management messages into JSON.
Supported intents:
- CREATE_APPOINTMENT: user wants to book a new appointment.
- CANCEL_APPOINTMENT: user wants to cancel an appointment.
- UPDATE_APPOINTMENT: user wants to move or edit an appointment.
- CHECK_AVAILABILITY: user asks what times or dates are available.
- UNKNOWN: message is unrelated or too ambiguous.

Rules:
- Return every field required by the schema.
- Use null for customerName, phone, startsAt, endsAt, requestedDate, requestedTime, or notes when unknown.
- Use ISO 8601 strings for startsAt and endsAt when a complete date and time are clear.
- Use requestedDate for date-only requests.
- Use requestedTime for time-only requests.
- Do not invent customerName or phone.
- If the appointment duration is not stated, return endsAt as null and include "endsAt" in missingFields for CREATE_APPOINTMENT.
- For CREATE_APPOINTMENT, missingFields should include any missing customerName, phone, startsAt, or endsAt.
- For CANCEL_APPOINTMENT and UPDATE_APPOINTMENT, include missingFields needed to identify the appointment when absent.
- For CHECK_AVAILABILITY, include requestedDate in missingFields if no date or relative date is provided.
- Confidence must be between 0 and 1.`;

const supportedIntents: AppointmentIntent[] = [
  "CREATE_APPOINTMENT",
  "CANCEL_APPOINTMENT",
  "UPDATE_APPOINTMENT",
  "CHECK_AVAILABILITY",
  "UNKNOWN",
];

const nullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const getOutputText = (responseBody: any): string | null => {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  for (const outputItem of responseBody.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
};

const postJsonToOpenAI = (body: Record<string, unknown>): Promise<any> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.openai.com",
        path: OPENAI_RESPONSES_PATH,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          let parsed: any = {};

          try {
            parsed = data ? JSON.parse(data) : {};
          } catch {
            return reject(new Error("OpenAI API returned invalid JSON"));
          }

          if (!response.statusCode || response.statusCode >= 400) {
            return reject(
              new Error(parsed.error?.message || "OpenAI API request failed")
            );
          }

          return resolve(parsed);
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
};

const normalizeIntentResult = (value: any): AppointmentIntentParseResult => ({
  intent: supportedIntents.includes(value.intent) ? value.intent : "UNKNOWN",
  customerName: nullableString(value.customerName),
  phone: nullableString(value.phone),
  startsAt: nullableString(value.startsAt),
  endsAt: nullableString(value.endsAt),
  requestedDate: nullableString(value.requestedDate),
  requestedTime: nullableString(value.requestedTime),
  notes: nullableString(value.notes),
  confidence:
    typeof value.confidence === "number"
      ? Math.min(Math.max(value.confidence, 0), 1)
      : 0,
  missingFields: Array.isArray(value.missingFields)
    ? value.missingFields.filter((field: unknown) => typeof field === "string")
    : [],
});

export const appointmentIntentService = {
  async parseMessage(message: string): Promise<AppointmentIntentParseResult> {
    if (!message.trim()) {
      return {
        intent: "UNKNOWN",
        customerName: null,
        phone: null,
        startsAt: null,
        endsAt: null,
        requestedDate: null,
        requestedTime: null,
        notes: null,
        confidence: 0,
        missingFields: ["message"],
      };
    }

    const now = new Date();
    const timeZone =
      process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await postJsonToOpenAI({
      model: DEFAULT_MODEL,
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                message,
                currentDateTime: now.toISOString(),
                timeZone,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "appointment_intent",
          schema: intentSchema,
        },
      },
    });

    const outputText = getOutputText(response);

    if (!outputText) {
      throw new Error("OpenAI response did not include parsed intent JSON");
    }

    return normalizeIntentResult(JSON.parse(outputText));
  },
};
