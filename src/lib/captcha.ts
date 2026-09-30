import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { toEnglishDigits } from "@/lib/format";

export const CAPTCHA_COOKIE = "app_captcha";

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "aminalinezhad-captcha";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function sameText(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type CaptchaChallenge = {
  left: number;
  right: number;
  prompt: string;
  token: string;
};

/** Simple sum captcha, e.g. 1+2 or 3+1 */
export function createCaptchaChallenge(): CaptchaChallenge {
  const left = 1 + Math.floor(Math.random() * 9);
  const right = 1 + Math.floor(Math.random() * 9);
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${left}+${right}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  return {
    left,
    right,
    prompt: `${left} + ${right}`,
    token,
  };
}

export function verifyCaptchaAnswer(token: string, answerRaw: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expr, expRaw, sig] = parts;
  if (!sameText(sig, sign(`${expr}.${expRaw}`))) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const [leftRaw, rightRaw] = expr.split("+");
  const left = Number(leftRaw);
  const right = Number(rightRaw);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const answer = Number(toEnglishDigits(answerRaw).trim());
  if (!Number.isFinite(answer)) return false;
  return answer === left + right;
}

export async function setCaptchaCookie(token: string) {
  const jar = await cookies();
  jar.set(CAPTCHA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function clearCaptchaCookie() {
  const jar = await cookies();
  jar.delete(CAPTCHA_COOKIE);
}

export async function readCaptchaCookie() {
  const jar = await cookies();
  return jar.get(CAPTCHA_COOKIE)?.value ?? "";
}
