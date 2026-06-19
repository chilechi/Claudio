import { readFile } from "node:fs/promises";

export async function callDeepSeek({ config, input, library }) {
  if (!config.deepseekApiKey) return null;

  const persona = await readFile(new URL("./persona.md", import.meta.url), "utf8");
  const tracks = library.tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    tags: track.tags
  }));

  const body = {
    model: config.deepseekModel,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${persona}\n\n只返回 JSON：{"reply": string, "mode": string, "queueIds": string[], "reason": string}。queueIds 必须来自候选歌曲 id。`
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            input,
            tracks
          },
          null,
          2
        )
      }
    ]
  };

  const response = await fetch(`${config.deepseekBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.deepseekApiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek 请求失败：${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}
