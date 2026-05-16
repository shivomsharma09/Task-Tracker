import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRegisterMutation } from '../store/slices/authApiSlice';
import { setCredentials } from '../store/slices/authSlice';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  role: z.enum(['QL', 'QR', 'Tasker'], { required_error: 'Select a role' }),
  reviewerEmail: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ROLES = [
  {
    value: 'QL',
    short: 'QL',
    label: 'Quality Lead',
    desc: 'Full platform control — create projects, assign tasks, manage the whole team',
    color: 'border-violet-500 bg-violet-500/10 text-violet-400',
    icon: '👑'
  },
  {
    value: 'QR',
    short: 'QR',
    label: 'Quality Reviewer',
    desc: 'Review Tasker submissions and monitor team quality',
    color: 'border-blue-500 bg-blue-500/10 text-blue-400',
    icon: '🔍'
  },
  {
    value: 'Tasker',
    short: 'T',
    label: 'Tasker',
    desc: 'Work on assigned tasks and submit your completed work',
    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    icon: '✅'
  },
];

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'Tasker' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data;
      // Only send reviewerEmail for Taskers
      if (payload.role !== 'Tasker') delete payload.reviewerEmail;
      const res = await registerUser(payload).unwrap();
      dispatch(setCredentials(res));
      toast.success('Welcome to TaskFlow Pro! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-2xl w-full">
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-3">
          <span className="text-primary font-bold text-lg">TF</span>
        </div>
        <h1 className="text-2xl font-bold">Create Your Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Select your role to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Role Selector ── */}
        <div>
          <label className="block text-sm font-semibold mb-2">Your Role</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setValue('role', r.value, { shouldValidate: true })}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  selectedRole === r.value
                    ? r.color + ' shadow-md scale-[1.03]'
                    : 'border-border bg-muted/20 hover:border-muted-foreground'
                }`}
              >
                <div className="text-lg mb-0.5">{r.icon}</div>
                <div className="font-bold text-xs">{r.short}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{r.label}</div>
              </button>
            ))}
          </div>
          {errors.role && <p className="text-destructive text-xs mt-1">{errors.role.message}</p>}
          {selectedRole && (
            <p className="text-xs text-muted-foreground mt-2 px-1 leading-relaxed">
              {ROLES.find(r => r.value === selectedRole)?.desc}
            </p>
          )}
          <input type="hidden" {...register('role')} />
        </div>

        {/* ── Tasker: QR Email ── */}
        {selectedRole === 'Tasker' && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <label className="block text-sm font-semibold mb-1">
              Your QR Reviewer's Email <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              If you have a Quality Reviewer, enter their email to link your account. They'll be able to monitor your work.
            </p>
            <input
              {...register('reviewerEmail')}
              type="email"
              className="w-full h-10 px-3 rounded-lg border border-emerald-500/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="reviewer@company.com"
            />
            {errors.reviewerEmail && (
              <p className="text-destructive text-xs mt-1">{errors.reviewerEmail.message}</p>
            )}
          </div>
        )}

        {/* ── Name + Email ── */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              {...register('name')}
              type="text"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="you@company.com"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* ── Passwords ── */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Confirm</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-1"
        >
          {isLoading ? 'Creating account...' : 'Create Account →'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
