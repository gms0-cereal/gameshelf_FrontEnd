import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Gamepad2,
  Save,
  Calendar,
  Globe,
  AlertCircle,
} from "lucide-react";

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

// GameShelf Color Palette
const PANEL =
  "gap-6 rounded-2xl border border-[#2B2D36] " +
  "bg-[#17191F] p-7 text-[#F2F0F7] shadow-none";

const FIELD =
  "border-[#343640] bg-[#202127] text-[#F2F0F7] " +
  "placeholder:text-[#858594] focus-visible:ring-[#B8A2DC]/50 " +
  "focus-visible:border-[#B8A2DC]";

const LABEL = "text-sm font-medium text-[#C2ADE7]";

const OUTLINE_BUTTON =
  "h-11 gap-2 rounded-lg border border-[#343640] " +
  "bg-[#202127] px-5 text-sm font-semibold text-[#E4E1EB] " +
  "hover:border-[#55515F] hover:bg-[#292A32] hover:text-white";

const PRIMARY_BUTTON =
  "bg-[#B8A2DC] text-[#17151C] hover:bg-[#C4B5E3]";

type ProfileForm = {
  nickname: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  gender: string;
  pronouns: string;
  friends_visibility: string;
  birth_day?: string;
  age?: number | null;
};

export default function EditProfile() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileForm>({
    nickname: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    gender: "",
    pronouns: "",
    friends_visibility: "public",
    birth_day: "",
    age: null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const [avatarUpload, setAvatarUpload] = useState<File | null>(null);
  const [bannerUpload, setBannerUpload] = useState<File | null>(null);

  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);

  // Steam Import
  const [steamUrl, setSteamUrl] = useState("");
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamMessage, setSteamMessage] = useState<string | null>(null);
  const [steamError, setSteamError] = useState<string | null>(null);

  // Birthday Modal
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState("");
  const [confirmBirthdayStep, setConfirmBirthdayStep] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      nickname: user.nickname ?? "",
      bio: user.bio ?? "",
      avatar_url: user.avatar_url ?? "",
      banner_url: user.banner_url ?? "",
      gender: user.gender ?? "",
      pronouns: user.pronouns ?? "",
      friends_visibility: user.friends_visibility ?? "public",
      birth_day: (user as any).birth_day ?? "",
      age: user.age ?? null,
    });

    setAvatarPreview(user.avatar_url ?? "");
    setBannerPreview(user.banner_url ?? "");
  }, [user]);

  function updateField(field: keyof ProfileForm, value: any) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageSelect(file: File, target: "avatar" | "banner") {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setError("");

    if (file.type === "image/gif") {
      const preview = URL.createObjectURL(file);

      if (target === "avatar") {
        setAvatarPreview(preview);
        setAvatarUpload(file);
      } else {
        setBannerPreview(preview);
        setBannerUpload(file);
      }

      return;
    }

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

  function calculateAge(dateString: string): number {
    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  function handleBirthdayConfirm() {
    if (!tempBirthDate) return;

    const calculated = calculateAge(tempBirthDate);

    updateField("birth_day", tempBirthDate);
    updateField("age", calculated);

    setShowBirthdayModal(false);
    setConfirmBirthdayStep(false);
    setTempBirthDate("");
  }

  async function handleSteamImport(e: FormEvent) {
    e.preventDefault();
    if (!steamUrl.trim()) return;

    setSteamLoading(true);
    setSteamError(null);
    setSteamMessage(null);

    try {
      const { data } = await api.post("/users/import-steam/", {
        profile_url: steamUrl,
      });

      setSteamMessage(
        data.detail || "Steam library and achievements imported successfully!",
      );

      setSteamUrl("");
      await refreshUser();
    } catch (err: any) {
      setSteamError(
        err.response?.data?.detail ||
        "Failed to import Steam library. Ensure your Steam profile and game details are set to Public.",
      );
    } finally {
      setSteamLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = new FormData();

      payload.append("nickname", form.nickname.trim());
      payload.append("bio", form.bio);
      payload.append("gender", form.gender);
      payload.append("pronouns", form.pronouns.trim());
      payload.append("friends_visibility", form.friends_visibility);

      if (form.birth_day) {
        payload.append("birth_day", form.birth_day);
      }

      if (form.age !== null && form.age !== undefined) {
        payload.append("age", String(form.age));
      }

      if (avatarUpload) {
        payload.append("avatar_file", avatarUpload);
      }

      if (bannerUpload) {
        payload.append("banner_file", bannerUpload);
      }

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
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-[#F2F0F7]">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#09090B] text-[#F2F0F7]">
        <p>You need to log in to edit your profile.</p>
        <Link to="/login" className="mt-2 text-[#B8A2DC] hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#09090B]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#09090B] text-[#F2F0F7] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium tracking-wider text-[#A694C7]">
                PLAYER SETTINGS
              </p>

              <h1 className="text-3xl font-semibold tracking-tight">
                Edit Profile
              </h1>

              <p className="mt-2 text-sm text-[#A7A2B5]">
                Customize how other players see you.
              </p>
            </div>

            <Button asChild variant="outline" className={OUTLINE_BUTTON}>
              <Link to="/profile">
                <ArrowLeft size={18} />
                Back to Profile
              </Link>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* Public Profile */}
            <Card className={PANEL}>
              <h2 className="text-xl font-semibold">Public profile</h2>

              {/* Avatar Preview */}
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="size-24 shrink-0 overflow-hidden border-2 border-[#343640] bg-[#202127] after:hidden">
                  <AvatarImage
                    src={avatarPreview || undefined}
                    alt={user?.nickname || user?.username || "Player"}
                    className="object-cover contrast-110 saturate-125"
                  />

                  <AvatarFallback className="bg-[#202127]">
                    <Gamepad2
                      className="size-11 text-[#38BDF8]"
                      strokeWidth={1.7}
                    />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-semibold">
                    {form.nickname || user.username}
                  </p>

                  <p className="text-sm text-[#A7A2B5]">
                    @{user.username}
                  </p>

                  <p className="mt-1 text-xs text-[#858594]">
                    Preview of your profile avatar
                  </p>
                </div>
              </div>

              {/* Display Name */}
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
                  onChange={(e) => updateField("nickname", e.target.value)}
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-3">
                <label className={LABEL}>Gender</label>

                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "", label: "Prefer not to say / Unspecified" },
                  ].map((option) => (
                    <label
                      key={option.label}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors ${
                        form.gender === option.value
                          ? "border-[#8F7BAB] bg-[#302B38] text-white"
                          : "border-[#343640] bg-[#202127] text-[#C6C2D0] hover:bg-[#292A32]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={form.gender === option.value}
                        onChange={(e) =>
                          updateField("gender", e.target.value)
                        }
                        className="accent-[#B8A2DC]"
                      />

                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pronouns */}
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="pronouns">
                  Pronouns
                </label>

                <Input
                  id="pronouns"
                  className={FIELD}
                  maxLength={50}
                  placeholder="e.g. they/them, she/her, he/him"
                  value={form.pronouns}
                  onChange={(e) => updateField("pronouns", e.target.value)}
                />
              </div>

              {/* Age & Birthday */}
              <div className="flex flex-col gap-3 rounded-xl border border-[#343640] bg-[#202127] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-[#B8A2DC]" />

                    <h3 className="text-sm font-semibold">
                      Age & Birthday
                    </h3>
                  </div>

                  {!form.birth_day && !(user as any)?.birth_day && (
                    <Button
                      type="button"
                      onClick={() => {
                        setTempBirthDate(form.birth_day || "");
                        setConfirmBirthdayStep(false);
                        setShowBirthdayModal(true);
                      }}
                      className={`h-9 px-4 text-xs ${PRIMARY_BUTTON}`}
                    >
                      Set Birthday
                    </Button>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-[#A7A2B5]">
                  {form.birth_day || (user as any)?.birth_day
                    ? `Current age: ${form.age ?? calculateAge(form.birth_day || (user as any).birth_day)} years old (exact birthday is kept private, locked 🔒)`
                    : "No birthday set. Click to select your birthday."}
                </p>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="bio">
                  Bio
                </label>

                <Textarea
                  id="bio"
                  className={`${FIELD} min-h-24 max-h-36 resize-y`}
                  maxLength={300}
                  placeholder="Tell other players a little about yourself..."
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                />

                <p className="text-right text-xs text-[#858594]">
                  {form.bio.length}/300
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col gap-2">
                <label className={LABEL}>Avatar image</label>

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="avatar-upload"
                    className={`inline-flex h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-semibold ${PRIMARY_BUTTON}`}
                  >
                    Choose avatar
                  </label>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file, "avatar");
                      e.target.value = "";
                    }}
                  />

                  <span className="text-xs text-[#A7A2B5]">
                    JPG, PNG, WebP, or GIF · Max 10 MB
                  </span>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="flex flex-col gap-2">
                <label className={LABEL}>Profile banner</label>

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="banner-upload"
                    className={`inline-flex h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-semibold ${PRIMARY_BUTTON}`}
                  >
                    Choose banner
                  </label>

                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file, "banner");
                      e.target.value = "";
                    }}
                  />
                </div>

                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    loading="lazy"
                    className="mt-2 h-32 w-full rounded-xl border border-[#343640] object-cover contrast-110 saturate-125"
                  />
                )}
              </div>
            </Card>

            {/* Steam Import */}
            <Card className={PANEL}>
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-[#38BDF8]" />

                <h2 className="text-xl font-semibold">
                  Import Steam Library
                </h2>
              </div>

              <p className="text-sm leading-relaxed text-[#A7A2B5]">
                Paste your Steam profile URL or 17-digit SteamID64 (e.g.{" "}
                <code className="text-[#B8A2DC]">
                  https://steamcommunity.com/profiles/76562229554903814/
                </code>
                ) to sync your owned games. Your Steam profile and game details
                must be set to <strong className="text-[#E4E1EB]">Public</strong>.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="text"
                  placeholder="https://steamcommunity.com/profiles/..."
                  value={steamUrl}
                  onChange={(e) => setSteamUrl(e.target.value)}
                  className={`flex-1 ${FIELD}`}
                />

                <Button
                  type="button"
                  disabled={steamLoading || !steamUrl.trim()}
                  onClick={handleSteamImport}
                  className={`h-11 ${PRIMARY_BUTTON}`}
                >
                  {steamLoading ? "Syncing Steam..." : "Sync Steam Library"}
                </Button>
              </div>

              {steamLoading && (
                <p className="animate-pulse text-xs text-[#38BDF8]">
                  ⏳ Syncing Steam library and achievements... This may take up
                  to a minute for large public libraries. Please keep this page
                  open.
                </p>
              )}

              {steamMessage && (
                <p className="text-sm text-[#34D399]">{steamMessage}</p>
              )}

              {steamError && (
                <p className="text-sm text-[#FF8A7A]">{steamError}</p>
              )}
            </Card>

            {/* Privacy Settings */}
            <Card className={PANEL}>
              <h2 className="text-xl font-semibold">Privacy settings</h2>

              <p className="text-sm text-[#A7A2B5]">
                Choose who can see your friends list.
              </p>

              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="friends_visibility">
                  Friends list visibility
                </label>

                <select
                  id="friends_visibility"
                  className={`h-11 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#B8A2DC] ${FIELD}`}
                  value={form.friends_visibility}
                  onChange={(e) =>
                    updateField("friends_visibility", e.target.value)
                  }
                >
                  <option value="public" className="bg-[#202127]">
                    Public
                  </option>

                  <option value="private" className="bg-[#202127]">
                    Private
                  </option>
                </select>
              </div>
            </Card>

            {/* Error */}
            {error && (
              <p role="alert" className="text-sm text-[#FF8A7A]">
                {error}
              </p>
            )}

            {/* Form Actions */}
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
                className={`h-11 gap-2 rounded-lg px-5 font-semibold ${PRIMARY_BUTTON}`}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </main>

        <Footer />
      </div>

      {/* Birthday Modal */}
      {showBirthdayModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm fade-in-0"
          onClick={() => setShowBirthdayModal(false)}
        >
          <div
            className="w-full max-w-md animate-in rounded-2xl border border-[#343640] bg-[#202127] p-6 text-[#F2F0F7] shadow-2xl zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              {confirmBirthdayStep
                ? "Confirm Your Birthday"
                : "Set Your Birthday"}
            </h3>

            {user?.birth_day ? (
              <div className="mt-4 flex flex-col gap-4">
                <p className="text-sm text-[#A7A2B5]">
                  Your birthday has already been set and cannot be changed.
                  If you need assistance, please contact support.
                </p>

                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowBirthdayModal(false)}
                    className={PRIMARY_BUTTON}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : !confirmBirthdayStep ? (
              <div className="mt-4 flex flex-col gap-4">
                <p className="text-xs leading-relaxed text-[#A7A2B5]">
                  Select your date of birth using the calendar below. Your
                  exact birthday remains private, and your age is calculated
                  automatically. Note: This can only be set once.
                </p>

                <div className="flex flex-col gap-2">
                  <label className={LABEL}>Date of Birth</label>

                  <input
                    type="date"
                    value={tempBirthDate}
                    max={new Date(Date.now() - 86400000)
                      .toISOString()
                      .split("T")[0]}
                    onChange={(e) => setTempBirthDate(e.target.value)}
                    className="h-11 rounded-lg border border-[#343640] bg-[#17191F] px-3 text-sm text-[#F2F0F7] outline-none focus:border-[#B8A2DC]"
                  />
                </div>

                {tempBirthDate && calculateAge(tempBirthDate) < 5 && (
                  <p className="text-xs text-[#FF8A7A]">
                    You must be at least 5 years old to set a birthday.
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBirthdayModal(false)}
                    className={OUTLINE_BUTTON}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    disabled={
                      !tempBirthDate || calculateAge(tempBirthDate) < 5
                    }
                    onClick={() => setConfirmBirthdayStep(true)}
                    className={PRIMARY_BUTTON}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-xl border border-[#8F7BAB]/40 bg-[#302B38]/50 p-4">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#B8A2DC]" />

                  <div className="text-sm">
                    <p className="font-medium text-white">
                      Are you sure this is your correct birthday?
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#FF8A7A]">
                      ⚠️ Note: This can only be set once and cannot be changed
                      later.
                    </p>

                    <p className="mt-1 text-xs text-[#A7A2B5]">
                      Selected Date:{" "}
                      <strong className="text-white">{tempBirthDate}</strong>
                    </p>

                    <p className="mt-0.5 text-xs text-[#A7A2B5]">
                      Calculated Age:{" "}
                      <strong className="text-white">
                        {calculateAge(tempBirthDate)} years old
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmBirthdayStep(false)}
                    className={OUTLINE_BUTTON}
                  >
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleBirthdayConfirm}
                    className={PRIMARY_BUTTON}
                  >
                    Confirm & Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Crop Dialog */}
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
    </div>
  );
}