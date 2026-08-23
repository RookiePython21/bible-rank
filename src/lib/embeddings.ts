import "server-only";
import OpenAI from "openai";

// Abstracted behind this module so the embedding provider can be swapped
// later without touching call sites (search API, import/embedding scripts).
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

let cached: OpenAI | null = null;

function client(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.EMBEDDING_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EMBEDDING_API_KEY environment variable.");
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
