# Memories

https://trvlmmrs.vercel.app/

旅行記録Webアプリ。

## ローカル

```bash
npm install
cp .env.example .env.local
npm run admin:hash-pin -- 1234
npm run dev
```
生成されたPINハッシュを `.env.local` の `ADMIN_PIN_HASH` に入れる。

## ページ

- `/`
- `/entries/[slug]`
- `/admin`

データは `content/` と `public/uploads/` に保存。
