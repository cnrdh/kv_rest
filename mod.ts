/// <reference lib="deno.unstable" />
import { KvRestInit } from "./types.ts";
import {
  getAndSendList,
  invalidKey,
  invalidValue,
  keyFromURL,
} from "./util.ts";
import { sendError, sendJson, sendValue } from "./responses.ts";

export const createKvRest = ({ kv }: KvRestInit) => {
  return async (request: Request): Promise<Response> => {
    const key = keyFromURL(request.url);
    const params = {
      raw: new URL(request.url).searchParams.has("raw"),
    };
    if (invalidKey(key)) {
      sendError(400);
    }

    const DELETE = async (request: Request): Promise<Response> => {
      const raw = await kv.delete(key);
      return true === params.raw ? sendJson(raw) : sendJson(true);
    };

    const GETListStream = async (_) => {
      const prefix = key.slice(0, -1);

      const body = new ReadableStream({
        start(controller) {
          const iter = kv.list({ prefix });
          // The following function handles each data chunk
          async function push() {
            for await (const raw of iter) {
              const { value } = raw;
              const msg = new TextEncoder().encode(
                `data: ${JSON.stringify(value)}\r\n\r\n`,
              );
              controller.enqueue(msg);
            }

            controller.close();
            return;
          }
          push();
        },

        cancel() {
          if (typeof timerId === "number") {
            clearInterval(timerId);
          }
        },
      });
      return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      });
    };

    const GET = async (request: Request): Promise<Response> => {
      if (key.at(-1) === "") {
        return GETListStream(request);
      } else {
        const raw = await kv.get(key);
        const status = raw?.value !== null ? 200 : 404;
        return true === params.raw
          ? sendJson(raw, { status })
          : sendValue(raw, { status });
      }
    };

    const PUT = async (request: Request): Promise<Response> => {
      const value = await request.json();
      if (invalidValue(value)) {
        sendError(400);
      }
      if (key.at(-1) === "") {
        sendError(400);
      }
      const { ok, versionstamp } = await kv.set(key, value);
      if (!ok) {
        sendError(500);
      }
      return true === params.raw
        ? sendJson({ ok, versionstamp })
        : sendJson(true);
    };

    switch (request.method) {
      case "DELETE":
        return await DELETE(request);
      case "GET":
        return await GET(request);
      case "PUT":
        return await PUT(request);
      default:
        return sendError(400);
    }
  };
};

if (import.meta.main) {
  const kv = await Deno.openKv();
  Deno.serve(createKvRest({ kv }));
}
