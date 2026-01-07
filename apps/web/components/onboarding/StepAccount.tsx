'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@kit/ui/utils';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
    shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

interface StepAccountProps {
    onContinue: (email: string, password: string) => void;
    isLoading?: boolean;
    defaultEmail?: string;
}

export function StepAccount({ onContinue, isLoading = false, defaultEmail = '' }: StepAccountProps) {
    const [email, setEmail] = useState(defaultEmail);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string): boolean => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const newErrors: typeof errors = {};

        // Validate email
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Validate password
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(password)) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }

        // Validate password confirmation
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onContinue(email.trim(), password);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-3 text-center" style={{ color: HORIZON.textPrimary }}>
                Create Your Account
            </h1>
            <p className="text-base mb-8 text-center" style={{ color: HORIZON.textSecondary }}>
                Set up your login credentials to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-5">
                {/* Email Field */}
                <div>
                    <label 
                        htmlFor="email" 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: HORIZON.textPrimary }}
                    >
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail 
                            size={18} 
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.textSecondary }}
                        />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                            }}
                            className={cn(
                                "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none",
                                errors.email 
                                    ? "border-red-300 focus:border-red-500" 
                                    : "border-slate-200 focus:border-indigo-500"
                            )}
                            style={{ 
                                backgroundColor: 'white',
                                color: HORIZON.textPrimary
                            }}
                            placeholder="your@email.com"
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label 
                        htmlFor="password" 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: HORIZON.textPrimary }}
                    >
                        Password
                    </label>
                    <div className="relative">
                        <Lock 
                            size={18} 
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.textSecondary }}
                        />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                            }}
                            className={cn(
                                "w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all outline-none",
                                errors.password 
                                    ? "border-red-300 focus:border-red-500" 
                                    : "border-slate-200 focus:border-indigo-500"
                            )}
                            style={{ 
                                backgroundColor: 'white',
                                color: HORIZON.textPrimary
                            }}
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.textSecondary }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1.5 text-xs" style={{ color: HORIZON.textSecondary }}>
                        Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: HORIZON.textPrimary }}
                    >
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock 
                            size={18} 
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.textSecondary }}
                        />
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                            }}
                            className={cn(
                                "w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all outline-none",
                                errors.confirmPassword 
                                    ? "border-red-300 focus:border-red-500" 
                                    : "border-slate-200 focus:border-indigo-500"
                            )}
                            style={{ 
                                backgroundColor: 'white',
                                color: HORIZON.textPrimary
                            }}
                            placeholder="Confirm your password"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.textSecondary }}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "w-full py-6 rounded-xl font-bold transition-all mt-6",
                        isLoading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"
                    )}
                    style={{
                        backgroundColor: HORIZON.primary,
                        boxShadow: isLoading ? 'none' : `0 15px 30px ${HORIZON.primary}30`,
                        color: 'white'
                    }}
                >
                    {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
                </Button>
            </form>
        </div>
    );
}





