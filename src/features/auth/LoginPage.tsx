import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, InfoIcon, LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { usePageTitle } from '@/components/page';
import { SkipLink } from '@/components/layout/AppLayout';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/api/client';

const schema = z.object({
  email: z.email('Enter your GIV email address, for example name@knust.edu.gh'),
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

export function LoginPage() {
  usePageTitle('Sign in');
  const { staff, login, signOutReason } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const { errors, isSubmitting } = form.formState;

  if (staff) return <Navigate to={from} replace />;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setFormError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  });

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <SkipLink />
      <main id="main" tabIndex={-1} className="flex flex-col gap-4 p-6 outline-none md:p-10">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-deep">
            <img src="/favicon.svg" alt="" className="size-5" />
          </span>
          <span>
            Ability Connect <span className="text-muted-foreground">· GIV Admin</span>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
                <p className="text-muted-foreground">For staff of the Gender Inclusion and Vulnerability Office.</p>
              </div>

              {signOutReason && !formError && (
                <Alert role="status">
                  <InfoIcon aria-hidden />
                  <AlertTitle>{signOutReason === 'expired' ? 'Your session ended' : 'You have signed out'}</AlertTitle>
                  <AlertDescription>
                    {signOutReason === 'expired'
                      ? 'For students’ privacy, sessions end after a while. Sign in again to continue.'
                      : 'Close this tab if you are on a shared computer.'}
                  </AlertDescription>
                </Alert>
              )}

              {formError && (
                <Alert variant="destructive" role="alert">
                  <AlertCircleIcon aria-hidden />
                  <AlertTitle>Couldn't sign you in</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <FieldGroup>
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...form.register('email')}
                  />
                  <FieldError id="email-error">{errors.email?.message}</FieldError>
                </Field>
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="pr-11"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...form.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-0.5 -translate-y-1/2"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
                      <span className="sr-only">Show password</span>
                    </Button>
                  </div>
                  <FieldError id="password-error">{errors.password?.message}</FieldError>
                </Field>
              </FieldGroup>

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Spinner aria-hidden /> : <LockIcon aria-hidden />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Forgotten your password? Ask the GIV admin to reset it.
              </p>
            </form>
          </div>
        </div>
      </main>

      <aside aria-label="About Ability Connect" className="relative hidden overflow-hidden bg-brand-deep lg:block">
        <img
          src="/media/seminar-group-photo-1280.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/60 to-brand-deep/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="max-w-md text-2xl font-semibold leading-snug">
            Every registration is a student asking to be supported.
          </p>
          <p className="mt-3 max-w-md text-white/85">
            Review needs, agree support plans and answer requests, with each student's consent respected.
          </p>
        </div>
      </aside>
    </div>
  );
}
