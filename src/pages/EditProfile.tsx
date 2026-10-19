
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Save, UserRound } from "lucide-react";
import ImageCropDialog from "@/components/ImageCropDialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const PANEL =
  "gap-6 rounded-2xl border-0 bg-[#373646] p-7 " +
  "text-[#e0deeb] shadow-none ring-1 ring-inset ring-[#55516c]";

const FIELD =
  "border-[#55516c] bg-[#29263b] text-[#e0deeb] " +
  "placeholder:text-[#8f899f] focus-visible:ring-[#8870b6]";

const LABEL = "text-sm font-medium text-[#c2ade7]";

const OUTLINE_BUTTON =
  "h-11 gap-2 rounded-lg border border-[#55516c] " +
  "bg-[#373646] px-5 text-sm font-semibold text-[#e0deeb] " +
  "hover:bg-[#454256] hover:text-[#e0deeb]";

type ProfileForm = {
  nickname: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  library_visibility: string;
  friends_visibility: string;
};

export default function EditProfile() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileForm>({
    nickname: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    library_visibility: "public",
    friends_visibility: "public",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const [avatarUpload, setAvatarUpload] = useState<File | null>(null);
  const [bannerUpload, setBannerUpload] = useState<File | null>(null);

  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    setForm({
      nickname: user.nickname ?? "",
      bio: user.bio ?? "",
      avatar_url: user.avatar_url ?? "",
      banner_url: user.banner_url ?? "",
      library_visibility: user.library_visibility ?? "public",
      friends_visibility: user.friends_visibility ?? "public",
    });

     setAvatarPreview(user.avatar_url ?? "");
     setBannerPreview(user.banner_url ?? "");
  }, [user]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }
  function startCrop(target: "avatar" | "banner", file?: File) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please choose an image file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setError("Image must be 10 MB or smaller.");
    return;
  }

  setError("");
  setCropTarget(target);
  setCropSource(file);
}

function handleCroppedImage(blob: Blob) {
    if (!cropTarget) return;

    const file = new File(
      [blob],
      `${cropTarget}-${Date.now()}.jpg`,
      { type: "image/jpeg" },
    );

    const preview = URL.createObjectURL(file);

    if (cropTarget === "avatar") {
      setAvatarUpload(file);
      setAvatarPreview((previous) => {
        if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
        return preview;
      });
    } else {
      setBannerUpload(file);
      setBannerPreview((previous) => {
        if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
        return preview;
      });
    }

    setCropSource(null);
    setCropTarget(null);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
        const payload = new FormData();

        payload.append("nickname", form.nickname.trim());
        payload.append("bio", form.bio);
        payload.append("library_visibility", form.library_visibility);
        payload.append("friends_visibility", form.friends_visibility);

        if (avatarUpload) {
          payload.append("avatar_file", avatarUpload);
        }

        if (bannerUpload) {
          payload.append("banner_file", bannerUpload);
        }

       const response = await api.patch("/users/me/", payload);

      await api.patch("/users/me/", payload);
      await refreshUser();
      navigate("/profile");
      } catch (err: any) {
        const data = err?.response?.data;

        setError(
          typeof data === "object" && data !== null
            ? Object.entries(data)
                .map(([key, value]) => {
                  const message = Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);

                  return `${key}: ${message}`;
                })
                .join(" | ")
            : "Couldn't save your profile. Please try again.",
        );
      } finally {
        setSaving(false);
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#201e2f] p-8 text-[#e0deeb]">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#201e2f] p-8 text-[#e0deeb]">
        <p>You need to log in to edit your profile.</p>
        <Link
          to="/login"
          className="mt-4 inline-block text-[#c2ade7]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#201e2f] text-[#e0deeb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-[#b4aec7]">
                PLAYER SETTINGS
              </p>

              <h1 className="text-3xl font-semibold">
                Edit Profile
              </h1>

              <p className="mt-2 text-sm text-[#b4aec7]">
                Customize how other players see you.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className={OUTLINE_BUTTON}
            >
              <Link to="/profile">
                <ArrowLeft size={18} />
                Back to Profile
              </Link>
            </Button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-7"
          >
            <Card className={PANEL}>
              <h2 className="text-xl font-semibold">
                Public profile
              </h2>

              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="size-24 shrink-0 overflow-hidden border-2 border-[#8870b6] bg-[#4d3e68] after:hidden">
                  <AvatarImage
                    src={form.avatar_url || undefined}
                    alt={user?.nickname || user?.username || "Player"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-[#4d3e68]">
                    <Gamepad2 className="size-11 text-[#c2ade7]" strokeWidth={1.7} />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-semibold">
                    {form.nickname || user.username}
                  </p>

                  <p className="text-sm text-[#b4aec7]">
                    @{user.username}
                  </p>

                  <p className="mt-1 text-xs text-[#8f899f]">
                    Preview of your profile avatar
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="nickname">
                  Display name
                </label>

                <Input
                  id="nickname"
                  className={FIELD}
                  maxLength={50}
                  placeholder={user.username}
                  value={form.nickname}
                  onChange={(event) =>
                    updateField("nickname", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="bio">
                  Bio
                </label>

                <Textarea
                  id="bio"
                  className={`${FIELD} min-h-28`}
                  maxLength={300}
                  placeholder="Tell other players a little about yourself..."
                  value={form.bio}
                  onChange={(event) =>
                    updateField("bio", event.target.value)
                  }
                />

                <p className="text-right text-xs text-[#8f899f]">
                  {form.bio.length}/300
                </p>
              </div>

              <div className="flex flex-col gap-2">
                  <label className={LABEL}>Avatar image</label>

                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[#8870b6] px-4 text-sm font-semibold text-white hover:bg-[#76609f]"
                    >
                      Choose avatar
                    </label>

                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        startCrop("avatar", event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />

                    <span className="text-xs text-[#b4aec7]">
                      JPG, PNG, or WebP · Max 10 MB
                    </span>
                  </div>

                  <p className="text-xs text-[#8f899f]">
                    Select an image to reposition and crop it.
                  </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className={LABEL}>Profile banner</label>

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="banner-upload"
                    className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[#8870b6] px-4 text-sm font-semibold text-white hover:bg-[#76609f]"
                  >
                    Choose banner
                  </label>

                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      startCrop("banner", event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>

                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="mt-2 h-32 w-full rounded-xl border border-[#55516c] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <p className="text-xs text-[#8f899f]">
                  Choose a wide image and adjust which part is visible.
                </p>
              </div>
            </Card>

            <Card className={PANEL}>
              <h2 className="text-xl font-semibold">
                Privacy settings
              </h2>

              <p className="text-sm text-[#b4aec7]">
                Choose who can see your library and friends.
              </p>

              <div className="flex flex-col gap-2">
                <label
                  className={LABEL}
                  htmlFor="library_visibility"
                >
                  Game library visibility
                </label>

                <select
                  id="library_visibility"
                  className={`h-11 rounded-md border px-3 text-sm ${FIELD}`}
                  value={form.library_visibility}
                  onChange={(event) =>
                    updateField(
                      "library_visibility",
                      event.target.value,
                    )
                  }
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className={LABEL}
                  htmlFor="friends_visibility"
                >
                  Friends list visibility
                </label>

                <select
                  id="friends_visibility"
                  className={`h-11 rounded-md border px-3 text-sm ${FIELD}`}
                  value={form.friends_visibility}
                  onChange={(event) =>
                    updateField(
                      "friends_visibility",
                      event.target.value,
                    )
                  }
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </Card>

            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                asChild
                type="button"
                variant="outline"
                className={OUTLINE_BUTTON}
              >
                <Link to="/profile">Cancel</Link>
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="h-11 gap-2 rounded-lg bg-[#8870b6] px-5 font-semibold text-white hover:bg-[#76609f]"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </main>

        <Footer />
      </div>
      {cropSource && cropTarget && (
        <ImageCropDialog
          file={cropSource}
          mode={cropTarget}
          onCancel={() => {
            setCropSource(null);
            setCropTarget(null);
          }}
          onComplete={handleCroppedImage}
        />
      )}
    </div >
  );
}
