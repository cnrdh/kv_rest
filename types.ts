// https://raw.githubusercontent.com/denoland/deno/v1.36.4/cli/tsc/dts/lib.deno.unstable.d.ts
export type KvKeyPart =
  string; /* Uint8Array | string | number | bigint | boolean; */
export type KvKey = readonly KvKeyPart[];
export interface KvRestInit {
  kv: Deno.Kv;
}

export interface KvRestParams {
  raw: boolean;
  key: KvKey;
}
export interface GetAndSendListParams {
  request: Request;
  kv: Deno.Kv;
  params: unknown;
  key: KvKey;
}
