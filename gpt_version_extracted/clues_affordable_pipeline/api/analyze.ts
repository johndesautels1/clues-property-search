import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runPipeline } from "../src/pipeline/run.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const result = await runPipeline({
      properties: body.properties,
      schemaPath: body.schemaPath,
      knownData: body.knownData ?? {},
      options: body.options ?? {},
    });

    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({
      error: e?.message ?? String(e),
      stack: process.env.NODE_ENV === "production" ? undefined : e?.stack,
    });
  }
}
