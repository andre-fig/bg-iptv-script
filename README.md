# bg-iptv

Gerador de playlist IPTV a partir do arquivo `channels.json`.

## Arquivos

- `channels.json`: lista de canais exportada do site.
- `playlist.m3u`: playlist IPTV publicada. No template local ela usa `__ELEMENTAL_TOKEN__`; no GitHub Actions ela pode ser atualizada com token real.
- `playlist.m3u8`: mesma lista em extensao `.m3u8`, mantida como alternativa para players que preferem esse sufixo.
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

## Atualizacao diaria no GitHub

O workflow `.github/workflows/update-playlist.yml` roda uma vez por dia e tambem pode ser executado manualmente.

Configure estes secrets no repositorio:

- `ELEMENTAL_EMAIL`
- `ELEMENTAL_PASSWORD`

Depois disso, o workflow faz login em `https://play.elemental.tv/v1/users/login`, pega `data.access_token`, gera `playlist.m3u` e `playlist.m3u8`, e commita a mudanca se houver diff.

URL recomendada para players IPTV:

```text
https://raw.githubusercontent.com/andre-fig/bg-iptv/main/playlist.m3u
```

Alternativa `.m3u8`:

```text
https://raw.githubusercontent.com/andre-fig/bg-iptv/main/playlist.m3u8
```

Observacao: o e-mail e a senha ficam protegidos nos GitHub Secrets. O token gerado fica dentro das playlists publicadas, entao qualquer pessoa com acesso ao repositorio tambem tera acesso ao token enquanto ele estiver valido.
