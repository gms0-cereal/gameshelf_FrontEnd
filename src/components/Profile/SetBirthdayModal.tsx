import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";


const PANEL =
  "gap-6 rounded-2xl border-0 bg-[#373646] p-7 " +
  "text-[#e0deeb] shadow-none ring-1 ring-inset ring-[#55516c]";

const FIELD =
  "border-[#55516c] bg-[#29263b] text-[#e0deeb] " +
  "placeholder:text-[#8f899f] focus-visible:ring-[#8870b6]";

const LABEL = "text-sm font-medium text-[#c2ade7]";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function SetBirthdayPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [birthMonth, setBirthMonth] = useState<string>("1");
  const [birthDay, setBirthDay] = useState<string>("1");
  const [birthYear, setBirthYear] = useState<string>("2000");

  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // Self-contained age calculation function
  function handleCalculateAge() {
    setError("");
    const m = parseInt(birthMonth, 10);
    const d = parseInt(birthDay, 10);
    const y = parseInt(birthYear, 10);

    if (!m || !d || !y || isNaN(m) || isNaN(d) || isNaN(y)) {
      setError("Please select a valid birth date.");
      setCalculatedAge(null);
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() + 1 - m;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
      age--;
    }

    if (age < 4) {
        setError("You must be at least 4 years old.");
        setCalculatedAge(null);
        return;
    }

    if (age > 100) {
        setError("Please enter a valid birth year (maximum age is 100).");
        setCalculatedAge(null);
        return;
    }

    setCalculatedAge(age);
  }

  async function handleConfirmAndSave() {
    if (calculatedAge === null) {
      setError("Please calculate your age first before saving.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("age", String(calculatedAge));

      await api.patch("/users/me/", payload);
      await refreshUser();
      navigate("/profile/edit");
    } catch (err) {
      setError("Failed to save age. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#201e2f] text-[#e0deeb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 md:px-8">
          <div className="w-full max-w-xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Button
                asChild
                variant="outline"
                className="h-10 gap-2 border-[#55516c] bg-[#373646] text-[#e0deeb] hover:bg-[#454256]"
              >
                <Link to="/profile/edit">
                  <ArrowLeft size={16} />
                  Back to Edit Profile
                </Link>
              </Button>
            </div>

            <Card className={PANEL}>
              <div className="flex items-center gap-3 border-b border-[#55516c] pb-4">
                <Calendar className="size-6 text-[#c2ade7]" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Set Your Birthday</h1>
                  <p className="text-xs text-[#b4aec7] mt-0.5">
                    Your exact birthday will never be shown publicly—only your calculated age tag.
                  </p>
                </div>
              </div>

              {user?.age && (
                <div className="rounded-xl border border-[#8870b6] bg-[#29263b] p-4 text-xs text-[#c2ade7]">
                  Current age on profile: <strong>{user.age} years old</strong>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {/* Month Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL}>Month</label>
                  <select
                    className={`h-11 rounded-md border px-3 text-sm ${FIELD}`}
                    value={birthMonth}
                    onChange={(e) => {
                      setBirthMonth(e.target.value);
                      setCalculatedAge(null);
                    }}
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL}>Day</label>
                  <select
                    className={`h-11 rounded-md border px-3 text-sm ${FIELD}`}
                    value={birthDay}
                    onChange={(e) => {
                      setBirthDay(e.target.value);
                      setCalculatedAge(null);
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Input */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL}>Year</label>
                  <Input
                    type="number"
                    placeholder="YYYY"
                    min={1920}
                    max={new Date().getFullYear()}
                    className={FIELD}
                    value={birthYear}
                    onChange={(e) => {
                      setBirthYear(e.target.value);
                      setCalculatedAge(null);
                    }}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleCalculateAge}
                  className="mt-2 h-11 bg-[#55516c] hover:bg-[#666180] text-white font-semibold"
                >
                  Calculate Age
                </Button>
              </div>

              {/* Age Output / Confirmation Card */}
              {calculatedAge !== null && (
                <div className="flex flex-col gap-3 rounded-xl border border-green-500/40 bg-green-950/20 p-4 animate-in fade-in-0">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle2 className="size-5" />
                    <span className="text-sm font-semibold">
                      Calculated Age: {calculatedAge} years old
                    </span>
                  </div>
                  <p className="text-xs text-[#b4aec7]">
                    Click confirm below to update your profile age tag.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-300">{error}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#55516c]">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-[#55516c] bg-transparent text-[#b4aec7] hover:text-white"
                >
                  <Link to="/profile/edit">Cancel</Link>
                </Button>

                <Button
                  type="button"
                  disabled={calculatedAge === null || saving}
                  onClick={handleConfirmAndSave}
                  className="h-11 bg-[#8870b6] hover:bg-[#76609f] text-white font-semibold px-6"
                >
                  {saving ? "Saving..." : "Confirm & Save Age"}
                </Button>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}