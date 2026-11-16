import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export type SliderPayload = {
  captcha_type: "slider";
  captcha_token: string;
  captcha_position: number;
  captcha_trail: [number, number][];
};

type Challenge = { token: string; target: number; track: number; handle: number };

type Props = {
  onChange: (payload: SliderPayload | null) => void;
  onFail?: () => void; // called every time the block is dropped in the wrong spot
};

export default function SliderCaptcha({ onChange, onFail }: Props) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [x, setX] = useState(0);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startTime = useRef(0);
  const trail = useRef<[number, number][]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setError(false);
    setDone(false);
    setWrong(false);
    setX(0);
    onChange(null);
    try {
      const { data } = await api.get<Challenge>("/captcha/slider/");
      if (mounted.current) setChallenge(data);
    } catch {
      if (mounted.current) setError(true);
    }
  }, [onChange]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <button type="button" onClick={load} className="text-sm text-red-400 underline">
        Unable to load captcha. Try again.
      </button>
    );
  }
  if (!challenge) return <p className="text-sm text-[#A0A0A8]">Loading captcha...</p>;

  const maxX = challenge.track - challenge.handle;

  const onPointerDown = (e: React.PointerEvent) => {
    if (done) return;
    dragging.current = true;
    startX.current = e.clientX - x;
    startTime.current = performance.now();
    trail.current = [];
    setWrong(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const next = Math.max(0, Math.min(maxX, e.clientX - startX.current));
    setX(next);
    if (trail.current.length < 200) {
      trail.current.push([Math.round(next), Math.round(performance.now() - startTime.current)]);
    }
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const position = Math.round(x);

    if (Math.abs(position - challenge.target) <= 6) {
      // Close enough: lock it in. The REAL check happens on the server at submit.
      setDone(true);
      onChange({
        captcha_type: "slider",
        captcha_token: challenge.token,
        captcha_position: position,
        captcha_trail: trail.current,
      });
    } else {
      // Wrong spot: this is a failed attempt.
      setWrong(true);
      setX(0);
      onFail?.();
      // Give the user a NEW challenge (new gap position) after a short pause.
      setTimeout(() => {
        if (mounted.current) load();
      }, 700);
    }
  };

  return (
    <div className="select-none">
      <div
        className="relative h-10 rounded-xl border border-[#302438] bg-[#000000]"
        style={{ width: challenge.track, maxWidth: "100%" }}
      >
        {/* the gap to fill */}
        <div
          className="absolute top-0 h-10 rounded-xl border-2 border-dashed border-[#554363]"
          style={{ left: challenge.target, width: challenge.handle }}
        />
        {/* the handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={`absolute top-0 flex h-10 cursor-grab touch-none items-center justify-center rounded-xl text-[#17191E] ${
            done ? "bg-green-400" : wrong ? "bg-red-400" : "bg-[#B39ACF]"
          }`}
          style={{ left: x, width: challenge.handle }}
        >
          {done ? "✓" : wrong ? "✕" : "→"}
        </div>
      </div>
      <p className={`mt-1 text-[11px] ${wrong ? "text-red-400" : "text-[#A0A0A8]"}`}>
        {done
          ? "Verified. You can continue."
          : wrong
            ? "Wrong spot. Loading a new challenge..."
            : "Drag the block into the dashed box."}
      </p>
    </div>
  );
}