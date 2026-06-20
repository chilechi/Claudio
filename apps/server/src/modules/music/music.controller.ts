import { Body, Controller, Get, HttpCode, Param, Post, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
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
  async streamTrack(@Param("trackId") trackId: string, @Res() reply: FastifyReply) {
    const track = await this.music.resolveLocalTrack(trackId);
    const stream = this.music.streamLocalTrack(track);
    if (!stream) {
      reply.code(404).send({ error: "Track not found or LOCAL_MUSIC_DIR is not configured" });
      return;
    }

    reply.header("Content-Type", stream.contentType);
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
