"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AD_COOLDOWN_MS = 3 * 60 * 1000;
const WAIT_INTERVAL_MS = 250;
const MAX_WAIT_ATTEMPTS = 30;

declare global {
  interface Window {
    show?: () => Promise<void>;
    __adLastShownAt?: number;
  }
}

const waitForShowFunction = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window is undefined"));
      return;
    }

    if (window.show) {
      resolve();
      return;
    }

    let attempts = 0;
    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
      attempts += 1;

      if (window.show) {
        clearInterval(intervalId);
        resolve();
        return;
      }

      if (attempts % 4 === 0) {
        console.log(
          `Ad not ready yet, attempt ${attempts}/${MAX_WAIT_ATTEMPTS}`
        );
      }

      if (attempts >= MAX_WAIT_ATTEMPTS) {
        clearInterval(intervalId);
        console.warn("Ad not available after multiple attempts");
        reject(new Error("Ad not available after multiple attempts"));
      }
    }, WAIT_INTERVAL_MS);
  });

export function useAdController() {
  const [isAdShowing, setIsAdShowing] = useState(false);
  const inFlightPromiseRef = useRef<Promise<boolean> | null>(null);
  const isPlayingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateAdVisibility = useCallback((visible: boolean) => {
    if (isMountedRef.current) {
      setIsAdShowing(visible);
    }
  }, []);

  const playAdInternal = useCallback(async () => {
    if (typeof window === "undefined") {
      return false;
    }

    const now = Date.now();
    const lastShownAt = window.__adLastShownAt ?? 0;
    const sinceLastShow = now - lastShownAt;

    if (sinceLastShow < AD_COOLDOWN_MS) {
      const remaining = AD_COOLDOWN_MS - sinceLastShow;
      console.log(
        `[Ads] Cooldown active: ${Math.ceil(remaining / 1000)}s remaining`
      );
      return false;
    }

    if (!window.show) {
      try {
        await waitForShowFunction();
      } catch (error) {
        console.warn("Ad not available after waiting:", error);
        return false;
      }
    }

    if (!window.show || isPlayingRef.current) {
      return false;
    }

    isPlayingRef.current = true;
    updateAdVisibility(true);

    try {
      console.log("Starting ad playback");
      await window.show();
      window.__adLastShownAt = Date.now();
      console.log("Ad completed successfully");
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string; stack?: string; name?: string };
      const errorMessage =
        error?.message || (typeof err === "string" ? err : String(err));
      console.error("Ad error:", {
        message: errorMessage,
        error: err,
        stack: error?.stack,
        name: error?.name,
      });
      return false;
    } finally {
      updateAdVisibility(false);
      isPlayingRef.current = false;
    }
  }, [updateAdVisibility]);

  const requestAd = useCallback(async () => {
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const promise = playAdInternal();
    inFlightPromiseRef.current = promise;

    promise.finally(() => {
      inFlightPromiseRef.current = null;
    });

    return promise;
  }, [playAdInternal]);

  return {
    isAdShowing,
    requestAd,
  } as const;
}
