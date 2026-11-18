import express from "express";
import { createApiRouter } from "../server/routes.ts";

const app = express();
const router = createApiRouter();

// Support both /api/foo and /foo depending on Vercel rewrite behavior
app.use("/api", router);
app.use("/", router);

export default app;
