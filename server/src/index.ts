import express from "express";
import cors from "cors";
import { router } from "./routes.js";
import { initDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);

const basePort = 3100;

const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`secondhand server running: http://localhost:${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      const next = port + 1;
      console.log(`port ${port} in use, retry on ${next}...`);
      startServer(next);
      return;
    }
    throw err;
  });
};

initDb().then(() => startServer(basePort));
