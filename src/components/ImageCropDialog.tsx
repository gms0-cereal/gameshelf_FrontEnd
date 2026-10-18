
import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { createImage } from "./cropImage";

type ImageCropDialogProps = {
  file: File;
  mode: "avatar" | "banner";
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
};

export default function ImageCropDialog({
  file,
  mode,
  onCancel,
  onComplete,
}: ImageCropDialogProps) {
  const imageUrl = useMemo(
    () => URL.createObjectURL(file),
    [file],
  );

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAvatar = mode === "avatar";

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  async function handleCrop() {
    if (!croppedArea) return;

    setSaving(true);
    setError("");

    try {
      const image = await createImage(imageUrl);
      const canvas = document.createElement("canvas");

      canvas.width = isAvatar ? 512 : 1600;
      canvas.height = isAvatar ? 512 : 500;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create image canvas.");

      context.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Could not crop this image."));
          },
          "image/jpeg",
          0.92,
        );
      });

      onComplete(blob);
    } catch {
      setError("Couldn't crop this image. Try another file.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#55516c] bg-[#29263b] p-5 text-[#e0deeb] shadow-2xl">
        <h2 id="crop-dialog-title" className="text-xl font-semibold">
          Adjust {isAvatar ? "avatar" : "banner"}
        </h2>

        <p className="mt-1 text-sm text-[#b4aec7]">
          Drag the image to reposition it and use the slider to zoom.
        </p>

        <div
          className={`relative mt-5 w-full overflow-hidden rounded-xl bg-black ${
            isAvatar ? "aspect-square max-h-[55vh]" : "aspect-[16/7]"
          }`}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={isAvatar ? 1 : 16 / 5}
            cropShape={isAvatar ? "round" : "rect"}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedArea(pixels)}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <label htmlFor="crop-zoom" className="text-sm font-medium">
            Zoom: {zoom.toFixed(1)}×
          </label>

          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-[#a78bfa]"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-[#55516c] px-4 py-2 hover:bg-[#454256] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCrop}
            disabled={saving || !croppedArea}
            className="rounded-lg bg-[#8870b6] px-4 py-2 font-semibold text-white hover:bg-[#76609f] disabled:opacity-50"
          >
            {saving ? "Processing..." : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
