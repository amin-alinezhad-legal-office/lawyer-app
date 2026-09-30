"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppButton({
  className = "btn border border-line px-3 py-2 text-xs font-bold",
  label = "ذخیره اپ",
}: {
  className?: string;
  label?: string;
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
    <div className="relative">
      <button type="button" onClick={install} className={className} aria-expanded={showIosTip || undefined}>
        {label}
      </button>
      {showIosTip ? (
        <div
          role="dialog"
          aria-label="راهنمای ذخیره اپ"
          className="absolute end-0 top-[calc(100%+0.5rem)] z-40 w-64 border border-line bg-white p-4 text-start shadow-[0_18px_40px_rgba(26,53,113,0.12)]"
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
