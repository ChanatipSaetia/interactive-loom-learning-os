# Slice 0 spike — can a chat host run Loom's app shell?

Throwaway code for slice 0 in [grill-log-adaptive-learning.md](../../grill-log-adaptive-learning.md).
It answers one question before slice 1 builds on decisions 181–189: when an MCP App's `ui://`
shell loads its script from another origin (GitHub Pages in production), declared in
`_meta.ui.csp.resourceDomains`, does the app run, and can it go fullscreen, start audio after a
click and talk back to the chat?

| File | What it is |
|---|---|
| `server.mjs` | The MCP server: one tool, `show_topic(oui)`, and the `ui://loom/spike.html` shell. `--stdio` for chat apps on this computer, `--http [port]` for the test host |
| `assets/app.js` | The app the shell loads from the asset origin (stands in for GitHub Pages). It reports what works in a small table |
| `host/` | A minimal MCP Apps host on the official `AppBridge`: a sandboxed iframe with an opaque origin and a Content Security Policy built from the resource's declared origins, like chat apps use |
| `serve.mjs` | Serves the asset origin (`localhost:5180`) and the host (`localhost:8090`, with a real topic at `/topic.oui`) |
| `check.cjs` | Drives the host in Chromium, presses Play and saves screenshots to `results/` |

## Run it here

```bash
cd spikes/mcp-app-shell
npm install
npm run server &      # MCP over HTTP on localhost:3001
npm run serve &       # asset origin :5180, host :8090
npm run check         # screenshots and the result table
```

## Try it in Goose (or Claude Desktop)

1. `npm install` here, then keep `npm run serve` running (the app's files come from
   `http://localhost:5180`).
2. Add a command-line extension (Goose: Extensions → Add custom extension → Command-line;
   Claude Desktop: `mcpServers` in its config) running:
   `node /absolute/path/to/spikes/mcp-app-shell/server.mjs --stdio`
3. Ask the chat: *Call show_topic with the text `root = Topic("Test", "Demo", "A test", [SectionRef("intro")])`.*
4. The card should appear with ▶ Play. Press it and note what the table says, or what the chat
   shows instead.

## Results (in the local test host)

| Check | With the origin declared | Origin not declared |
|---|---|---|
| Shell loads the script from the asset origin | ✅ runs (opaque, sandboxed origin) | ❌ blocked by the CSP, as it should be |
| Connects to the host, gets the tool input (a 15,783-character topic) | ✅ | — |
| Host offers inline and fullscreen; fullscreen on Play | ✅ host switched to fullscreen | — |
| Audio after the click | ✅ `AudioContext` running | — |
| Speech voices | ⚠️ 0 voices in headless Chromium (expected; real browsers have them) | — |
| Message into the chat, update the model's context | ✅ both delivered | — |
| Same server over stdio: tool list, call, `ui://` resource with its CSP | ✅ | — |

Screenshots: `results/declared-inline.png`, `results/declared-after-play.png`,
`results/undeclared-inline.png`.

**Not yet known:** the same checks in real hosts (Goose, Claude Desktop, Claude web), each with
its own sandbox, and loading from `https://chanatipsaetia.github.io` instead of localhost.
