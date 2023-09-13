import { sendJson, sendNdjson } from "./responses.ts";
import type { GetAndSendListParams, KvKey } from "./types.ts";

export const keyFromURL = (url: URL | string): KvKey => {
  const { pathname } = new URL(url);
  return pathname.split("/").slice(1).map((v) => decodeURIComponent(v));
};

// Keys have a maximum length of 2048 bytes after serialization.
export const invalidKey = (key: KvKey): boolean =>
  JSON.stringify(key).length > 2048;

// Values have a maximum length of 64 KiB after serialization.
export const invalidValue = (value: unknown): boolean => {
  const len = JSON.stringify(value).length;
  return len > 2 ** 16 || len < 4;
};

// export const paramsFromRequest = (
//   request: Request,
// ) =>
//   new Map(Object.entries({
//     raw:  as boolean,
//     key: keyFromURL(request.url) as KvKey,
//   }));

export const getList = async (kv: Deno.Kv, opts: Deno.KvListOptions) => {
  const list = [];
  for await (const raw of kv.list(opts)) {
    list.push(raw);
  }
  return list;
};

export const getAndSendList = async (
  { request, kv, params, key }: GetAndSendListParams,
) => {
  const prefix = key.slice(0, -1);
  const opts = { prefix } as Deno.KvListOptions;
  const raw = await getList(kv, opts);
  if (params.raw) {
    return sendJson(raw);
  }
  const values = await raw.map(({ value }) => value);
  return sendNdjson(values);
};
