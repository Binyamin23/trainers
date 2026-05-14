import swaggerJSDoc from "swagger-jsdoc";

const uuidSchema = {
  type: "string",
  format: "uuid",
  example: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
};

const dateTimeSchema = {
  type: "string",
  format: "date-time",
  example: "2026-05-15T18:00:00+03:00",
};

const dataResponse = (schema: Record<string, unknown>) => ({
  type: "object",
  properties: {
    data: schema,
  },
});

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Queue API",
      version: "1.0.0",
      description:
        "API documentation for appointments, trainers, trainer working hours, and availability.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    tags: [
      { name: "AI Chat" },
      { name: "Appointments" },
      { name: "Availability" },
      { name: "Trainers" },
      { name: "Trainer Working Hours" },
    ],
    components: {
      schemas: {
        Appointment: {
          type: "object",
          properties: {
            id: uuidSchema,
            traineeId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            trainee: {
              type: "object",
              nullable: true,
              properties: {
                id: uuidSchema,
                name: { type: "string", example: "Yossi Cohen" },
                phone: { type: "string", example: "0501234567" },
              },
            },
            customerName: { type: "string", example: "Yossi Cohen" },
            phone: { type: "string", example: "0501234567" },
            trainerId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            startsAt: dateTimeSchema,
            endsAt: {
              ...dateTimeSchema,
              example: "2026-05-15T18:30:00+03:00",
            },
            status: {
              type: "string",
              enum: ["scheduled", "cancelled", "completed"],
              example: "scheduled",
            },
            notes: {
              type: "string",
              nullable: true,
              example: "First session",
            },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema,
          },
        },
        CreateAppointmentInput: {
          type: "object",
          required: ["traineeId", "startsAt", "endsAt"],
          properties: {
            traineeId: uuidSchema,
            trainerId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            startsAt: dateTimeSchema,
            endsAt: {
              ...dateTimeSchema,
              example: "2026-05-15T18:30:00+03:00",
            },
            notes: {
              type: "string",
              nullable: true,
              example: "First session",
            },
          },
        },
        UpdateAppointmentInput: {
          type: "object",
          properties: {
            traineeId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            trainerId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            startsAt: dateTimeSchema,
            endsAt: {
              ...dateTimeSchema,
              example: "2026-05-15T18:30:00+03:00",
            },
            status: {
              type: "string",
              enum: ["scheduled", "cancelled", "completed"],
              example: "scheduled",
            },
            notes: {
              type: "string",
              nullable: true,
              example: "Updated notes",
            },
          },
        },
        Trainer: {
          type: "object",
          properties: {
            id: uuidSchema,
            name: { type: "string", example: "Dana Levi" },
            phone: {
              type: "string",
              nullable: true,
              example: "0507654321",
            },
            email: {
              type: "string",
              nullable: true,
              format: "email",
              example: "dana@example.com",
            },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema,
          },
        },
        CreateTrainerInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Dana Levi" },
            phone: {
              type: "string",
              nullable: true,
              example: "0507654321",
            },
            email: {
              type: "string",
              nullable: true,
              format: "email",
              example: "dana@example.com",
            },
          },
        },
        TrainerWorkingHours: {
          type: "object",
          properties: {
            id: uuidSchema,
            trainerId: uuidSchema,
            dayOfWeek: {
              type: "integer",
              minimum: 0,
              maximum: 6,
              example: 1,
              description: "0 Sunday, 1 Monday, ... 6 Saturday",
            },
            startTime: {
              type: "string",
              pattern: "^\\d{2}:\\d{2}$",
              example: "09:00",
            },
            endTime: {
              type: "string",
              pattern: "^\\d{2}:\\d{2}$",
              example: "18:00",
            },
            isActive: { type: "boolean", example: true },
            createdAt: dateTimeSchema,
            updatedAt: dateTimeSchema,
          },
        },
        UpdateTrainerWorkingHoursInput: {
          type: "object",
          required: ["workingHours"],
          properties: {
            workingHours: {
              type: "array",
              items: {
                type: "object",
                required: ["dayOfWeek", "startTime", "endTime"],
                properties: {
                  dayOfWeek: {
                    type: "integer",
                    minimum: 0,
                    maximum: 6,
                    example: 0,
                  },
                  startTime: {
                    type: "string",
                    pattern: "^\\d{2}:\\d{2}$",
                    example: "09:00",
                  },
                  endTime: {
                    type: "string",
                    pattern: "^\\d{2}:\\d{2}$",
                    example: "18:00",
                  },
                  isActive: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        AvailabilitySlot: {
          type: "string",
          pattern: "^\\d{2}:\\d{2}$",
          example: "09:00",
        },
        AvailabilityResponse: {
          type: "object",
          properties: {
            date: {
              type: "string",
              format: "date",
              example: "2026-05-15",
            },
            availableSlots: {
              type: "array",
              items: { $ref: "#/components/schemas/AvailabilitySlot" },
              example: ["09:00", "09:30", "11:00"],
            },
          },
        },
        AiChatRequest: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              example: "יש תור פנוי מחר בערב?",
            },
            phone: {
              type: "string",
              nullable: true,
              example: "0501234567",
            },
            customerName: {
              type: "string",
              nullable: true,
              example: "Yossi Cohen",
            },
            trainerId: {
              allOf: [uuidSchema],
              nullable: true,
            },
          },
        },
        AiChatIntent: {
          type: "object",
          properties: {
            intent: {
              type: "string",
              enum: [
                "CHECK_AVAILABILITY",
                "BOOK_APPOINTMENT",
                "CANCEL_APPOINTMENT",
                "UNKNOWN",
              ],
              example: "CHECK_AVAILABILITY",
            },
            confidence: { type: "number", example: 0.95 },
            originalMessage: {
              type: "string",
              example: "יש תור פנוי מחר בערב?",
            },
            phone: {
              type: "string",
              nullable: true,
              example: "0501234567",
            },
            date: {
              type: "string",
              nullable: true,
              format: "date",
              example: "2026-05-15",
            },
            dateReference: {
              type: "string",
              nullable: true,
              example: "tomorrow",
            },
            matchedDateText: {
              type: "string",
              nullable: true,
              example: "מחר",
            },
            time: {
              type: "string",
              nullable: true,
              example: "18:00",
            },
            timeOfDay: {
              type: "string",
              nullable: true,
              enum: ["morning", "afternoon", "evening", "night"],
              example: "evening",
            },
            timeRange: {
              type: "object",
              nullable: true,
              properties: {
                startsAt: { type: "string", example: "17:00" },
                endsAt: { type: "string", example: "22:00" },
              },
            },
            matchedTimeText: {
              type: "string",
              nullable: true,
              example: "בערב",
            },
            matchedKeywords: {
              type: "array",
              items: { type: "string" },
              example: ["תור", "פנוי", "מחר", "בערב"],
            },
            trainerId: {
              allOf: [uuidSchema],
              nullable: true,
            },
            appointment: {
              nullable: true,
              allOf: [{ $ref: "#/components/schemas/Appointment" }],
            },
            availableSlots: {
              type: "array",
              items: { $ref: "#/components/schemas/AvailabilitySlot" },
              example: ["17:00", "18:00"],
            },
          },
        },
        AiChatResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/AiChatIntent" },
            reply: {
              type: "string",
              example: "יש תורים פנויים בתאריך 2026-05-15: 17:00, 18:00",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Unexpected error",
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
      parameters: {
        AppointmentId: {
          name: "id",
          in: "path",
          required: true,
          schema: uuidSchema,
        },
        TrainerId: {
          name: "trainerId",
          in: "path",
          required: true,
          schema: uuidSchema,
        },
      },
    },
    paths: {
      "/ai/chat": {
        post: {
          tags: ["AI Chat"],
          summary: "Chat with the appointment AI",
          description:
            "Rule-based Hebrew chat endpoint for checking availability, booking appointments, and cancelling appointments. Conversation state is kept in memory by phone number.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiChatRequest" },
                examples: {
                  availabilityCheck: {
                    summary: "Availability check",
                    value: {
                      message: "יש תור פנוי מחר בערב?",
                      phone: "0501234567",
                    },
                  },
                  booking: {
                    summary: "Book appointment",
                    value: {
                      message: "אני רוצה לקבוע תור מחר ב-18",
                      phone: "0501234567",
                      customerName: "Yossi Cohen",
                      trainerId: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                    },
                  },
                  cancellation: {
                    summary: "Cancel appointment",
                    value: {
                      message: "אני רוצה לבטל את התור שלי",
                      phone: "0501234567",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "AI chat response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AiChatResponse" },
                  examples: {
                    availabilityCheck: {
                      summary: "Availability response",
                      value: {
                        data: {
                          intent: "CHECK_AVAILABILITY",
                          confidence: 0.95,
                          originalMessage: "יש תור פנוי מחר בערב?",
                          phone: "0501234567",
                          date: "2026-05-15",
                          dateReference: "tomorrow",
                          matchedDateText: "מחר",
                          time: null,
                          timeOfDay: "evening",
                          timeRange: { startsAt: "17:00", endsAt: "22:00" },
                          matchedTimeText: "בערב",
                          matchedKeywords: ["תור", "פנוי", "מחר", "בערב"],
                          trainerId: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                          availableSlots: ["17:00", "18:00"],
                        },
                        reply:
                          "יש תורים פנויים בתאריך 2026-05-15: 17:00, 18:00",
                      },
                    },
                    booking: {
                      summary: "Booking response",
                      value: {
                        data: {
                          intent: "BOOK_APPOINTMENT",
                          confidence: 0.95,
                          originalMessage: "אני רוצה לקבוע תור מחר ב-18",
                          phone: "0501234567",
                          date: "2026-05-15",
                          dateReference: "tomorrow",
                          matchedDateText: "מחר",
                          time: "18:00",
                          timeOfDay: null,
                          timeRange: null,
                          matchedTimeText: "ב-18",
                          matchedKeywords: ["לקבוע", "תור", "מחר", "ב-18"],
                          trainerId: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                          availableSlots: ["18:00"],
                          appointment: {
                            id: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                            customerName: "Yossi Cohen",
                            phone: "0501234567",
                            trainerId:
                              "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                            startsAt: "2026-05-15T18:00:00+03:00",
                            endsAt: "2026-05-15T18:30:00+03:00",
                            status: "scheduled",
                            notes: "Created from AI chat",
                            createdAt: "2026-05-14T12:00:00+03:00",
                            updatedAt: "2026-05-14T12:00:00+03:00",
                          },
                        },
                        reply:
                          "מעולה, קבעתי לך תור בתאריך 2026-05-15 בשעה 18:00.",
                      },
                    },
                    cancellation: {
                      summary: "Cancellation response",
                      value: {
                        data: {
                          intent: "CANCEL_APPOINTMENT",
                          confidence: 0.85,
                          originalMessage: "אני רוצה לבטל את התור שלי",
                          phone: "0501234567",
                          date: null,
                          dateReference: null,
                          matchedDateText: null,
                          time: null,
                          timeOfDay: null,
                          timeRange: null,
                          matchedTimeText: null,
                          matchedKeywords: ["לבטל", "תור"],
                          trainerId: "2f75b5fc-5cc3-4e1d-87e7-bf39c52b72f0",
                          availableSlots: [],
                        },
                        reply:
                          "ביטלתי לך את התור בתאריך 2026-05-15 בשעה 18:00.",
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List appointments",
          responses: {
            "200": {
              description: "Appointments list",
              content: {
                "application/json": {
                  schema: dataResponse({
                    type: "array",
                    items: { $ref: "#/components/schemas/Appointment" },
                  }),
                },
              },
            },
          },
        },
        post: {
          tags: ["Appointments"],
          summary: "Create appointment",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateAppointmentInput",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Appointment created",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Appointment",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/appointments/availability": {
        get: {
          tags: ["Availability"],
          summary: "Get available appointment slots for a trainer and date",
          parameters: [
            {
              name: "trainerId",
              in: "query",
              required: true,
              schema: uuidSchema,
            },
            {
              name: "date",
              in: "query",
              required: true,
              schema: {
                type: "string",
                format: "date",
                example: "2026-05-15",
              },
            },
          ],
          responses: {
            "200": {
              description: "Available slots",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AvailabilityResponse" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/appointments/{id}": {
        get: {
          tags: ["Appointments"],
          summary: "Get appointment by id",
          parameters: [{ $ref: "#/components/parameters/AppointmentId" }],
          responses: {
            "200": {
              description: "Appointment",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Appointment",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          tags: ["Appointments"],
          summary: "Update appointment",
          parameters: [{ $ref: "#/components/parameters/AppointmentId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateAppointmentInput",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated appointment",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Appointment",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/appointments/{id}/cancel": {
        patch: {
          tags: ["Appointments"],
          summary: "Cancel appointment",
          parameters: [{ $ref: "#/components/parameters/AppointmentId" }],
          responses: {
            "200": {
              description: "Cancelled appointment",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Appointment",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/trainers": {
        get: {
          tags: ["Trainers"],
          summary: "List trainers",
          responses: {
            "200": {
              description: "Trainers list",
              content: {
                "application/json": {
                  schema: dataResponse({
                    type: "array",
                    items: { $ref: "#/components/schemas/Trainer" },
                  }),
                },
              },
            },
          },
        },
        post: {
          tags: ["Trainers"],
          summary: "Create trainer",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTrainerInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Trainer created",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Trainer",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/trainers/{trainerId}": {
        get: {
          tags: ["Trainers"],
          summary: "Get trainer by id",
          parameters: [{ $ref: "#/components/parameters/TrainerId" }],
          responses: {
            "200": {
              description: "Trainer",
              content: {
                "application/json": {
                  schema: dataResponse({
                    $ref: "#/components/schemas/Trainer",
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/trainers/{trainerId}/working-hours": {
        get: {
          tags: ["Trainer Working Hours"],
          summary: "Get trainer weekly working hours",
          parameters: [{ $ref: "#/components/parameters/TrainerId" }],
          responses: {
            "200": {
              description: "Trainer working hours",
              content: {
                "application/json": {
                  schema: dataResponse({
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/TrainerWorkingHours",
                    },
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          tags: ["Trainer Working Hours"],
          summary: "Replace trainer weekly working hours",
          parameters: [{ $ref: "#/components/parameters/TrainerId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateTrainerWorkingHoursInput",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated trainer working hours",
              content: {
                "application/json": {
                  schema: dataResponse({
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/TrainerWorkingHours",
                    },
                  }),
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
    },
  },
  apis: [],
});
