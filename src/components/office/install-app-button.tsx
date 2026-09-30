"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppButton({
  className = "",
  tipPlacement = "above",
}: {
  className?: string;
  tipPlacement?: "above" | "below";
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
      setShowIosTip(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const canPrompt = Boolean(deferred);
  const ios = isIos();
  if (!canPrompt && !ios) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (ios) setShowIosTip((open) => !open);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={install}
        className="block w-full transition-opacity hover:opacity-90"
        aria-label="ذخیره Progressive Web App"
        aria-expanded={showIosTip || undefined}
      >
        <Image
          src="/icons/pwa-badge.png"
          alt="Progressive Web App"
          width={320}
          height={96}
          className="h-auto w-full max-w-[8.5rem]"
          priority={false}
        />
      </button>
      {showIosTip ? (
        <div
          role="dialog"
          aria-label="راهنمای ذخیره اپ"
          className={`absolute start-0 z-40 w-64 border border-white/20 bg-white p-4 text-start shadow-[0_18px_40px_rgba(26,53,113,0.28)] ${
            tipPlacement === "above" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]"
          }`}
        >
          <p className="text-sm font-bold text-navy">ذخیره روی صفحه اصلی</p>
          <ol className="mt-3 list-decimal space-y-2 pr-4 text-xs font-light leading-6 text-secondary">
            <li>دکمه Share را در Safari بزنید.</li>
            <li>گزینه Add to Home Screen را انتخاب کنید.</li>
            <li>Add را تأیید کنید.</li>
          </ol>
          <button
            type="button"
            className="mt-3 text-xs font-bold text-navy"
            onClick={() => setShowIosTip(false)}
          >
            بستن
          </button>
        </div>
      ) : null}
    </div>
  );
}
