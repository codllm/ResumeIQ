const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.2:3b";

export async function generateWithOllama(
  prompt: string,
  json: boolean | Record<string, unknown> = false
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        ...(json ? { format: json === true ? "json" : json } : {}),
      }),
    });
  } catch (error: any) {
    throw new Error(
      `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Start Ollama with "ollama serve". ${error?.message || ""}`.trim()
    );
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Ollama request failed (${response.status}) for model "${OLLAMA_MODEL}". ${details}`.trim()
    );
  }

  const data = await response.json();

  return data.message?.content?.trim() || "";
}
