import { Request, Response } from "express";
import { aiService } from "../ai/ai.service";
import { buildAppointmentReply } from "../ai/appointmentConversation.service";
import { appointmentIntentService } from "../ai/appointmentIntent.service";
import { AppointmentIntentParseResult } from "../ai/appointmentIntent.types";
import { appointmentsService } from "../services/appointments.service";
import { traineesService } from "../services/trainees.service";

const nullableRequestString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const completeIntentFromRequest = (
  parsedIntent: AppointmentIntentParseResult,
  req: Request
): AppointmentIntentParseResult => {
  const customerName =
    parsedIntent.customerName ?? nullableRequestString(req.body.customerName);
  const phone = parsedIntent.phone ?? nullableRequestString(req.body.phone);

  return {
    ...parsedIntent,
    customerName,
    phone,
    missingFields: parsedIntent.missingFields.filter((field) => {
      if (field === "customerName" && customerName) {
        return false;
      }

      if (field === "phone" && phone) {
        return false;
      }

      return true;
    }),
  };
};

const hasRequiredCreateFields = (
  parsedIntent: AppointmentIntentParseResult
): boolean =>
  Boolean(
    parsedIntent.customerName &&
      parsedIntent.phone &&
      parsedIntent.startsAt &&
      parsedIntent.endsAt
  );

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const aiController = {
  async chat(req: Request, res: Response) {
    try {
      const { message, phone, customerName, trainerId } = req.body;

      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "message is required" });
      }

      if (phone !== undefined && typeof phone !== "string") {
        return res.status(400).json({ message: "phone must be a string" });
      }

      if (customerName !== undefined && typeof customerName !== "string") {
        return res
          .status(400)
          .json({ message: "customerName must be a string" });
      }

      if (
        trainerId !== undefined &&
        (typeof trainerId !== "string" || !uuidPattern.test(trainerId))
      ) {
        return res.status(400).json({ message: "trainerId must be a valid uuid" });
      }

      const chatResponse = await aiService.chat({
        message,
        phone: phone?.trim(),
        customerName: customerName?.trim(),
        trainerId,
      });

      return res.json({
        data: chatResponse.data,
        reply: chatResponse.reply,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Unexpected error" });
    }
  },

  async parseMessage(req: Request, res: Response) {
    try {
      const { message } = req.body;

      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "message is required" });
      }

      const parsedMessage = await appointmentIntentService.parseMessage(
        message
      );
      const appointmentReply = buildAppointmentReply(parsedMessage);

      return res.json({
        data: appointmentReply.completedIntent,
        reply: appointmentReply.reply,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }

      return res.status(500).json({ message: "Unexpected error" });
    }
  },

  async processMessage(req: Request, res: Response) {
    try {
      const { message } = req.body;

      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "message is required" });
      }

      const parsedMessage = await appointmentIntentService.parseMessage(
        message
      );
      const completedFromRequest = completeIntentFromRequest(
        parsedMessage,
        req
      );
      const appointmentReply = buildAppointmentReply(completedFromRequest);
      const completedIntent = appointmentReply.completedIntent;

      if (
        completedIntent.intent !== "CREATE_APPOINTMENT" ||
        !hasRequiredCreateFields(completedIntent)
      ) {
        return res.json({ reply: appointmentReply.reply });
      }

      const appointment = await appointmentsService.createAppointment({
        traineeId: (await traineesService.getTraineeByPhone(completedIntent.phone))?.id,
        startsAt: new Date(completedIntent.startsAt),
        endsAt: new Date(completedIntent.endsAt),
        notes: completedIntent.notes,
      });

      return res.status(201).json({
        success: true,
        reply: "התור נקבע בהצלחה",
        appointment,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Unexpected error" });
    }
  },
};
