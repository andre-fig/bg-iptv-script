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
    Authorization: "Bearer",
    "Content-Type": "application/json;charset=UTF-8",
    Origin: "https://play.elemental.tv",
    Referer: "https://play.elemental.tv/login",
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
  throw new Error(`Elemental login failed with HTTP ${response.status}.`);
}

const payload = JSON.parse(body);
const token = payload?.data?.access_token;

if (!token) {
  throw new Error("Elemental login response did not include data.access_token.");
}

const root = resolve(import.meta.dirname, "..");
const result = spawnSync(
  process.execPath,
  ["scripts/generate-playlist.mjs", "--output", "playlist.m3u8"],
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
  throw new Error(`Playlist generation failed with exit code ${result.status}.`);
}
