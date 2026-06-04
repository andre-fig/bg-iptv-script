import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

const root = resolve(import.meta.dirname, "..");
const channelsPath = resolve(root, "channels.json");
const templateMode = args.has("--template");
const outputPath = resolve(
  root,
  String(args.get("--output") || (templateMode ? "playlist.m3u8" : "playlist.local.m3u8")),
);

const token = String(args.get("--token") || process.env.ELEMENTAL_TOKEN || "")
  .trim()
  .replace(/^t\./, "");
const preferredProfileId = Number(args.get("--profile") || process.env.ELEMENTAL_PROFILE_ID || 3);
const includeAdult = process.env.INCLUDE_ADULT === "1" || args.has("--include-adult");
const tokenValue = templateMode ? "__ELEMENTAL_TOKEN__" : token;

if (!templateMode && !tokenValue) {
  throw new Error("Set ELEMENTAL_TOKEN or pass --token=<token>. Use --template to generate a public placeholder playlist.");
}

const channelsJson = JSON.parse(readFileSync(channelsPath, "utf8"));
const channels = Object.values(channelsJson.data || {})
  .filter((channel) => !channel.locked)
  .filter((channel) => includeAdult || !channel.adult)
  .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

const lines = [
  "#EXTM3U",
  "# Generated from channels.json. Do not commit real tokens or cookies.",
];

for (const channel of channels) {
  const profile = getProfile(channel, preferredProfileId);

  if (!profile) {
    continue;
  }

  const logo = getLogo(channel);
  const group = getGroup(channel);
  const begin = channel.currentepg?.start || Math.floor(Date.now() / 1000);
  const url = `https://play.elemental.tv/v1/playlists/${encodeURIComponent(channel.id)}/t.${encodeURIComponent(tokenValue)}/${profile.id}.m3u8?begin=${begin}`;

  lines.push(
    `#EXTINF:-1 tvg-id="${escapeM3uAttr(channel.id)}" tvg-name="${escapeM3uAttr(channel.name)}" tvg-logo="${escapeM3uAttr(logo)}" group-title="${escapeM3uAttr(group)}",${channel.name}`,
    "#EXTVLCOPT:http-referrer=https://play.elemental.tv/channels",
    url,
  );
}

writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${channels.length} channels to ${outputPath}`);

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
