# BG IPTV

Curated IPTV playlist for watching Bulgarian television channels through any compatible IPTV player.

## Playlist URL

Use this URL in your IPTV player:

```text
https://raw.githubusercontent.com/andre-fig/bg-iptv/main/playlist.m3u8
```

This is the raw GitHub URL for the published M3U8 playlist. IPTV applications should load this URL directly, not the GitHub file preview page.

## Technical Details

The playlist is published in extended M3U format with an `.m3u8` extension. Each channel entry includes:

- `#EXTINF` metadata with channel name, channel identifier, logo URL, and group title.
- A playable HLS media playlist URL for the channel stream.

The file is intended for IPTV clients that support remote M3U/M3U8 playlists and HLS playback.

## Usage

Add the playlist URL as a remote playlist source in your IPTV application. After the playlist loads, the app should display the available Bulgarian TV channels and use the stream URLs from the playlist when a channel is selected.
