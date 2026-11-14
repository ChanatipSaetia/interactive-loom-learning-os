# Images in the MCP player

Loom supports image components, but a valid image URL does not by itself mean
that the image will load inside an AI chat. The chat host applies a sandbox and
Content Security Policy (CSP) to the MCP App.

## Check the actual deployment

Read `read_reference({"path":"runtime.md"})` and inspect
`deployment.imagePolicy`. This metadata is derived from the same configured CSP
that the server declares for the player resource:

| Field | Meaning |
|---|---|
| `mode` | `hosted-assets` or `bundled` player configuration. |
| `resourceDomains` | Declared origins/schemes for images and other static resources. |
| `connectDomains` | Declared origins for fetch/XHR; this is separate from ordinary image loading. |
| `enforcement` | `host-controlled`; the host may impose further restrictions. |
| `imageUploadAvailable` | Currently `false`; Loom does not publish image attachments or create public image URLs. |

The default hosted configuration declares the app asset origin and font origins.
It does not declare arbitrary image CDNs or explicitly declare `data:`. Font
origins support fonts, not a supplied photo collection. A custom `appUrl` changes
the asset origin, so inspect the current metadata.

The bundled local player declares `data:` resources and no remote origins. A
small raster data URL is a possible source there if the client permits it. The
host's actual rendering remains the final check; this metadata reports the
requested policy, not a guarantee that permission was granted.

This guidance does not broaden the CSP allowlist or add an image proxy.

## Choose a deliverable source

Use the selected component's exact contract: Image, image blocks and galleries
have different field names. Supply meaningful alt text where supported, explanatory
captions and relevant attribution through supported fields.

Prefer stable, verified, direct image responses at an allowed origin. Verify
redirect destinations, expiry, authentication and hotlink restrictions. A search
result, a Drive preview page or a login page is not a direct image source. The
learner's connector authentication is not automatically available in the iframe.

Workspace paths, chat attachment IDs, `file://` URLs and blob URLs from another
session are not portable sources. Relative paths depend on the iframe's base URL;
use an allowed absolute URL for portable hosted delivery. Topic import/export
currently retains OUI files, not an uploaded image-asset bundle.

Inline data expands the payload: base64 is roughly one third larger than its
binary input. The complete new-topic source review is limited to **262144
JavaScript characters**, including embedded data. This is a topic-source limit,
not a universal per-image byte or dimension limit. Compress and size images for
the actual teaching use; avoid filling the topic with large inline images.

For a conceptual drawing, consider self-contained Svg when it preserves the
learning objective. Its sanitizer removes external images, scripts, links and
foreignObject. Wrapping a remote image in SVG does not bypass the restriction.
A schematic cannot silently replace a photograph needed for recognition practice.

## Verify the learning experience

Check image loading and legibility in the target MCP host, in Read and Present.
Compiling OUI or loading an image in Viewer does not verify the chat iframe.
Investigate a failed URL, response type, redirects, authentication, host CSP and
payload size. Replace the source or explicitly revise the composition when needed.

Keep the accompanying explanation useful without the image. If an essential image
cannot be verified, report that limitation instead of claiming the lesson is ready.
The player does not automatically repair image failures or guarantee a fallback.

For progressive authoring, read `contracts/images.md` only when adding images,
then inspect `runtime.md` for current policy. Installed writer skills include the
same guidance in `references/core/images.md` and relevant image contracts.
