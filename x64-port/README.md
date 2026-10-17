# Eole port to foobar2000 v2.26 x64

**Status: development / not yet an installable Eole x64 theme.**

This branch is an isolated porting experiment. Do not copy the legacy
\`user-components\` folder into a 64-bit foobar2000 installation: it contains
32-bit DLLs. Do not import the old \`columnsUI_eole.fcl\` and expect a working
x64 layout; it refers to old panel types and instances.

## Goal

Recreate Eole's browsing and cover-art experience for foobar2000 v2.26 x64,
using a **light theme**, without modifying the user's existing music library.
Preserve album/folder navigation when ID3/Vorbis metadata is inconsistent.

## Compatibility audit (17 October 2026)

| Eole dependency | Original | x64 approach |
| --- | --- | --- |
| foobar2000 | 32-bit | foobar2000 v2.26 x64 |
| Columns UI | bundled old x86 DLL | install official x64 Columns UI |
| Spider Monkey Panel | bundled x86 DLL | investigate community x64 continuation: [dima-lur/spider-monkey-panel-x64](https://github.com/dima-lur/spider-monkey-panel-x64) |
| Panel Stack Splitter | bundled x86 DLL | **rebuild** layout with JSplitter (x64) / native Columns UI containers; no drop-in FCL conversion |
| UI Hacks | bundled x86 DLL, COM access in scripts | remove or rewrite calls; [foo_openhacks](https://github.com/ttsping/foo_openhacks) provides some x64 window functions but its API is not assumed to be UIHacks-compatible |
| Shpeck / Winamp MilkDrop | x86 | optional [MilkDrop 2 Visualisation](https://www.foobar2000.org/components/view/foo_vis_milk2) x64, separate from initial port |
| Playback Statistics | bundled x86 DLL | official compatible x64 Playback Statistics |
| ESLyric | bundled x86 DLL | optional, x64 alternative/version still to be confirmed |
| Existing Eole JavaScript | old Spider Monkey Panel API, ActiveX and UIHacks usage | audit and port **panel by panel**; don't assume compatibility |

The Eole code includes calls to \`ActiveXObject("UIHacks")\`,
\`ActiveXObject("WScript.Shell")\`, \`Scripting.FileSystemObject\`, and
\`ScriptControl\`. These need case-by-case review. The original script
library is large; a binary-only replacement is insufficient.

## Pilot 1: light-mode now-playing and album artwork

File: [eole-now-playing-pilot.js](eole-now-playing-pilot.js)

This is a small, independent JavaScript panel using the supported Spider
Monkey Panel API. It does **not** depend on the legacy Panel Stack Splitter,
UIHacks, Shpeck or bundled Eole DLLs. It loads artwork asynchronously and
displays the title, artist, album, genre and progress, with a directory-name
fallback for missing album metadata.

**Pilot verification:**

1. Back up the working foobar2000 profile. Prefer a separate **portable**
   foobar2000 v2.26 x64 installation for experiments.
2. Install official x64 Columns UI. Install the **unofficial** x64 Spider
   Monkey Panel from its own release page only after reviewing its origin.
3. Create a Columns UI layout with a **Spider Monkey Panel** panel.
4. Open the panel's script configuration. Load the
   \`eole-now-playing-pilot.js\` file.
5. Start playback of a tagged album with art. Confirm the title, artist,
   album, artwork and progress appear on a light background.
6. Play a track with missing album tags but an artist-album folder. Confirm
   it shows the folder name instead of a blank album.
7. Switch tracks rapidly and confirm that delayed artwork from a previous
   track does not overwrite the current track. Play tracks with no artwork.
8. Report the first error message from foobar2000's **View → Console** if any
   check fails. Stop after at most two attempts at correcting the same fault.

**What this test establishes:** whether the x64 Spider Monkey Panel can run
our new script and retrieve artwork and track metadata in foobar2000 x64.

**What it does not establish:** that original Eole JavaScript, the FCL layout,
multi-column album browser, biography panel, lyrics, visualisations or
window-management behaviour already work. The pilot has not been runtime
tested on Windows from this development environment.

## Proposed next stages

- **P2:** x64-compatible Eole album-art grid and artist/album browsing.
  Preserve folder navigation independently from metadata.
- **P3:** rework original Eole panel scripts for the x64 Spider Monkey API;
  replace legacy UIHacks controls with explicit optional behaviour.
- **P4:** build a new JSplitter / Columns UI layout, rather than importing the
  old FCL unchanged; verify playlists, filtering, search, resizing.
- **P5:** optional lyrics, biography and MilkDrop features; review stability
  and package installation instructions without embedding unrelated binaries.
- **Release:** only after Windows 11 + foobar2000 v2.26 x64 manual tests pass.

## Preservation and rights

This branch leaves \`master\` untouched and does not alter media files.
The original Eole repository does not expose a standard licence in GitHub's
repository metadata; permissions and attribution should be clarified before
redistributing a standalone modified package.
