const SYSTEM_PROMPT = `Summarise a Nigerian market trader's week. Exactly two sentences, plain language, no jargon, no bullets, no preamble. Say where most money went and how profit compares to last week. Naira with ₦. Address the trader as "you". Never state a number that isn't in the data provided.`;

const TIMEOUT_MS = 8000;

export async function generateSummary(prompt: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER;

  if (provider === "groq") return generateWithGroq(prompt);
  if (provider === "anthropic") return generateWithAnthropic(prompt);

  throw new Error(`Unsupported or unset LLM_PROVIDER: ${provider}`);
}

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      max_tokens: 700,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Groq request failed: ${res.status}`);

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned no content");

  return text;
}

async function generateWithAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`);

  const data = await res.json();
  const text: string | undefined = data?.content?.find(
    (block: { type: string }) => block.type === "text"
  )?.text?.trim();
  if (!text) throw new Error("Anthropic returned no content");

  return text;
}
