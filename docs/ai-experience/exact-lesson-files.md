# Exact lesson files for serverless reopening

The hosted Worker stores no topics. Asking an assistant to show a lesson again
can therefore produce a different lesson if the original source has been lost
from its accessible context. A title or summary cannot reconstruct that source.

The MCP player now offers **Download lesson** on the topic card and in expanded
Read/Present navigation. It sends the original `oui` string to the host through
the installed MCP Apps SDK's `ui/download-file` API as an embedded UTF-8 text
resource. It does not compile, reserialize, regenerate or send the lesson to a
model. Filenames are normalized to `<topic-id>.loom.oui`; file content is
unchanged, including comments, narration, domain markers and line endings.
Exports follow the currently loaded source after a `show_topic`, `open_topic`
or edit result. Invalid source can also be downloaded/copied for repair.

Ordinary anchor downloads are blocked in opaque chat iframes. The host API is
used only if the host advertises support. Unsupported, denied and failed requests
offer **Copy lesson source**. Clipboard refusal is reported too. A host may ask
the learner to confirm a download, and success is described as a request rather
than a confirmed filesystem or Drive write. No automatic fallback starts a model
turn or bypasses host refusal. Chat clients without MCP Apps can supply the exact
file using their own attachment feature where available.

To reopen, attach the saved file and ask the assistant to read its complete
source and call the existing `show_topic` unchanged, or open the file in Loom
Viewer. Authorized Drive files and local `open_topic` remain supported. Shared
tutor/storage guidance, initial server instructions, the show tool description
and its delivery response now distinguish reopening from generation. If the
original source is unavailable, ask for the saved file; generate a replacement
only when explicitly requested. This is host guidance, not deterministic
interpretation of arbitrary user language or a guarantee of model obedience.

There is no new MCP endpoint, Worker persistence, public upload URL, server-side
LLM, TopicPlan/OUI schema change or source added to model context on download.
The baseline is master `d6237885` (merged PR 201); the existing working branch
and its OpenUI selection changes are preserved.

## Verification

Unit tests cover exact source, Unicode/line endings, safe filenames, missing host
capability, denial/disconnection, current-source replacement, original source
from tool results and copying invalid source. SDK tests cover replay guidance
through existing stateless tools. Existing MCP representation/readiness checks
remain in the suite.

The browser host advertises file downloads and handles them in its parent page,
while the app iframe retains `sandbox="allow-scripts"` without `allow-downloads`.
The new browser check downloads actual files from the card, Read and Present at
380px/768px, compares their content to the original, passes downloaded source to
the real `show_topic` tool and redownloads it for equality. Unsupported and
denied hosts must show honest fallback messages. CI uploads download results
and screenshots alongside the existing MCP artifacts. This is a synthetic host
using the real protocol and Chromium, not verification of every external chat
client or its file attachment support.

Actual check results are recorded in the follow-up PR. No merge or deployment
is performed as part of the implementation.

Local verification before publication: 211 unit/integration files passed (2,190
passed, 14 skipped); 98 focused MCP tests passed; 19 offline cases passed;
TypeScript and generated-artifact consistency passed. The production Worker,
site, MCP App and local MCP built, and both bundle guards passed. Worker size:
639.45 kB uncompressed. Chromium exits before assertions because the workspace
sandbox denies a required operation; actual runtime/browser evidence is recorded
in the PR's CI run. No external AI client or learner study was exercised.
