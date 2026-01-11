import OpenAI from "openai";
import { MODELS } from "../config/models.js";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getModels() {
  return MODELS;
}
