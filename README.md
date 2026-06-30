# Memories

[サイト](https://trvlmmrs.vercel.app/)

写真と文章で旅行記録を残すNext.jsアプリです。データは外部DBではなく、GitHubリポジトリ内の `content/` と `public/uploads/` で管理します。

## Setup

```bash
npm install
cp .env.example .env.local
npm run admin:hash-pin -- 1234
npm run dev
```

生成したPINハッシュを `.env.local` の `ADMIN_PIN_HASH` に入れてください。

## Env

```env
ADMIN_PIN_HASH=
SESSION_SECRET=
GITHUB_OWNER=ryouy
GITHUB_REPO=memories
GITHUB_BRANCH=main
GITHUB_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run content:validate
npm run content:index
npm run content:pull
```

## Pages

- `/`
- `/entries/[slug]`
- `/admin/login`
- `/admin`
- `/admin/entries`

管理画面は4桁PINでログインします。GitHub tokenはサーバー側APIだけで使い、ブラウザには渡しません。
