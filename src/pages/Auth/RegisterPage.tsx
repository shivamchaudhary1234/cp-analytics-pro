import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Code2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const { data: authData, error } = await signUp(data.email, data.password, data.name);
    
    if (error) {
      setLoading(false);
      toast.error(error);
      return;
    }

    // If Supabase is configured for auto-confirm, we might have a session
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        name: data.name,
      });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    setLoading(false);
    toast.success('Account created! Please check your email to confirm if required.');
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #7B2FBE, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-cyan-purple flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <Code2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">CP Analytics Pro</h1>
          <p className="text-text-secondary text-sm mt-2">Join thousands of competitive programmers</p>
        </div>

        <div className="glass-card p-8 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary">Create account</h2>
            <p className="text-text-secondary text-sm mt-1">Start tracking your progress today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              icon={<User size={16} />}
              error={errors.name?.message}
              id="register-name"
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              id="register-email"
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              id="register-password"
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              id="register-confirm"
              {...register('confirmPassword')}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading} id="register-submit">
              <span>Create Account</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-accent-cyan hover:underline font-medium" id="go-login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
