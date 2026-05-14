import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import aiRouter from "./routes/ai.routes";
import appointmentsRouter from "./routes/appointments.routes";
import healthRouter from "./routes/health.routes";
import trainersRouter from "./routes/trainers.routes";
import traineesRouter from "./routes/trainees.routes";

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

app.use("/ai", aiRouter);
app.use("/health", healthRouter);
app.use("/appointments", appointmentsRouter);
app.use("/trainers", trainersRouter);
app.use("/trainees", traineesRouter);

export default app;
