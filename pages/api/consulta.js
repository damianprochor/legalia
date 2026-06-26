import { SYSTEM_PROMPT } from "../../lib/data";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Error API" });
    }

    const raw = data.content?.map((b) => b.text || "").join("") || "";
    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      parsed = {
        clasificacion: "intermedia",
        respuesta: raw,
        requiere_abogado: false,
        area_legal: "Derecho general",
        resumen_caso: "Consulta general de la empresa",
      };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
