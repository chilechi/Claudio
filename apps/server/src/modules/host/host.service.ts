import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";
import type { HostNarrationKind, HostNarrationRequest, HostNarrationResponse, State, Track } from "../../../../../packages/shared/src/index.js";
import { ConfigService } from "../config/config.service.js";
import { MusicService } from "../music/music.service.js";
import { StateService } from "../state/state.service.js";
import { claudioPersona } from "../ai/persona.js";

const deepSeekHostResponseSchema = z.object({
  text: z.string().trim().min(1)
});

@Injectable()
export class HostService {
  constructor(
    private readonly config: ConfigService,
    private readonly music: MusicService,
    private readonly state: StateService
  ) {}

  async narrate(kind: HostNarrationKind, request: HostNarrationRequest): Promise<HostNarrationResponse> {
    const library = await this.music.activeLibrary();
    const track = library.tracks.find((item) => item.id === request.trackId);
    if (!track) throw new BadRequestException("没有找到要解读的曲目。");

    const previousTrack = request.previousTrackId ? library.tracks.find((item) => item.id === request.previousTrackId) : undefined;
    const state = await this.state.getState();

    const aiText = await this.tryDeepSeek(kind, track, previousTrack, state, request.context);
    const text = aiText || fallbackNarration(kind, track, previousTrack);

    return {
      kind,
      trackId: track.id,
      previousTrackId: previousTrack?.id,
      text,
      source: aiText ? "deepseek" : "local",
      generatedAt: new Date().toISOString()
    };
  }

  private async tryDeepSeek(
    kind: HostNarrationKind,
    track: Track,
    previousTrack: Track | undefined,
    state: State,
    context?: string
  ): Promise<string | null> {
    if (this.config.env.AI_PROVIDER !== "deepseek" || !this.config.env.DEEPSEEK_API_KEY) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${this.config.env.DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: this.config.env.DEEPSEEK_MODEL,
          temperature: 0.72,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                claudioPersona,
                "你是 Claudio 的电台主播脑，只负责生成即将朗读的短旁白。",
                "只返回 JSON：{\"text\": string}。",
                "中文，温柔克制，不称呼用户，不装熟，不解释自己在调用模型。",
                "不超过 2 句。不要说欢迎收听，不要用夸张营销语。"
              ].join("\n")
            },
            {
              role: "user",
              content: JSON.stringify({
                kind,
                hour: new Date().getHours(),
                track: compactTrack(track),
                previousTrack: previousTrack ? compactTrack(previousTrack) : null,
                context,
                recentPrompts: (state.recentPrompts || []).slice(0, 3),
                likedCount: state.liked.length,
                skippedCount: state.skipped.length
              })
            }
          ]
        }),
        signal: controller.signal
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      const text = deepSeekHostResponseSchema.parse(parsed).text;
      return normalizeNarration(text);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function compactTrack(track: Track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    durationText: track.durationText,
    tags: track.tags
  };
}

function fallbackNarration(kind: HostNarrationKind, track: Track, previousTrack?: Track) {
  const title = track.title;
  const artist = track.artist || "未知歌手";
  if (kind === "between-tracks" && previousTrack) {
    return normalizeNarration(`从《${previousTrack.title}》收回来，接到《${title}》。${artist} 的这一首可以慢一点进入，不急着给它下结论。`);
  }
  return normalizeNarration(`现在放的是《${title}》，${artist}。先让这首歌自己展开，留一点安静给旋律。`);
}

function normalizeNarration(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}
