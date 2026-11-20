# Video Loop Option Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Loop" checkbox to the file selector's video settings that makes the generated embed code loop the video.

**Architecture:** Mirror the existing autoplay setting in `movieview.js`: `me.loop` is set from `selectedFile.loop` on init, toggled by a checkbox, written into the JS embed `options` and the iframe option string, and returned in `success`.

**Tech Stack:** Plain ES modules bundled by webpack; no test framework in the repo (`npm test` is a stub).

**Spec:** `docs/superpowers/specs/2026-11-20-video-loop-design.md`

## Global Constraints

- The checkbox is rendered only when `me.config.hideVideoSettings !== true`.
- Label text via `me.lang.translate('LOOP_PLAYBACK')` (dictionary key `fileSelector.general.loopPlayback`, added outside this repo).
- JS embed: `options.loop = true` only when ticked; iframe: `&loop=true` only when ticked.
- Theme change does not touch `me.loop`. `videoBackgroundMode` path is unchanged.
- No new dependencies, no test framework added.

## Review Focus

- Reopening a video with no `selectedFile.loop` (all existing saved values) — expect unticked, no `loop` in options.
- Non-video selection path (`fileselector.js:286`) — `me.loop` must be `false`, not `undefined`, so `success` returns `loop: false`.
- `hideVideoSettings: true` — no checkbox; `loop` stays `false`.
- `rootElement` mode (Umbraco) — checkbox must work inside the root element; use the same id pattern as `mf_autostart`.
- Iframe embed with loop but not autoplay — `mapIframeOptions` output is `autoPlay=false&loop=true`.

---

### Task 1: Loop setting end-to-end in movieview

**Files:**
- Modify: `src/js/modules/movieview.js:5-12` (init), `:217-236` (after autoplay checkbox), the `me.config.success({...})` payload, the `// Always set here` autoPlay options block, `mapIframeOptions`
- Modify: `src/js/fileselector.js:269-286` (both `movieview.init` calls)
- Modify: `CHANGELOG.md` (2.7.0 Unreleased → Added)

**Interfaces:**
- Produces: `movieview.init(me, backClickCallback, embedMethod, startTime, autoPlay, loop)`; `me.loop: boolean`; `success` payload field `loop: boolean`.

No test runner exists and the module only runs inside the webpack bundle, so verification is the build plus the dev-server walkthrough in Step 3. Adding a test framework is out of scope.

- [ ] **Step 1: Implement**

- `init`: add sixth parameter `loop`; `me.loop = loop === true;`.
- `fileselector.js:269`: `var loop = me.config.selectedFile.loop === true;` and pass it; `:286` passes `false`.
- After the autoplay block, inside the same `hideVideoSettings !== true` guard style: a `label`/`input[type=checkbox]` with id and name `mf_loop`, label `me.lang.translate('LOOP_PLAYBACK')`, styled like `mf_autostart`, checked when `me.loop`, `change` sets `me.loop = e.target.checked`.
- Embed options, after the autoPlay block: `if (me.loop === true) { options.loop = true; }`.
- `mapIframeOptions`: after the autoPlay line, `if (options.loop) { iframeOptions += '&loop=true'; }`.
- `success` payload: `loop: me.loop,` after `autoPlay`.
- CHANGELOG: `- Loop checkbox in video settings: the embed code loops the video. \`loop\` is returned in the success callback and read from \`selectedFile.loop\`.`

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: webpack completes with no errors.

- [ ] **Step 3: Verify in the dev server**

Run: `npm run serve` (needs local `src/js/presets/credentials`, gitignored).
Pick a video, tick Loop, for each embed method (JavaScript, iframe) click "Use this file" and check the `success` payload:
- JS: `embedCode` request body `options` contains `"loop":true`; payload `loop: true`.
- iframe: request `options` is `autoPlay=false&loop=true`; payload `loop: true`.
- Untick: no `loop` in either; payload `loop: false`.
- Network tab: the m.mediaflow.tech `/embed` response's player actually loops (play to end). If it does not, stop and report — the player lacks support.

- [ ] **Step 4: Commit**

```bash
git add src/js/modules/movieview.js src/js/fileselector.js CHANGELOG.md
git commit -m "Add loop option to video settings (DBD-137)"
```
