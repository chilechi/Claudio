import { Body, Controller, Get, HttpCode, Param, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StateService } from "../state/state.service.js";
import { MusicService } from "./music.service.js";

@Controller()
export class MusicController {
  constructor(
    private readonly music: MusicService,
    private readonly state: StateService
  ) {}

  @Get("/api/music/active-library")
  activeLibrary() {
    return this.music.activeLibrary();
  }

  @Get("/api/music/local/scan")
  localScan() {
    return this.music.scanLocalMusic();
  }

  @Get("/api/music/netease/status")
  neteaseStatus() {
    return this.music.neteaseStatus();
  }

  @Post("/api/music/netease/playlists/:playlistId/import")
  @HttpCode(200)
  importNetease(@Param("playlistId") playlistId: string) {
    return this.music.importNeteasePlaylist(playlistId);
  }

  @Get("/api/tracks/:trackId/stream")
  async streamTrack(@Param("trackId") trackId: string, @Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const track = await this.music.resolveLocalTrack(trackId);
    const range = request.headers.range;
    if (range && track) {
      const full = await this.music.streamLocalTrack(track);
      if (!full) {
        reply.code(404).send({ error: "Track not found or LOCAL_MUSIC_DIR is not configured" });
        return;
      }
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        reply.header("Content-Range", `bytes */${full.size}`).code(416).send();
        return;
      }
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : full.size - 1;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= full.size) {
        reply.header("Content-Range", `bytes */${full.size}`).code(416).send();
        return;
      }
      const safeEnd = Math.min(end, full.size - 1);
      const partial = await this.music.streamLocalTrack(track, { start, end: safeEnd });
      if (!partial) {
        reply.code(404).send({ error: "Track not found or LOCAL_MUSIC_DIR is not configured" });
        return;
      }
      reply.header("Content-Type", partial.contentType);
      reply.header("Content-Length", String(safeEnd - start + 1));
      reply.header("Content-Range", `bytes ${start}-${safeEnd}/${partial.size}`);
      reply.header("Accept-Ranges", "bytes");
      reply.header("Cache-Control", "no-store");
      reply.code(206).send(partial.stream);
      return;
    }

    const stream = await this.music.streamLocalTrack(track);
    if (!stream) {
      reply.code(404).send({ error: "Track not found or LOCAL_MUSIC_DIR is not configured" });
      return;
    }

    reply.header("Content-Type", stream.contentType);
    reply.header("Content-Length", String(stream.size));
    reply.header("Accept-Ranges", "bytes");
    reply.header("Cache-Control", "no-store");
    reply.send(stream.stream);
  }

  @Get("/api/state")
  stateSnapshot() {
    return this.state.getState();
  }

  @Post("/api/player/event")
  @HttpCode(200)
  playerEvent(@Body() body: unknown) {
    return this.music.recordPlayerEvent(body);
  }
}
