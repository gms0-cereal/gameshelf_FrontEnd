import { useEffect, useRef, useState } from "react";
import SliderCaptcha, { type SliderPayload } from "./SliderCaptcha";
// ^ use "../captcha/SliderCaptcha" if that is the path that worked for you

export type CaptchaPayload =
  | { captcha_type: "recaptcha"; captcha_token: string }
  | SliderPayload;

export const MAX_SLIDER_FAILS = 3;

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => number;
    };
  }
}

// Load Google's script once for the whole app
let recaptchaPromise: Promise<void> | null = null;

function loadRecaptcha(): Promise<void> {
  if (recaptchaPromise) return recaptchaPromise;

  recaptchaPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha?.render) {
      resolve();
      return;
    }
    (window as unknown as Record<string, unknown>).__onRecaptchaLoad = () => resolve();

    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      recaptchaPromise = null; // allow a retry later
      reject(new Error("Failed to load Google reCAPTCHA"));
    };
    document.head.appendChild(script);
  });

  return recaptchaPromise;
}

function RecaptchaBox({ onChange }: { onChange: (p: CaptchaPayload | null) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [error, setError] = useState("");
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) {
      setError(
        "reCAPTCHA site key is missing. Add VITE_RECAPTCHA_SITE_KEY to your frontend .env and restart npm run dev."
      );
      return;
    }

    let cancelled = false;

    loadRecaptcha()
      .then(() => {
        if (cancelled || rendered.current || !boxRef.current || !window.grecaptcha) return;
        try {
          window.grecaptcha.render(boxRef.current, {
            sitekey: siteKey,
            theme: "dark",
            callback: (token: string) =>
              onChange({ captcha_type: "recaptcha", captcha_token: token }),
            "expired-callback": () => onChange(null),
            "error-callback": () => onChange(null),
          });
          rendered.current = true;
        } catch {
          setError("Unable to show Google reCAPTCHA. Refresh the page and try again.");
        }
      })
      .catch(() => {
        setError("Unable to load Google reCAPTCHA. Check your internet connection and refresh.");
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey, onChange]);

  if (error) return <p className="text-[11px] text-red-400">{error}</p>;
  return <div ref={boxRef} />;
}

type Props = {
  onChange: (payload: CaptchaPayload | null) => void;
  fails: number; // failed slider attempts so far (kept by the parent page)
  onFail: () => void; // tells the parent to add 1 to the fail count
};

export default function Captcha({ onChange, fails, onFail }: Props) {
  // 3 failed slider attempts: switch to Google reCAPTCHA
  if (fails >= MAX_SLIDER_FAILS) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-red-400">
          Too many failed attempts. Please verify with Google reCAPTCHA.
        </p>
        <RecaptchaBox onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <SliderCaptcha onChange={onChange} onFail={onFail} />
      {fails > 0 && (
        <p className="text-[11px] text-[#A0A0A8]">
          {MAX_SLIDER_FAILS - fails} attempt{MAX_SLIDER_FAILS - fails === 1 ? "" : "s"} left
          before extra verification.
        </p>
      )}
    </div>
  );
}