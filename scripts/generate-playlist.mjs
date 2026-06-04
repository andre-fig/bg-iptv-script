import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(
  root,
  String(args.get("--output") || "playlist.local.m3u8"),
);

const token = String(args.get("--token") || process.env.ELEMENTAL_TOKEN || "")
  .trim()
  .replace(/^t\./, "");
const preferredProfileId = Number(args.get("--profile") || process.env.ELEMENTAL_PROFILE_ID || 3);
const includeAdult = process.env.INCLUDE_ADULT === "1" || args.has("--include-adult");
const includeVlcOptions = args.has("--vlc-options") || process.env.INCLUDE_VLC_OPTIONS === "1";

if (!token) {
  throw new Error("Set ELEMENTAL_TOKEN or pass --token=<token>.");
}

const channelsJson = await loadChannels();
const channels = Object.values(channelsJson.data || {})
  .filter((channel) => !channel.locked)
  .filter((channel) => includeAdult || !channel.adult)
  .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

const lines = [
  "#EXTM3U",
  "# Generated from https://play.elemental.tv/v1/channels. Do not commit credentials or cookies.",
];

for (const channel of channels) {
  const profile = getProfile(channel, preferredProfileId);

  if (!profile) {
    continue;
  }

  const logo = getLogo(channel);
  const group = getGroup(channel);
  const begin = channel.currentepg?.start || Math.floor(Date.now() / 1000);
  const url = `https://play.elemental.tv/v1/playlists/${encodeURIComponent(channel.id)}/t.${encodeURIComponent(token)}/${profile.id}.m3u8?begin=${begin}`;

  lines.push(`#EXTINF:-1 tvg-id="${escapeM3uAttr(channel.id)}" tvg-name="${escapeM3uAttr(channel.name)}" tvg-logo="${escapeM3uAttr(logo)}" group-title="${escapeM3uAttr(group)}",${channel.name}`);

  if (includeVlcOptions) {
    lines.push("#EXTVLCOPT:http-referrer=https://play.elemental.tv/channels");
  }

  lines.push(url);
}

writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${channels.length} channels to ${outputPath}`);

async function loadChannels() {
  const channelsFile = args.get("--channels-file");

  if (channelsFile) {
    return JSON.parse(readFileSync(resolve(root, String(channelsFile)), "utf8"));
  }

  const response = await fetch("https://play.elemental.tv/v1/channels", {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Authorization: `Bearer ${token}`,
      Referer: "https://play.elemental.tv/channels",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    },
  });
  const body = await response.text();

  if (!response.ok) {
    const debug = process.env.DEBUG_ELEMENTAL_CHANNELS === "1" ? ` Body: ${redact(body)}` : "";
    throw new Error(`Elemental channels request failed with HTTP ${response.status}.${debug}`);
  }

  return JSON.parse(body);
}

function getProfile(channel, preferredId) {
  const profiles = Array.isArray(channel.profiles) ? channel.profiles.filter((profile) => !profile.private) : [];

  return (
    profiles.find((profile) => Number(profile.id) === preferredId) ||
    profiles.find((profile) => profile.default_profile) ||
    profiles[0]
  );
}

function getLogo(channel) {
  const images = channel.images || {};
  const imageName = images.png350White || images.png350LeftWhite || images.png700White || "";

  return imageName && images.baseURL ? `${images.baseURL}${imageName}` : "";
}

function getGroup(channel) {
  return channel.currentepg?.major_category || (channel.adult ? "Adult" : "TV");
}

function escapeM3uAttr(value) {
  return String(value || "").replaceAll('"', "'");
}

function redact(value) {
  return String(value)
    .replaceAll(token, "[redacted-token]")
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted-token]"');
}

function parseArgs(argv) {
  const parsed = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    if (arg.includes("=")) {
      const [key, ...value] = arg.split("=");
      parsed.set(key, value.join("="));
      continue;
    }

    const next = argv[index + 1];

    if (next && !next.startsWith("--")) {
      parsed.set(arg, next);
      index += 1;
      continue;
    }

    parsed.set(arg, true);
  }

  return parsed;
}
