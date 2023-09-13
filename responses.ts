export const sendJson = async (
  value: Promise<unknown> | unknown,
  { status = 200 } = {},
): Promise<Response> =>
  new Response(JSON.stringify(await value) + "\n", { status });

export const sendNdjson = async (
  arr: Array<unknown>,
): Promise<Response> => {
  const ndjson = await arr.map((o) => JSON.stringify(o) + "\n").join("");
  const headers = { "content-type": "text/plain; charset=utf-8" };
  return new Response(ndjson, { headers });
};
export const sendError = (status: number): Promise<Response> =>
  sendJson((Promise.resolve)({ status }), { status });

export const sendValue = async (
  raw: unknown | Deno.KvEntry<unknown>,
  opts,
): Promise<Response> => sendJson((await raw).value, opts);
