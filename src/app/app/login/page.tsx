import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginApp } from "@/app/app/actions";
import { PasswordField } from "@/components/office/password-field";
import { getLoginGate } from "@/db/rbac";
import { isAppAuthed } from "@/lib/auth";
import { createCaptchaChallenge } from "@/lib/captcha";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `ورود | دفتر ${site.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  auth: "شماره یا رمز درست نیست.",
  captcha: "پاسخ جمع امنیتی درست نیست.",
  locked: "به‌خاطر تلاش‌های زیاد، ورود موقتاً قفل شده است. کمی بعد دوباره امتحان کنید.",
  missing: "شماره موبایل و رمز لازم است.",
};

function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

export default async function AppLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; captcha?: string; phone?: string }>;
}) {
  if (await isAppAuthed()) redirect("/app");
  const params = await searchParams;
  const phoneHint = params.phone ?? "";
  const gate = phoneHint
    ? await getLoginGate(phoneHint)
    : { captchaRequired: false, locked: false, failCount: 0, lockedUntil: null };
  const needCaptcha =
    gate.captchaRequired || params.captcha === "1" || params.error === "captcha";
  const locked = gate.locked || params.error === "locked";
  const errorText =
    locked
      ? errorMessages.locked
      : params.error && errorMessages[params.error]
        ? errorMessages[params.error]
        : null;

  let captchaPrompt = "";
  let captchaToken = "";
  if (needCaptcha && !locked) {
    const challenge = createCaptchaChallenge();
    captchaPrompt = toPersianDigits(challenge.prompt);
    captchaToken = challenge.token;
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#13284f] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 55% at 15% 20%, rgba(255,255,255,0.14), transparent 55%), radial-gradient(ellipse 60% 45% at 90% 80%, rgba(91,122,180,0.28), transparent 50%), linear-gradient(160deg, #1a3571 0%, #0f2142 55%, #152b52 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-12 md:px-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-16">
        <div className="mb-12 lg:mb-0">
          <Link href="/" className="inline-flex items-center text-sm font-light text-white/80 transition-opacity hover:text-white">
            بازگشت به سایت
          </Link>

          <p className="mt-10 text-sm font-light text-white/65">
            {site.role}
            <span className="mx-2 text-white/35">/</span>
            دفتر کار خصوصی
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.35] tracking-tight md:text-5xl">
            {site.name}
          </h1>
          <p className="mt-6 max-w-md text-base font-light leading-8 text-white/78">
            ورود کارکنان دفتر. درخواست‌ها، پرونده‌ها، بایگانی و نامه‌ها اینجا می‌مانند.
          </p>

          <div className="mt-10 hidden lg:block">
            <Image
              src="/brand/mark-white.png"
              alt="نشان کانون وکلای دادگستری مرکز"
              width={475}
              height={634}
              className="h-auto w-36 opacity-90"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-md justify-self-end lg:max-w-none">
          <div className="rounded-[0.7rem] border border-white/15 bg-white/[0.07] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">ورود به دفتر</h2>
                <p className="mt-2 text-sm font-light leading-7 text-white/70">
                  فقط حساب‌های ساخته‌شده توسط دفتر. ثبت‌نام عمومی نیست.
                </p>
              </div>
              <Image
                src="/brand/emblem-white.png"
                alt=""
                width={120}
                height={113}
                className="h-12 w-auto opacity-80 lg:hidden"
              />
            </div>

            {!process.env.DATABASE_URL ? (
              <p className="mt-6 rounded-[0.4rem] border border-amber-200/30 bg-amber-100/10 px-4 py-3 text-sm leading-7 text-amber-50">
                متغیر DATABASE_URL هنوز روی سرور تنظیم نشده است.
              </p>
            ) : null}

            <form action={loginApp} className="mt-8 space-y-5">
              <label className="block" htmlFor="phone">
                <span className="mb-2 block text-sm font-bold">موبایل</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="username"
                  defaultValue={phoneHint}
                  dir="ltr"
                  inputMode="tel"
                  className="ltr-isolate w-full rounded-[0.4rem] border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/55"
                  placeholder="0912…"
                />
              </label>

              <label className="block" htmlFor="password">
                <span className="mb-2 block text-sm font-bold">رمز ورود</span>
                <PasswordField
                  required
                  className="ltr-isolate w-full rounded-[0.4rem] border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/55"
                />
              </label>

              {needCaptcha && !locked ? (
                <div className="rounded-[0.4rem] border border-white/20 bg-black/15 p-4">
                  <p className="text-xs font-light text-white/65">
                    برای ادامه، حاصل جمع را بنویسید.
                  </p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="min-w-[6.5rem] pb-3 text-2xl font-extrabold tracking-wide ltr-isolate" dir="ltr">
                      {captchaPrompt} =
                    </p>
                    <label className="block flex-1" htmlFor="captcha">
                      <span className="sr-only">پاسخ جمع امنیتی</span>
                      <input type="hidden" name="captchaToken" value={captchaToken} />
                      <input
                        id="captcha"
                        name="captcha"
                        type="text"
                        inputMode="numeric"
                        required
                        autoComplete="off"
                        dir="ltr"
                        className="ltr-isolate w-full rounded-[0.4rem] border border-white/25 bg-white/10 px-4 py-3 text-lg font-bold text-white outline-none placeholder:text-white/35 focus:border-white/55"
                        placeholder="؟"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {errorText ? (
                <p
                  role="alert"
                  className="rounded-[0.4rem] border border-rose-200/25 bg-rose-400/10 px-4 py-3 text-sm leading-7 text-rose-50"
                >
                  {errorText}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={locked}
                className="btn w-full bg-white px-5 py-3.5 text-sm font-bold text-navy transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {locked ? "ورود موقتاً بسته است" : "ورود به دفتر"}
              </button>
            </form>

            <p className="mt-6 text-xs font-light leading-6 text-white/55">
              بعد از سه ورود ناموفق، جمع امنیتی فعال می‌شود. حساب تازه فقط از داخل پنل ساخته می‌شود.
            </p>
          </div>

          <p className="mt-6 text-center text-xs font-light text-white/45 md:text-start">
            {site.bar} · پروانه {site.license}
          </p>
        </div>
      </div>
    </div>
  );
}
