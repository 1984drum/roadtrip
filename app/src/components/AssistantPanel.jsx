import { useRef, useState } from "react";
import { allPois } from "../lib/customRoute";
import { cloudAvailable, proxyChat } from "../lib/cloudSync";

const KEY_LS = "roadtrip.anthropic.key";
const MODEL = "claude-haiku-4-5-20251001";

const poiById = new Map(allPois.map((p) => [p.id, p]));

function buildSystemPrompt(ratings, customRoute) {
  const catalog = allPois
    .map((p) => {
      const r = ratings[p.id] ? ` rated:${ratings[p.id]}/10` : "";
      return `${p.id} | ${p.name} | ${p.type === "optional" ? p.kind : p.type}${r}`;
    })
    .join("\n");
  const current = customRoute
    ? customRoute.stops.slice(1, -1).map((s) => s.id).join(", ")
    : "none";
  return `You are the route assistant inside "Road Trip", a UK EV road-trip web app planning a loop that always starts and ends in Macclesfield, heading to Devon and back.

PLACE CATALOG (id | name | type | user rating if any):
${catalog}

CURRENT ROUTE stop ids in visiting order (Macclesfield start/end are implicit, never include them): ${current}

The user may ask to add, remove or reorder stops, change the outward or return legs, pick different overnight stays, and so on. Help them design the route.

Respond with ONLY a JSON object, no markdown fences:
{"reply": "<short, practical answer>", "route": {"name": "<route name>", "stopIds": ["id", ...]} | null}

Rules:
- Set "route" only when you are proposing a concrete route or change; otherwise null.
- stopIds must be ids from the catalog, in visiting order for the whole loop (outward stops first, then return stops).
- Keep Tesla Superchargers (type charger) roughly every 80-100 miles of driving.
- Prefer higher-rated places when choosing between options.
- Keep replies under 80 words.`;
}

function parseAssistant(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const json = JSON.parse(cleaned);
    if (typeof json.reply === "string") {
      const ids = json.route?.stopIds?.filter((id) => poiById.has(id));
      return {
        reply: json.reply,
        route: ids?.length ? { name: json.route.name || "Assistant route", stopIds: ids } : null,
      };
    }
  } catch {
    // model ignored the contract — show its raw text
  }
  return { reply: cleaned, route: null };
}

export default function AssistantPanel({ ratings, customRoute, onApplyRoute, syncCode }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_LS) || "");
  const proxyMode = cloudAvailable() && !!syncCode;
  const [keyInput, setKeyInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(null);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem(KEY_LS, k);
    setApiKey(k);
    setKeyInput("");
  };

  const forgetKey = () => {
    localStorage.removeItem(KEY_LS);
    setApiKey("");
    setMessages([]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const system = buildSystemPrompt(ratings, customRoute);
      const apiMessages = nextMessages.map((m) => ({ role: m.role, content: m.text }));
      let raw;
      if (proxyMode) {
        raw = await proxyChat(syncCode, system, apiMessages);
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1000,
            system,
            messages: apiMessages,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message || `API error ${res.status}`);
        }
        const json = await res.json();
        raw = json.content?.map((b) => b.text || "").join("") || "";
      }
      const parsed = parseAssistant(raw);
      setMessages((m) => [...m, { role: "assistant", text: parsed.reply, route: parsed.route }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `⚠ ${e.message}`, error: true }]);
    } finally {
      setBusy(false);
      setTimeout(() => threadRef.current?.scrollTo(0, threadRef.current.scrollHeight), 50);
    }
  };

  if (!proxyMode && !apiKey) {
    if (cloudAvailable()) {
      return (
        <div className="assistant">
          <p className="assistant__blurb">
            Turn on auto-sync in <strong>Backup &amp; sync</strong> and the assistant works right
            here with no API key — your sync code doubles as its access pass. Or paste your own
            Anthropic key below.
          </p>
          <div className="assistant__keyrow">
            <input
              type="password"
              className="assistant__input"
              placeholder="Anthropic API key (sk-ant-…) — optional"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
            />
            <button className="assistant__send" onClick={saveKey}>Save</button>
          </div>
        </div>
      );
    }
    return (
      <div className="assistant">
        <p className="assistant__blurb">
          Chat with an AI to redesign the route — "swap the return leg to go via Wells", "add a
          lunch pub on day two", "start the loop anticlockwise". Runs directly against the
          Anthropic API with your own key, which never leaves this device.
        </p>
        <div className="assistant__keyrow">
          <input
            type="password"
            className="assistant__input"
            placeholder="Anthropic API key (sk-ant-…)"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveKey()}
          />
          <button className="assistant__send" onClick={saveKey}>Save</button>
        </div>
        <p className="assistant__note">
          Get a key at console.anthropic.com → API keys. Uses Claude Haiku (fractions of a penny
          per message).
        </p>
      </div>
    );
  }

  return (
    <div className="assistant">
      <div className="assistant__thread" ref={threadRef}>
        {messages.length === 0 && (
          <p className="assistant__blurb">
            Ask for route changes in plain English — "make the outward leg coastal", "drop the
            Wiltshire stops and add Wells + Glastonbury", "add a pub stop between legs 2 and 3".
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`assistant__msg assistant__msg--${m.role} ${m.error ? "assistant__msg--error" : ""}`}>
            <p>{m.text}</p>
            {m.route && (
              <button
                className="assistant__apply"
                onClick={() => onApplyRoute(m.route.stopIds, m.route.name)}
              >
                Apply: {m.route.name} ({m.route.stopIds.length} stops)
              </button>
            )}
          </div>
        ))}
        {busy && <div className="assistant__msg assistant__msg--assistant"><p>Thinking…</p></div>}
      </div>
      <div className="assistant__keyrow">
        <input
          className="assistant__input"
          placeholder="Adjust the route…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button className="assistant__send" onClick={send} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
      {!proxyMode && (
        <button className="assistant__forget" onClick={forgetKey}>Forget API key</button>
      )}
    </div>
  );
}
