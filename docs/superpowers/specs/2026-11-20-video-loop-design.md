# Video loop option — design

Source request: DBD-137 "Add option to loop videos in Umbraco" (customer request via Customer Success).

## Intent

Editors picking a video in the file selector can choose to have it loop. The request came from
Umbraco, but the setting lives in fileselector-web, so every integration gets it.

## Goals

- A "Loop" checkbox in the video settings, below "Autostart playback".
- When ticked, the generated embed code loops the video, for both the JavaScript and the iframe embed.
- `loop` is returned in the `success` callback and read back from `selectedFile.loop`, mirroring `autoPlay`.

## Non-goals

- No change in integration-umbraco. It loads `https://mfstatic.com/js/fileselector.min.js` and stores
  the returned `embedCode` verbatim, which `MediaflowMediaRender.cshtml` renders as is.
- No theme default for loop. Picking a theme resets `autoPlay` from the theme, but leaves `loop` alone.
- Background mode (`videoBackgroundMode`) is untouched; it already emits `<video autoplay loop muted>`.

## Constraints

- The checkbox is hidden when `hideVideoSettings === true`, like the other video settings.
- The label comes from the remote `fileSelector` dictionary (`api.mediaflow.com/1/dictionary`), not
  this repo. A key for the label must be added there, or the raw key is shown.
- The m.mediaflow.com player must honour `loop` in the JS `options` and `loop=true` in the iframe
  options. Unverified at design time; check before release.

## Approaches

1. **Checkbox in movieview (picked).** Mirrors the autoplay checkbox: `me.loop` drives
   `options.loop` and `mapIframeOptions`. Smallest change, works for every integration.
2. Integration-level setting in Umbraco (property editor config). Rejected: Umbraco only stores the
   embed code, so it would have to rewrite it; every other integration would need the same work.
3. Wait for CDN support (as suggested on the ticket). Rejected: looping is a player option, not a
   CDN feature.

## The design

In `src/js/modules/movieview.js`:

- `init` takes the loop value; `fileselector.js` passes `selectedFile.loop` (default `false`).
- Render an `mf_loop` checkbox after the autoplay one; `change` sets `me.loop`.
- When building embed options: `if (me.loop === true) options.loop = true;`.
- `mapIframeOptions` appends `&loop=true` when `options.loop` is set.
- `success` payload gains `loop: me.loop`.

`CHANGELOG.md`: one line under 2.7.0 Added.

## Left to the builder

- Exact translation key name (suggested `LOOP_PLAYBACK`, maps to `general.loopPlayback`).
- Checkbox markup follows the existing autoplay block.
