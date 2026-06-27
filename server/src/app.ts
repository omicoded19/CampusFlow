import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Request,
  type Response,
} from "express";

import authRouter from "./routes/auth-routes";
import queueRouter from "./routes/queue-routes";
import serviceRouter from "./routes/service-routes";
import staffRouter from "./routes/staff-routes";

const app = express();

const configuredClientUrls = (
  process.env.CLIENT_URL ??
  "http://localhost:5173"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  if (/^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }

  return configuredClientUrls.includes(origin);
}

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.get(
  "/api/health",
  (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      data: {
        service: "CampusFlow API",
        status: "healthy",
        environment:
          process.env.NODE_ENV ??
          "development",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(
          process.uptime(),
        ),
      },
    });
  },
);

app.use("/api/auth", authRouter);
app.use("/api/services", serviceRouter);
app.use("/api/queues", queueRouter);
app.use("/api/staff", staffRouter);

app.use(
  (_request: Request, response: Response) => {
    response.status(404).json({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message:
          "The requested API route does not exist.",
      },
    });
  },
);

export default app;