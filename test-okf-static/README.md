# Standalone OKF Static Playground

This directory serves as a test environment for verifying the standalone `loom-learning-sections` UMD component library using raw Open Knowledge Format (OKF) directories parsed in-browser.

## Folder Structure
- `index.html`: Bootstraps the application via local built UMD bundles and runs `LoomSections.loadAndRenderOKF(container, okfBaseUrl, topicId)`.
- `okf-data/`: Local catalog containing sample OKF markdown/yaml files.

## How to Test Locally

Since `LoomSections.loadAndRenderOKF` was just added, it is not published to jsDelivr yet. To test the changes locally, serve the entire repository from the workspace root:

```bash
# 1. Compile the library UMD bundle
npm run build:lib

# 2. Start the local server in the repository root folder
npx serve .
```

Now, navigate to the local playground path:
`http://localhost:3000/test-okf-static/index.html`
*(Replace `3000` with the actual port printed by `serve` if different)*.

Once the library package is published to npm, you can update `index.html` to reference the public jsDelivr CDN links instead.
