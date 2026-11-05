import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const match = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.+)/);
if (match) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = match[1].trim();
}

async function test() {
  console.log("Probando modelo: gemini-3.1-flash-lite...");
  const res = await generateText({
    model: google("gemini-3.1-flash-lite"),
    prompt: "Saluda cordialmente en español en 5 palabras",
  });
  console.log("✅ Éxito con gemini-3.1-flash-lite:", res.text.trim());
}

test().catch(console.error);
