// Eole x64 port: independent first-panel compatibility pilot.
// Target: foobar2000 2.26 x64, Columns UI, Spider Monkey Panel x64.
// This does not modify music files or require any legacy 32-bit component.
window.DefineScript("Eole x64 - Now Playing Pilot", {
    author: "Eole x64 port experiment",
    version: "0.1.0"
});

const WHITE = 0xfffafbfc;
const INK = 0xff253247;
const MUTED = 0xff758293;
const ACCENT = 0xff4e82b8;
const BORDER = 0xffe5ebf0;
const PLACEHOLDER = 0xffedf1f4;

const titleFont = gdi.Font("Segoe UI", 21, 1);
const albumFont = gdi.Font("Segoe UI", 14, 0);
const artistFont = gdi.Font("Segoe UI", 12, 0);
const smallFont = gdi.Font("Segoe UI", 10, 0);
const ELLIPSIS = 0x00008020; // DT_END_ELLIPSIS | DT_SINGLELINE

let playing = fb.GetNowPlaying();
let artwork = null;
let artworkRequest = 0;

function field(pattern, handle) {
    if (!handle) return "";
    return fb.TitleFormat(pattern).EvalWithMetadb(handle);
}

function refreshArtwork(handle) {
    const request = ++artworkRequest;
    artwork = null;
    window.Repaint();
    if (!handle) return;

    // Async artwork loading prevents a large library from freezing the UI.
    utils.GetAlbumArtAsyncV2(0, handle, 0, false).then(function (result) {
        if (request !== artworkRequest) return;
        artwork = result && result.image ? result.image : null;
        window.Repaint();
    }).catch(function (error) {
        if (request !== artworkRequest) return;
        artwork = null;
        console.log("Eole x64 pilot: artwork unavailable: " + error);
        window.Repaint();
    });
}

function on_playback_new_track(handle) {
    playing = handle;
    refreshArtwork(handle);
}

function on_playback_stop(reason) {
    // 2 = starting another track; the next-track callback will replace it.
    if (reason === 2) return;
    playing = null;
    refreshArtwork(null);
}

function on_playback_pause(state) {
    window.Repaint();
}

function on_playback_time(time) {
    window.Repaint();
}

function on_size() {
    window.Repaint();
}

function drawLabel(gr, value, font, colour, x, y, width, height) {
    gr.GdiDrawText(value, font, colour, x, y, Math.max(0, width), height, ELLIPSIS);
}

function on_paint(gr) {
    const w = window.Width;
    const h = window.Height;
    gr.FillSolidRect(0, 0, w, h, WHITE);
    if (w <= 0 || h <= 0) return;

    const pad = 22;
    const gap = 26;
    const barY = h - 29;
    const availableHeight = Math.max(0, barY - pad - 14);
    const coverSize = Math.max(0, Math.min(availableHeight, Math.floor(w * 0.38), 360));
    const coverX = pad;
    const coverY = pad;
    gr.FillSolidRect(coverX, coverY, coverSize, coverSize, PLACEHOLDER);

    if (artwork && artwork.Width > 0 && artwork.Height > 0 && coverSize > 0) {
        // Contain artwork without cropping square or non-square covers.
        const scale = Math.min(coverSize / artwork.Width, coverSize / artwork.Height);
        const aw = Math.floor(artwork.Width * scale);
        const ah = Math.floor(artwork.Height * scale);
        gr.DrawImage(artwork, coverX + (coverSize - aw) / 2,
            coverY + (coverSize - ah) / 2, aw, ah,
            0, 0, artwork.Width, artwork.Height);
    } else {
        drawLabel(gr, "NO ARTWORK", smallFont, MUTED,
            coverX + 10, coverY + coverSize / 2 - 10, coverSize - 20, 25);
    }

    const x = coverX + coverSize + gap;
    const textWidth = w - x - pad;
    if (textWidth > 30) {
        const title = field("$if2(%title%,%filename%)", playing) || "Nothing playing";
        const artist = field("$if2(%artist%,Unknown artist)", playing);
        // Use the artist-album directory name when album tags are missing.
        const album = field("$if2(%album%,%directoryname%)", playing);

        drawLabel(gr, "NOW PLAYING", smallFont, ACCENT, x, pad + 2, textWidth, 20);
        drawLabel(gr, title, titleFont, INK, x, pad + 36, textWidth, 38);
        drawLabel(gr, artist, artistFont, INK, x, pad + 81, textWidth, 30);
        drawLabel(gr, album, albumFont, MUTED, x, pad + 119, textWidth, 33);

        if (playing) {
            const details = field("[%date%  ·  ][%genre%  ·  ]%codec%", playing);
            drawLabel(gr, details, smallFont, MUTED, x, pad + 165, textWidth, 24);
        }
    }

    if (playing && fb.PlaybackLength > 0 && w > 2 * pad) {
        const ratio = Math.max(0, Math.min(1, fb.PlaybackTime / fb.PlaybackLength));
        gr.FillSolidRect(pad, barY, w - 2 * pad, 3, BORDER);
        gr.FillSolidRect(pad, barY, Math.floor((w - 2 * pad) * ratio), 3, ACCENT);
        drawLabel(gr, utils.FormatDuration(fb.PlaybackTime),
            smallFont, MUTED, pad, barY + 5, 100, 19);
        drawLabel(gr, utils.FormatDuration(fb.PlaybackLength),
            smallFont, MUTED, w - pad - 90, barY + 5, 90, 19);
    }
}

// Covers the case where music is already playing when the panel loads.
refreshArtwork(playing);
