import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { createApiRouter } from "./server/routes.ts";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Serve uploaded files and static public assets
  app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));
  app.use("/media", express.static(path.resolve(process.cwd(), "public/media")));

  // Mount API routes
  app.use("/api", createApiRouter());

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled server error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Radio Hargeysa server listening on http://localhost:${PORT}`);
  });
}

startServer();
