import app from "./app";

const portValue = process.env.PORT ?? "4000";
const port = Number.parseInt(portValue, 10);

if (Number.isNaN(port)) {
  throw new Error(
    `Invalid PORT value: ${portValue}`,
  );
}

const server = app.listen(port, () => {
  console.log(
    `CampusFlow API running at http://localhost:${port}`,
  );
});

function shutdown(signal: string) {
  console.log(
    `${signal} received. Closing CampusFlow API...`,
  );

  server.close(() => {
    console.log("CampusFlow API stopped.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));