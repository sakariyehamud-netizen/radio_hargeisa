import { GoogleGenAI } from "@google/genai";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const LANGUAGE_NAMES: Record<string, string> = {
  so: "Somali",
  en: "English",
  ar: "Arabic",
};

export async function runStudioAiTask(params: {
  kind: string;
  targetType: string;
  targetTitle: string;
  targetDescription?: string;
  transcript?: string;
  language?: string;
}): Promise<string> {
  const lang = LANGUAGE_NAMES[params.language || "so"] || "Somali";
  const ai = getGeminiClient();

  const contextText = [
    `Title: ${params.targetTitle}`,
    params.targetDescription ? `Description: ${params.targetDescription}` : "",
    params.transcript ? `Transcript/Notes: ${params.transcript}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompts: Record<string, string> = {
    TRANSCRIPT: `Draft a clean, accurate broadcast radio transcript in ${lang} for Radio Hargeysa based on this ${params.targetType.toLowerCase()} context:\n${contextText}`,
    SUMMARY: `Write a concise, editorial broadcast summary (2-3 sentences) in ${lang} for Radio Hargeysa listeners:\n${contextText}`,
    CHAPTERS: `Generate 4-6 timestamped broadcast chapters (format "MM:SS - Chapter Title") in ${lang} for:\n${contextText}`,
    TITLE: `Propose 5 compelling, clear broadcast headlines/titles in ${lang} suitable for Radio Hargeysa:\n${contextText}`,
    DESCRIPTION: `Write an engaging episode/program description (1 paragraph, ~60 words) in ${lang} for:\n${contextText}`,
    KEYWORDS: `Return a comma-separated list of 8 relevant broadcast tags/keywords in ${lang} for:\n${contextText}`,
    CAPTION: `Write a crisp social media broadcast announcement caption in ${lang} for Radio Hargeysa:\n${contextText}`,
    CLIPS: `Propose exactly 4 vertical short-form clips in pipe-delimited lines "start_seconds|end_seconds|title|reason" in ${lang} for:\n${contextText}`,
  };

  const prompt = prompts[params.kind] || prompts.SUMMARY;

  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment secrets. Add it to run AI Desk tools."
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction:
        "You are an editorial broadcast assistant at Radio Hargeysa — Codka Jamhuuriyadda Somaliland. Keep output clean, factual, and ready for human editor review.",
    },
  });

  const text = (response.text || "").trim();
  if (!text) {
    throw new Error("Empty response from AI model.");
  }
  return text;
}
