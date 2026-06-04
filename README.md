# bg-iptv

Gerador de playlist IPTV a partir do arquivo `channels.json`.

## Arquivos

- `channels.json`: lista de canais exportada do site.
- `playlist.m3u8`: playlist com placeholder de token, segura para versionar.
- `playlist.local.m3u8`: playlist funcional gerada localmente, ignorada pelo Git.

## Gerar template versionavel

```sh
npm run generate:template
```

## Gerar playlist local

Informe apenas o token autorizado, sem cookies:

```sh
ELEMENTAL_TOKEN="seu-token" npm run generate
```

Opcoes:

```sh
ELEMENTAL_PROFILE_ID=3 ELEMENTAL_TOKEN="seu-token" npm run generate
```

Por padrao o script usa o profile `3` quando o canal suporta esse profile. Se nao suportar, ele usa o primeiro profile publico disponivel.

Nao suba `playlist.local.m3u8`, cookies ou tokens para o GitHub.
