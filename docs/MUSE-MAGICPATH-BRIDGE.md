# Muse Code ↔ MagicPath design handoff (BursYar)

The authenticated MagicPath account already contains **BursYar — Scholarship Workspace** (project ID `467709177326874624`) and two existing design components:

- Interactive workspace: `467709203071508480` (`crisply-cave-6289`)
- Mobile: `467710391615655936` (`pure-storm-8589`)

Do not create a replacement design project or new application. Existing BursYar is Vite/vanilla JavaScript; MagicPath exports React/TypeScript/Tailwind. Integrate selected visual ideas within existing UI architecture; do not overwrite business logic, auth, accessibility, state or localized strings.

## Connect to Muse Code locally

Muse Code supports external `mcp_servers` with `streamable_http` transport and remote OAuth (`muse mcp login`). The authenticated MagicPath connector reports the remote MCP endpoint as `https://api.magicpath.ai/mcp/openai/v1`. Verify this URL remains current in MagicPath before use.

Merge this object into the existing **user** Muse `settings.json` `mcp_servers` map (do not replace settings or commit secrets):

```json
{
  "mcp_servers": {
    "magicpath": {
      "transport": "streamable_http",
      "url": "https://api.magicpath.ai/mcp/openai/v1",
      "enabled": true,
      "mode": "optional"
    }
  }
}
```

From a terminal in the local BursYar repository, authenticate:

```sh
muse mcp login magicpath
muse
```

Inside Muse: `/mcp` to verify MagicPath tools are available. OAuth is handled through browser sign-in, not manually pasting a key. If the installed Muse build rejects config keys or endpoint, follow its current MCP schema and the official MagicPath agent plugin manifest rather than disabling authentication.

## Integration assignment for Muse Code

1. Inspect the two pre-existing MagicPath components and current live BursYar UI; identify 3–5 concrete visual improvements affecting first impression and end-to-end comprehension.
2. Preserve evidence-first behavior: unverified scholarship sources and translations stay unverified; do not present offline examples as live Muse results.
3. Implement improvements in a dedicated branch, with no independent React rewrite. Keep English/Farsi/Pashto and RTL/LTR correct; responsive mobile first, keyboard navigation, visible focus and accessible contrast.
4. Run existing Node, build, browser, emulator and multilingual checks as relevant. Produce before/after screenshots and a concise change report.
5. Open a PR; merge only after green current-head CI and no regression. Do not deploy automatically unless explicitly authorized.
6. Do not run paid AI inference, remove spend controls, grant unauthorized credentials, or request/transfer private student data.

Priority: preserve the fully working public demo and complete the hackathon submission video before the November 4 9:00 PM ET deadline.

References:
- https://dev.meta.ai/docs/muse-code/extending
- https://github.com/MagicPathAI/magicpath-agent-plugin
- https://www.magicpath.ai/documentation/features/code-export
