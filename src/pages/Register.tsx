// ─── React & Router ───────────────────────────────────────────────────────────
import {
    useEffect,
    useState,
    type ChangeEvent,
    type ComponentProps,
    type FormEvent,
    type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ─── UI Components ────────────────────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
// ─── Icons ────────────────────────────────────────────────────────────────────
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

// ─── Services ───────────────────────────────────────────────────────────────
import { isAxiosError } from 'axios';
import { register } from '../services/authService';
import api from '../lib/api';

type FormValues = {
    username: string;
    email: string;
    password: string;
    confirm: string;
    terms: boolean;
};
type FormErrors = Partial<Record<keyof FormValues | 'form', string>>;

const EMPTY_FORM: FormValues = {
    username: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
};

const STORAGE_KEY_COVER_INDEX = 'gameshelf_signup_cover_idx';
const FALLBACK_COVERS = [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
];

const inputClass =
    'h-11 rounded-lg border-[#3f3a5c] bg-[#2a2641] pr-11 text-[13px] text-[#f2f0f9] placeholder:text-[#a39fba] focus-visible:border-[#9188dc] focus-visible:ring-[#9188dc]/30 aria-invalid:border-[#f2848d] aria-invalid:ring-[#f2848d]/20';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validate(v: FormValues): FormErrors {
    const e: FormErrors = {};
    const username = v.username.trim();
    const email = v.email.trim();

    if (!username) e.username = 'Enter a username.';
    else if (username.length > 20) e.username = 'Username cannot exceed 20 characters.';
    else if (!/^[\w.@+-]{3,20}$/.test(username))
        e.username = 'Use 3 to 20 letters, numbers or . @ + - _ with no spaces.';

    if (!email) e.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        e.email = 'Enter a valid email address.';

    if (!v.password) e.password = 'Enter a password.';
    else if (v.password.length < 8) e.password = 'Use at least 8 characters.';

    if (!v.confirm) e.confirm = 'Re-enter your password.';
    else if (v.confirm !== v.password) e.confirm = "Passwords don't match.";

    if (!v.terms) e.terms = 'Agree to the Terms and Privacy Policy to continue.';
    return e;
}

function fromApi(data: unknown): FormErrors {
    const out: FormErrors = {};
    if (data && typeof data === 'object') {
        for (const [key, msg] of Object.entries(data as Record<string, unknown>)) {
            const text = Array.isArray(msg) ? msg.join(' ') : String(msg);
            const field = key === 'non_field_errors' || key === 'detail' ? 'form' : key;
            out[field as keyof FormErrors] = text;
        }
    }
    if (Object.keys(out).length === 0) out.form = 'Something went wrong. Try again.';
    return out;
}

type FieldProps = Omit<ComponentProps<'input'>, 'id'> & {
    id: string;
    label: string;
    error?: string;
    trailing?: ReactNode;
};

function Field({ id, label, error, trailing, ...input }: FieldProps) {
    const errorId = `${id}-error`;
    return (
        <div className="mb-4">
            <label htmlFor={id} className="mb-2 block text-[11px] font-semibold">
                {label}
            </label>
            <div className="relative">
                <Input
                    id={id}
                    className={inputClass}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    {...input}
                />
                {trailing}
            </div>
            {error && (
                <p id={errorId} className="mt-1.5 text-xs text-[#f2848d]">
                    {error}
                </p>
            )}
        </div>
    );
}

const iconSlot =
    'absolute inset-y-0 right-0 grid w-11 place-items-center text-[#a39fba]';

function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
    const [shown, setShown] = useState(false);
    return (
        <Field
            {...props}
            type={shown ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setShown(s => !s)}
                    aria-label={shown ? 'Hide password' : 'Show password'}
                    aria-pressed={shown}
                    className={`${iconSlot} cursor-pointer rounded-lg hover:text-white focus-visible:outline-2 focus-visible:outline-[#9188dc]`}
                >
                    {shown ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
            }
        />
    );
}

function SignUp() {
    const navigate = useNavigate();

    const [values, setValues] = useState<FormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    // Dynamic Game Covers State
    const [heroCovers, setHeroCovers] = useState<string[]>(FALLBACK_COVERS);
    const [currentCover, setCurrentCover] = useState<string>(FALLBACK_COVERS[0]);

    useEffect(() => {
        async function fetchGameCovers() {
            try {
                const gameQueries = ['Silksong', 'Ultrakill', 'Ori', 'Nier', 'Counter-Strike', 'Castle Crashers'];
                const promises = gameQueries.map(async (query) => {
                    const { data } = await api.get('/games/', { params: { search: query, limit: 1 } });
                    const results = Array.isArray(data) ? data : (data as { results?: any[] }).results;
                    if (results && results.length > 0) {
                        return results[0].cover_image_url || results[0].background_image || null;
                    }
                    return null;
                });

                const fetchedImages = (await Promise.all(promises)).filter(Boolean) as string[];
                const coversToUse = fetchedImages.length > 0 ? fetchedImages : FALLBACK_COVERS;

                setHeroCovers(coversToUse);

                const storedIdx = localStorage.getItem(STORAGE_KEY_COVER_INDEX);
                const nextIdx = storedIdx ? (parseInt(storedIdx, 10) + 1) % coversToUse.length : 0;
                setCurrentCover(coversToUse[nextIdx]);
            } catch {
                setCurrentCover(FALLBACK_COVERS[0]);
            }
        }

        fetchGameCovers();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = e.target;
        setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setErrors(prev => {
            const next = { ...prev };
            delete next[name as keyof FormErrors];
            delete next.form;
            return next;
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const found = validate(values);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setStatus('submitting');
        try {
            await register({
                username: values.username.trim(),
                email: values.email.trim(),
                password: values.password,
            });

            // Rotate cover index forward upon successful registration sequence
            if (heroCovers.length > 0) {
                const storedIdx = localStorage.getItem(STORAGE_KEY_COVER_INDEX);
                const nextIdx = storedIdx ? (parseInt(storedIdx, 10) + 1) % heroCovers.length : 0;
                localStorage.setItem(STORAGE_KEY_COVER_INDEX, nextIdx.toString());
            }

            setStatus('success');
            return;
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                setErrors(fromApi(error.response.data));
            } else {
                toast.error("Can't reach the server. Check your connection and try again.");
            }
        }
        setStatus('idle');
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#1e1b2e] text-[#f2f0f9] antialiased">
            <Navbar />

            <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-14 lg:px-[52px] lg:py-[50px]">
                {/* ── Hero Panel with Dynamic Covers & Matched Sizing ── */}
                <section
                    aria-label="GameShelf Featured Artwork"
                    className="relative hidden min-h-[360px] overflow-hidden rounded-2xl bg-[#1d2b33] md:block md:h-full md:min-h-[550px] shadow-xl order-2 lg:order-1"
                >
                    <img
                        src={currentCover}
                        alt="Featured Game Artwork"
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1b1a2a]/95 via-[#1b1a2a]/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-8 z-10">
                        <p className="text-xs tracking-widest text-[#c9c6e0] font-semibold uppercase">
                            Your games. Your story.
                        </p>
                        <h2 className="mt-3 max-w-[320px] text-[32px] font-semibold leading-[1.1] text-[#ecebf7]">
                            A home for every adventure.
                        </h2>
                        <p className="mt-5 text-[13px] text-[#c9c6e0]">
                            Discover what&rsquo;s next. Keep the games you love close.
                        </p>
                    </div>
                </section>

                {/* ── Form ──────────────────────────────────────────────────── */}
                <section
                    aria-labelledby="signup-title"
                    className="order-1 w-full md:max-w-[473px] md:justify-self-end lg:order-2"
                >
                    {status === 'success' ? (
                        <div role="status">
                            <h1 id="signup-title" className="mb-2.5 text-[28px] font-semibold">
                                Account created
                            </h1>
                            <p className="mb-6 text-xs leading-normal text-[#a39fba]">
                                We sent a verification link to {values.email.trim()}. Open it to
                                finish setting up your account.
                            </p>
                            <Button
                                className="h-10 bg-[#b0464f] px-6 text-sm font-semibold text-white hover:bg-[#c25660]"
                                onClick={() => navigate('/login', { state: { username: values.username.trim() } })}
                            >
                                Go to Log In
                            </Button>
                        </div>
                    ) : (
                        <>
                            <h1 id="signup-title" className="mb-2.5 text-[28px] font-semibold">
                                Sign Up
                            </h1>
                            <p className="mb-6 text-xs leading-normal text-[#a39fba]">
                                Build your shelf. Find your people. Discover your next favorite.
                            </p>

                            <form noValidate onSubmit={handleSubmit}>
                                <Field
                                    id="signup-username"
                                    label="Username"
                                    name="username"
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    maxLength={20}
                                    value={values.username}
                                    onChange={handleChange}
                                    error={errors.username}
                                    trailing={
                                        <span className={`${iconSlot} pointer-events-none`}>
                                            <User className="size-4" aria-hidden="true" />
                                        </span>
                                    }
                                />
                                <Field
                                    id="signup-email"
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter email"
                                    autoComplete="email"
                                    value={values.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    trailing={
                                        <span className={`${iconSlot} pointer-events-none`}>
                                            <Mail className="size-4" aria-hidden="true" />
                                        </span>
                                    }
                                />
                                <PasswordField
                                    id="signup-password"
                                    label="Password"
                                    name="password"
                                    placeholder="Enter password"
                                    autoComplete="new-password"
                                    value={values.password}
                                    onChange={handleChange}
                                    error={errors.password}
                                />
                                <PasswordField
                                    id="signup-confirm"
                                    label="Confirm Password"
                                    name="confirm"
                                    placeholder="Enter password"
                                    autoComplete="new-password"
                                    value={values.confirm}
                                    onChange={handleChange}
                                    error={errors.confirm}
                                />

                                <div className="mb-5 mt-1 text-xs text-[#a39fba]">
                                    <label className="flex cursor-pointer items-center gap-2.5">
                                        <input
                                            type="checkbox"
                                            name="terms"
                                            checked={values.terms}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(errors.terms)}
                                            aria-describedby={
                                                errors.terms ? 'signup-terms-error' : undefined
                                            }
                                            className="size-4 accent-[#b0464f]"
                                        />
                                        <span>
                                            I agree to the{' '}
                                            <Link to="/terms" className="text-[#9188dc] hover:underline">
                                                Terms
                                            </Link>{' '}
                                            and{' '}
                                            <Link to="/privacy" className="text-[#9188dc] hover:underline">
                                                Privacy Policy
                                            </Link>
                                        </span>
                                    </label>
                                    {errors.terms && (
                                        <p id="signup-terms-error" className="mt-1.5 text-xs text-[#f2848d]">
                                            {errors.terms}
                                        </p>
                                    )}
                                </div>

                                {errors.form && (
                                    <p
                                        role="alert"
                                        className="mb-4 rounded-lg border border-[#f2848d] px-3 py-2.5 text-[13px] text-[#f2848d]"
                                    >
                                        {errors.form}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="h-10 bg-[#b0464f] px-6 text-sm font-semibold text-white hover:bg-[#c25660]"
                                >
                                    {status === 'submitting' ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </form>

                            <p className="mt-4 text-xs text-[#9188dc]">
                                Already have an account?{' '}
                                <Link to="/login" className="hover:underline">
                                    Log In
                                </Link>
                            </p>
                        </>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default SignUp;