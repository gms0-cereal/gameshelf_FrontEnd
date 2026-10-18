
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserRound } from "lucide-react";

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
  const { user, loading } = useAuth();
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
  }, [user]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await api.patch("/users/me/", {
        nickname: form.nickname.trim() || null,
        bio: form.bio,
        avatar_url: form.avatar_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        library_visibility: form.library_visibility,
        friends_visibility: form.friends_visibility,
      });

      navigate("/profile");
    } catch (err: any) {
      const data = err?.response?.data;

      setError(
        typeof data === "object" && data !== null
          ? Object.entries(data)
              .map(([key, value]) => {
                const message = Array.isArray(value)
                  ? value.join(", ")
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
                <Avatar className="size-20 rounded-2xl border border-[#8870b6]">
                  <AvatarImage
                    src={form.avatar_url || undefined}
                  />

                  <AvatarFallback className="rounded-2xl bg-[#4d3e68]">
                    <UserRound className="size-9 text-[#c2ade7]" />
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
                <label className={LABEL} htmlFor="avatar_url">
                  Avatar image URL
                </label>

                <Input
                  id="avatar_url"
                  type="url"
                  className={FIELD}
                  placeholder="https://example.com/avatar.png"
                  value={form.avatar_url}
                  onChange={(event) =>
                    updateField("avatar_url", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="banner_url">
                  Banner image URL
                </label>

                <Input
                  id="banner_url"
                  type="url"
                  className={FIELD}
                  placeholder="https://example.com/banner.png"
                  value={form.banner_url}
                  onChange={(event) =>
                    updateField("banner_url", event.target.value)
                  }
                />

                {form.banner_url && (
                  <img
                    src={form.banner_url}
                    alt="Banner preview"
                    className="mt-2 h-32 w-full rounded-xl border border-[#55516c] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
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
    </div>
  );
}
