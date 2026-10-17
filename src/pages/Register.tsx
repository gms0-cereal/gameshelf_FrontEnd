// ─── React & Router ───────────────────────────────────────────────────────────
import {
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

// ─── Types & constants ────────────────────────────────────────────────────────
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

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');
const REGISTER_URL = `${API_BASE}/api/v1/auth/register/`;
const HERO_IMAGE = '/signup-hero.jpg'; // put your artwork in /public

const inputClass =
    'h-11 rounded-lg border-[#3f3a5c] bg-[#2a2641] pr-11 text-[13px] text-[#f2f0f9] placeholder:text-[#a39fba] focus-visible:border-[#9188dc] focus-visible:ring-[#9188dc]/30 aria-invalid:border-[#f2848d] aria-invalid:ring-[#f2848d]/20';

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Client-side checks are for convenience only. The backend must validate again.
function validate(v: FormValues): FormErrors {
    const e: FormErrors = {};
    const username = v.username.trim();
    const email = v.email.trim();

    if (!username) e.username = 'Enter a username.';
    else if (!/^[\w.@+-]{3,150}$/.test(username))
        e.username = 'Use 3 or more letters, numbers or . @ + - _ with no spaces.';

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

// Turns a Django REST Framework error body ({ field: ["message"] }) into form errors.
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

// ─── Form fields (module level, so inputs keep focus while typing) ────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
function SignUp() {
    const navigate = useNavigate();

    const [values, setValues] = useState<FormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

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
            const res = await fetch(REGISTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // With session auth also add: credentials: 'include' and an X-CSRFToken header
                body: JSON.stringify({
                    username: values.username.trim(),
                    email: values.email.trim(),
                    password: values.password,
                }),
            });
            if (res.ok) {
                setStatus('success');
                return;
            }
            setErrors(fromApi(await res.json().catch(() => ({}))));
        } catch (error) {
            console.error('Failed to register:', error);
            toast.error("Can't reach the server. Check your connection and try again.");
        }
        setStatus('idle');
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen flex-col bg-[#1e1b2e] text-[#f2f0f9] antialiased">
            <Navbar />

            <main className="mx-auto grid w-full max-w-[1100px] flex-1 grid-cols-1 items-start gap-8 px-6 pb-14 pt-7 lg:grid-cols-2 lg:gap-14 lg:pt-10">
                {/* ── Hero ──────────────────────────────────────────────────── */}
                <aside className="relative order-2 flex min-h-60 items-end overflow-hidden rounded-2xl bg-[linear-gradient(to_bottom,#1f7a6c,#123f43_55%,#1b1a2c)] lg:order-1 lg:min-h-[440px]">
                    <img
                        src={HERO_IMAGE}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={e => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,18,32,0.88),rgba(20,18,32,0.35)_45%,transparent_70%)]" />
                    <div className="relative p-6">
                        <p className="mb-2 text-[11px] uppercase tracking-wider text-[#d9d6e8]">
                            Your games. Your story.
                        </p>
                        <h2 className="mb-2.5 max-w-[12ch] text-3xl font-semibold leading-tight">
                            A home for every adventure.
                        </h2>
                        <p className="text-xs text-[#d9d6e8]">
                            Discover what&rsquo;s next. Keep the games you love close.
                        </p>
                    </div>
                </aside>

                {/* ── Form ──────────────────────────────────────────────────── */}
                <section
                    aria-labelledby="signup-title"
                    className="order-1 w-full lg:order-2 lg:max-w-[400px]"
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
                                onClick={() => navigate('/login')}
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