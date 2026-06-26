import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Request,
  type Response,
} from "express";

import authRouter from "./routes/auth-routes";
import serviceRouter from "./routes/service-routes";

const app = express();

const clientUrl =
  process.env.CLIENT_URL ??
  "http://localhost:5173";

app.disable("x-powered-by");

app.use(
  cors({
    origin: clientUrl,
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