// Road Trip worker: cross-device sync storage (KV) + Anthropic AI proxy.
//
//   GET  /sync/<code>   -> stored payload or null
//   PUT  /sync/<code>   -> store payload (JSON, <100 KB)
//   POST /ai            -> proxied Anthropic Messages call (requires a
//                          registered sync code in x-sync-code header)
//
// The sync code is a long random client-generated token — knowing it IS the
// auth, like a private paste URL. The AI proxy only serves devices that have
// a registered code, so strangers can't burn API credit.

const ALLOWED_ORIGINS = new Set([
  "https://roadtrip.1984drum.com",
  "http://localhost:5173",
  "http://localhost:4173",
]);

const CODE_RE = /^[A-Za-z0-9-]{20,80}$/;
const MODEL = "claude-haiku-4-5-20251001";

function cors(origin) {
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://roadtrip.1984drum.com",
    "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-sync-code",
    "access-control-max-age": "86400",
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    if (url.pathname.startsWith("/sync/")) {
      const code = url.pathname.slice("/sync/".length);
      if (!CODE_RE.test(code)) return json({ error: "bad sync code" }, 400, headers);

      if (request.method === "GET") {
        const val = await env.SYNC.get(`sync:${code}`);
        return new Response(val || "null", {
          headers: { ...headers, "content-type": "application/json" },
        });
      }
      if (request.method === "PUT") {
        const body = await request.text();
        if (body.length > 100_000) return json({ error: "payload too large" }, 413, headers);
        try {
          const parsed = JSON.parse(body);
          if (parsed?.v !== 1) throw new Error();
        } catch {
          return json({ error: "not a sync payload" }, 400, headers);
        }
        await env.SYNC.put(`sync:${code}`, body);
        return json({ ok: true }, 200, headers);
      }
      return json({ error: "method not allowed" }, 405, headers);
    }

    if (url.pathname === "/ai" && request.method === "POST") {
      if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "forbidden origin" }, 403, headers);
      if (!env.ANTHROPIC_API_KEY)
        return json({ error: "AI proxy not configured yet (ANTHROPIC_API_KEY secret missing)" }, 503, headers);

      const code = request.headers.get("x-sync-code") || "";
      if (!CODE_RE.test(code) || (await env.SYNC.get(`sync:${code}`)) === null)
        return json({ error: "enable auto-sync first — it doubles as your assistant pass" }, 401, headers);

      let req;
      try {
        req = await request.json();
      } catch {
        return json({ error: "bad request body" }, 400, headers);
      }

      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: Math.min(Number(req.max_tokens) || 1000, 2000),
          system: String(req.system || "").slice(0, 20_000),
          messages: (Array.isArray(req.messages) ? req.messages : []).slice(-20),
        }),
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    return json({ error: "not found" }, 404, headers);
  },
};
