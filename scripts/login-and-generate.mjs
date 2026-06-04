import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const email = process.env.ELEMENTAL_EMAIL;
const password = process.env.ELEMENTAL_PASSWORD;

if (!email || !password) {
  throw new Error("Set ELEMENTAL_EMAIL and ELEMENTAL_PASSWORD.");
}

const response = await fetch("https://play.elemental.tv/v1/users/login", {
  method: "POST",
  headers: {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    Authorization: "Bearer",
    "Content-Type": "application/json;charset=UTF-8",
    Origin: "https://play.elemental.tv",
    Referer: "https://play.elemental.tv/login",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  },
  body: JSON.stringify({
    email,
    grant_type: "client_credentials",
    password,
    rememberme: true,
  }),
});

const body = await response.text();

if (!response.ok) {
  const debug = process.env.DEBUG_ELEMENTAL_LOGIN === "1" ? ` Body: ${redact(body)}` : "";
  throw new Error(`Elemental login failed with HTTP ${response.status}.${debug}`);
}

const payload = JSON.parse(body);
const token = payload?.data?.access_token;

if (!token) {
  throw new Error("Elemental login response did not include data.access_token.");
}

const root = resolve(import.meta.dirname, "..");

for (const output of ["playlist.m3u", "playlist.m3u8"]) {
  const result = spawnSync(
    process.execPath,
    ["scripts/generate-playlist.mjs", "--output", output],
    {
      cwd: root,
      env: {
        ...process.env,
        ELEMENTAL_TOKEN: token,
      },
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(`Playlist generation failed for ${output} with exit code ${result.status}.`);
  }
}

function redact(value) {
  return String(value)
    .replaceAll(email, "[redacted-email]")
    .replaceAll(password, "[redacted-password]")
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted-token]"');
}
