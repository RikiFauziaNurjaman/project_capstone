import { Form, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

function NeonboxBrandMark({ className = 'size-5' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="2.5"
                y="5.5"
                width="31"
                height="25"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="2"
            />
            <rect
                x="6.5"
                y="9.5"
                width="23"
                height="17"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity="0.45"
            />
            <path
                d="M11 22V14L17 22V14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
            />
            <path
                d="M21 14H25M21 18H24.5M21 22H25M21 14V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            <rect x="28" y="3" width="4" height="4" rx="0.5" fill="#F59E0B" />
        </svg>
    );
}

export default function Login({ status, canResetPassword }: Props) {
    const { name } = usePage().props;
    const brandName = name && name !== 'Laravel' ? name : 'Inventory Neonbox';

    return (
        <>
            <Head title="Masuk Sistem" />

            <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#F7F8FA] px-4 py-4 text-foreground dark:bg-zinc-950">
                {/* Soft tonal upper band */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[42%] border-b border-slate-200/80 bg-[#EAEFF5] dark:border-zinc-800 dark:bg-zinc-900/70"
                    aria-hidden="true"
                />

                <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-4">
                    {/* Brand Header */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-white shadow-xs dark:border-zinc-700 dark:bg-zinc-900">
                            <NeonboxBrandMark className="size-5" />
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                                {brandName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-zinc-400">
                                Sistem Stok &amp; Produksi Neonbox
                            </p>
                        </div>
                    </div>

                    {/* Centered Minimalist Card */}
                    <Card className="gap-4 border-slate-200/90 bg-white py-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <CardHeader className="border-b border-border/80 pb-4">
                            <CardTitle className="text-lg tracking-tight">
                                Masuk ke Akun
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Gunakan email dan kata sandi karyawan yang
                                terdaftar.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {status && (
                                <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-3.5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email">
                                                Alamat Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="nama@perusahaan.co.id"
                                                className="h-9"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">
                                                    Kata Sandi
                                                </Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                                        tabIndex={5}
                                                    >
                                                        Lupa kata sandi?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Masukkan kata sandi"
                                                className="h-9"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2.5 pt-0.5">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label
                                                htmlFor="remember"
                                                className="cursor-pointer text-sm font-normal text-muted-foreground"
                                            >
                                                Ingat sesi saya
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-1 h-9 w-full cursor-pointer bg-slate-900 font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            Masuk
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>

                        <CardFooter className="justify-center border-t border-border/80 pt-4 text-center text-xs text-muted-foreground">
                            Akses khusus karyawan. Hubungi admin untuk kendala
                            akun.
                        </CardFooter>
                    </Card>

                    <p className="text-center text-xs text-slate-500 dark:text-zinc-500">
                        &copy; {new Date().getFullYear()} {brandName}
                    </p>
                </div>
            </div>
        </>
    );
}
