import { createHash, randomUUID } from "node:crypto";
import { WebSocket } from "ws";

const EDGE_TTS_BASE_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "134.0.3124.66";
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_FULL_VERSION} Safari/537.36 Edg/${CHROMIUM_FULL_VERSION}`;
const ORIGIN = "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold";
const WIN_EPOCH = 11644473600n;
const TICKS_PER_SECOND = 10_000_000n;

export type EdgeTtsOptions = {
  voice?: string;
  rate?: string;
  volume?: string;
  pitch?: string;
};

function generateSecMSGec(): string {
  const unixTime = BigInt(Math.floor(Date.now() / 1000));
  let ticks = unixTime + WIN_EPOCH;
  ticks -= ticks % 300n;
  ticks *= TICKS_PER_SECOND;
  const ticksFloored = (ticks / 1_000_000_000n) * 1_000_000_000n;
  const strToHash = `${ticksFloored}${TRUSTED_CLIENT_TOKEN}`;
  return createHash("sha256").update(strToHash).digest("hex").toUpperCase();
}

export async function synthesizeWithEdgeTts(
  text: string,
  options: EdgeTtsOptions = {}
): Promise<Buffer> {
  const voice = options.voice || "zh-CN-XiaoxiaoNeural";
  const rate = options.rate || "+0%";
  const volume = options.volume || "+0%";
  const pitch = options.pitch || "+0Hz";

  const connectionId = randomUUID().replace(/-/g, "");
  const requestId = randomUUID().replace(/-/g, "");
  const secMsGec = generateSecMSGec();
  const url = `${EDGE_TTS_BASE_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;

  return new Promise<Buffer>((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Origin: ORIGIN,
        "Sec-MS-GEC": secMsGec,
        "Sec-MS-GEC-Version": SEC_MS_GEC_VERSION,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const audioChunks: Buffer[] = [];
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { ws.close(); } catch { /* ignore */ }
        reject(new Error("Edge TTS 请求超时"));
      }
    }, 15_000);

    ws.on("open", () => {
      const timestamp = new Date().toISOString();

      const configBody = JSON.stringify({
        synthesis: {
          audio: {
            metadataOptions: {
              sentenceBoundaryEnabled: false,
              wordBoundaryEnabled: false
            },
            outputFormat: "audio-24khz-48kbitrate-mono-mp3"
          }
        }
      });
      ws.send(
        [
          `X-Timestamp:${timestamp}`,
          "Content-Type:application/json; charset=utf-8",
          "Path:synthesis.context",
          `X-RequestId:${requestId}`,
          "",
          configBody
        ].join("\r\n")
      );

      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>${escapeXml(text)}</prosody></voice></speak>`;
      ws.send(
        [
          `X-Timestamp:${timestamp}`,
          "Content-Type:application/ssml+xml",
          "Path:ssml",
          `X-RequestId:${requestId}`,
          `Content-Length:${Buffer.byteLength(ssml, "utf8")}`,
          "",
          ssml
        ].join("\r\n")
      );
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        const headerLen = data.readUInt16BE(0);
        const header = data.subarray(2, 2 + headerLen).toString("utf8");
        if (header.includes("Path:audio")) {
          audioChunks.push(data.subarray(2 + headerLen));
        }
        return;
      }

      const message = data.toString("utf8");
      if (message.includes("Path:turn.end")) {
        settled = true;
        clearTimeout(timeout);
        try { ws.close(); } catch { /* ignore */ }
        resolve(Buffer.concat(audioChunks));
      }
    });

    ws.on("error", (error: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    ws.on("close", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        if (audioChunks.length) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error("Edge TTS 连接关闭但未收到音频数据"));
        }
      }
    });
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
