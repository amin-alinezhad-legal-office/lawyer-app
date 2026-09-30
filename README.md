# محمد امین علی نژاد قادی

وب‌سایت و دفتر کار خصوصی، با Next.js، برای دامنه [aminalinezhad.ir](https://aminalinezhad.ir).

## محلی

```bash
npm install
npm run dev
```

- سایت عمومی: `/`
- دفتر (PWA): `/app` — ورود با موبایل و رمز

## دفتر `/app`

- نقش‌ها: وکیل (مالک)، ادمین، منشی، کارآموز — قابل تعریف پویا
- دسترسی‌های سه‌بخشی مثل `profile.password.update`
- ورود با جمع امنیتی بعد از ۳ خطای رمز
- پروفایل، کاربران، نقش‌ها
- درخواست‌ها، پرونده‌ها، بایگانی، یادداشت، یادآور، نامه، جستجو

### ادمین اولیه

- موبایل: `09124971667`
- رمز: `change-me`

## Neon و Vercel

1. پروژه را به Vercel وصل کنید و از Marketplace یک Neon بسازید (`DATABASE_URL`).
2. `AUTH_SECRET` را تنظیم کنید.
3. برای آپلود بایگانی، Vercel Blob بسازید و `BLOB_READ_WRITE_TOKEN` را بگذارید.
4. جدول‌ها:

```bash
npm run db:push
```

یا `drizzle/0000_init.sql` را اجرا کنید.
