# Jummo Room prototype

The main app renders the original Jummo World at `#/jummo`, with its mood selector, rain, galleries, secret letter, downloads and quiz restored from commit `fa8a7a0`. The Room Tour button enters Jummo Room; Back to Jummo World preserves World state (including quiz progress). The main app keeps its existing Kotlin API startup.

For an explicit development preview, run `npm run dev` and open `/jummo-room.html`. This entry shows World and Room using the demo editorial catalog. It uses the real AuthProvider and API for sign-in/diary; those require the Kotlin server and database. Use http://127.0.0.1:5173/jummo-room.html with the default backend APP_ORIGIN; using port 5174 with that default causes authentication requests to be rejected by the origin check. It does not replace API failures in the main app. The default production build still uses `index.html`.

## Current interaction

- Tap the bed or Go to bed: Jummo follows three authored waypoints, then sleeps.
- Wake up: Jummo follows the reverse route and returns to the original spot.
- Competing actions and repeated sleep requests are disabled during travel/sleep; the window remains usable. Timers are cleared when leaving the room.
- Reduced motion skips travel and turns off decorative animation.
- Book, radio and bed open the supplied reading/dancing/sleeping GIF in a large native dialog with a corner X and Escape dismissal. Closing reading/dancing returns to idle; closing the sleep GIF leaves Jummo sleeping with Wake up available. Radio does not start audio.
- Diary is separate from the storybook. Signed-in users can create, edit and reopen entries stored through the existing `user_notes` API and owner RLS. Entries are also visible in Account → Notes. No diary text is stored in localStorage. Failed saves preserve drafts, unsaved navigation asks before discarding, and switching accounts remounts all private state.
- Zoom enlarges the whole scene with horizontal scrolling. All artwork, hotspots and character positions share the original room aspect ratio.

Four shared care meters now persist locally (see Dining and care below). Timed decay and capped offline decay are enabled; activity state is not persisted. Reloading returns Jummo to idle; saved diary entries persist on the server.

## Supplied artwork

Original PNGs are copied unchanged to `public/images/jummo-room/`:

- `bedroom.png`: 1678 × 937 complete room, including existing furniture.
- `jummo.png`: 435 × 435 transparent character. CSS displays the visible 204 × 235 area at (125, 88); no image file was altered.
- `bed.png`, `window.png`: original 1920 × 1080 transparent layers, retained for later layered scenery. Both contain stray pixels away from the furniture. They are not drawn on top of furniture already present in the complete room.

Walking uses a gentle CSS bob, and the small in-room sleeping character rotates the supplied standing pose with a Zzz effect. The supplied GIFs include a full background, so they are displayed in the enlarged activity dialog, not as transparent character sprites. `reading.gif` is animation (3), `dancing.gif` is animation (2), and `sleeping.gif` is animation (1), copied unchanged.

## Extension points

- `src/features/jummo/roomScene.js`: art paths, source crop, hotspot rectangles, home position and bed waypoints, all in one coordinate system.
- `src/features/jummo/useRoomActivity.js`: exclusive activity and travel lifecycle.
- `src/pages/JummoRoom.jsx` and `.css`: rendering and room controls.
- `src/pages/JummoWorld.test.jsx`: sleep/wake round trip, action locks, timer cleanup, reduced motion, localization and existing activities.

Account synchronization of care stats remains outside this version.

## Dining and care

- `src/features/jummo/careState.js`: shared state, defaults (fullness 40; others 80), clamping and versioned `jummo-care-v1` localStorage. A completed meal saves all four meters; malformed/unavailable storage falls back safely. Failed writes display a warning. No account is needed. Timed rates are described in the latest update below.
- `CarePanel.jsx`: four always-visible icon/bar/percentage cells in a horizontal strip, with a non-flashing warning below 20. The strip sits above the artwork and never overlays furniture.
- `DiningRoom.jsx`: idle → dragging → mouth → eating → idle. Pointer capture supports mouse/touch; cancellation, capture loss, window blur and visibility changes cancel a drag. Keyboard users select a dish and activate Feed. Only a valid drop or Feed begins eating. The timer commits nutrition exactly once, then unlocks controls; unmount cancels unfinished meals.
- `diningScene.js`: edit `FOODS[].nutrition` (default 20), `DINING.mealDuration` (2400 ms), `DINING.dragSize`, `DINING.mouth` normalized scene rectangle and `DINING.debugMouth` (development only). `DINING.character` documents the baked-in character bounds: character position is part of all three supplied full-scene assets, not a separate sprite that can be moved independently. To move the character, supply aligned replacement scenes and update the mouth bounds. Food crop rectangles affect CSS display only; original files are retained.
- Assets in `public/images/jummo-room/dining/`: kitchen.png = normal complete scene, open mouth.png = complete open-mouth scene, eat.gif = complete eating scene. All share 3:2 proportions. Apple, bao, fish, rice and egg are reusable food choices, with no inventory or currency.
- JummoRoom.jsx/.css integrate scene switching and the shared HUD; JummoWorld.jsx locks its Back button during meals. Sleeping/walking blocks entry with a short explanation. Other activity state closes when entering dining.

Validation: DiningRoom.test.jsx covers three meals from 40 to 100, clamp from 90, full rejection, opening/leaving the mouth zone, outside drops, valid drop counted once, pointercancel/capture loss, mid-meal unmount, corrupt storage, room changes/remount persistence and waking before dining. Existing room and diary suites remain in use. Browser checks cover actual mouse dragging, keyboard feeding, mobile layout and reload persistence. Physical touch-device testing is not available in this session.

## Compact layout and timed care (2026-10-18)

The horizontal four-cell care strip replaces the floating vertical HUD. Room Tour now shows eight direct actions (Dining, Bath unavailable, Sleep/Wake, Music, Read, Stargaze, Diary, Photo), one short status line and hover/focus-only furniture labels. The phone action grid has four columns; artwork keeps its native ratio and coordinates. Dining uses the same strip with its food tray below the scene.

`src/features/jummo/careConfig.js` is the common balance configuration: all defaults, decay rates, reward rates, default nutrition, offline cap and save cadence. Active mood earns 2/10 s, sleeping earns 5/min only after arrival. Background decay per 30 min is mood 4, fullness 5, cleanliness 3, energy 5. The corresponding decay pauses while earning active mood/sleep. Bath remains unavailable and grants nothing.

`careState.js` integrates actual elapsed milliseconds and retains fractional values. Its single refresh interval only refreshes UI; it does not define elapsed time. Version 2 saves store stats plus updatedAt under the existing storage key, with migration from version 1. Saves occur every 15 seconds while visible, on completed meals, visibility boundaries and unmount/pagehide. One hidden span applies at most 30 points of decay per meter and grants no rewards. Negative elapsed time is ignored without moving the timestamp backwards. Activities and unfinished meals reset when the document is hidden; no automatic restart on return. Complete meal rewards remain once per completed timer. React room/activity changes do not recreate the care interval.

Updated files: JummoRoom.jsx/.css, CarePanel.jsx, careState.js, careConfig.js, diningScene.js, DiningRoom.jsx, useRoomActivity.js, JummoWorld.test.jsx, DiningRoom.test.jsx, careState.test.jsx. The existing JummoWorld features and diary backend remain unchanged by this update.

Validation for this update: room and dining layouts measured at 360, 390, 768, 1280 CSS px with no horizontal page overflow; action/food targets at least 44 px. Desktop/mobile screenshots saved. Tests cover timed rewards, actual elapsed time, mode changes without instant bonuses, offline cap/no double counting, backwards clocks, migration, interval cleanup, hidden-page cancellation and prior meal/diary/room flows. Physical touchscreen testing is not available. The three reference screenshots mentioned in the request were not attached to this message, so the supplied written layout requirements were used.


## Tabletop feeding update

Food now lives inside the 3:2 kitchen scene at normalized positions in DINING.table. Desktop shows five dishes; at 600px and below, three dishes cycle with small previous/next buttons. Each target is at least 44px; mobile dishes are 52px tall. The former card tray is replaced by a single short status row, with Feed shown only after selection.

The open-mouth scene appears throughout pointer dragging. The original serving is hidden while the pointer sprite moves, and stays hidden during eating. Releasing outside the mouth restores it; a valid drop starts eat.gif, commits nutrition once after 2400ms, and restores a serving. Cancellation and interrupted meals award nothing. Fullness and care rates are unchanged.

Five *-transparent.png sprites in public/images/jummo-room/dining were generated using the builtin imagegen from the original supplied icons. Prompt: Remove ONLY the exterior white background to genuine alpha transparency; preserve the exact hand-drawn shape, colors, dark outlines, interior white highlights and white food areas; single isolated food, no plate, lettering or new details; center within a square canvas with about 8% transparent padding. Originals are retained. Plates and shadows are CSS.

Current validation: production build succeeds; lint reports only the two existing RecordPlayer warnings. Browser verification of this update is blocked by the browser tool URL policy; no physical-phone test is claimed.

Focused validation: all 36 tests across DiningRoom, careState, DiaryDialog and JummoWorld pass (27 in the first focused run and all 9 dining tests after updating the old mouth-state assertion). The broader sandboxed suite reported failures outside this feature and did not provide a clean full-suite result.

## Bath interaction (2026-10-20)

Bath now opens a dedicated scene using the supplied background, mobath/mobath2 and bubble artwork. Add bubbles, then hold and drag the shower to rinse each region. Water animation follows the nozzle; foam shrinks and fades only inside its spray. Releasing, cancelling, losing focus or hiding the page stops water. Enter/Space toggles water and arrow keys move the focused shower. Completing all regions awards the configured 40 cleanliness once and persists care state. Leaving an unfinished bath grants no reward.

The shower is an SVG matching the lavender reference; foam uses a CSS window onto the intact cloud in the supplied bubble image. Source PNGs are copied unchanged. Reduced-motion preference disables flow animation and foam transitions.

Validation: production build and three new BathRoom tests pass; lint has only the two existing RecordPlayer warnings. The broader focused suite encountered sandbox temporary-file ENOENT errors. Browser visual verification is blocked by localhost connection timeout.
