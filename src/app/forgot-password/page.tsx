"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    checkLockoutStatus();
  }, [email]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLocked && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, remainingTime]);

  const checkLockoutStatus = () => {
    if (!email) return;

    const lockoutKey = `forgot_password_lockout_${email}`;
    const attemptsKey = `forgot_password_attempts_${email}`;
    
    const lockoutData = localStorage.getItem(lockoutKey);
    
    if (lockoutData) {
      const { lockedUntil } = JSON.parse(lockoutData);
      const now = Date.now();
      
      if (now < lockedUntil) {
        setIsLocked(true);
        setRemainingTime(lockedUntil - now);
      } else {
        localStorage.removeItem(lockoutKey);
        localStorage.removeItem(attemptsKey);
        setIsLocked(false);
        setRemainingTime(0);
      }
    }
  };

  const recordFailedAttempt = () => {
    const attemptsKey = `forgot_password_attempts_${email}`;
    const lockoutKey = `forgot_password_lockout_${email}`;
    
    let attempts = 0;
    const attemptsData = localStorage.getItem(attemptsKey);
    
    if (attemptsData) {
      const { count } = JSON.parse(attemptsData);
      attempts = count + 1;
      
      localStorage.setItem(attemptsKey, JSON.stringify({
        count: attempts,
        firstAttempt: Date.now()
      }));
    } else {
      attempts = 1;
      localStorage.setItem(attemptsKey, JSON.stringify({
        count: 1,
        firstAttempt: Date.now()
      }));
    }

    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(lockoutKey, JSON.stringify({
        lockedUntil,
        attempts
      }));
      
      setIsLocked(true);
      setRemainingTime(LOCKOUT_DURATION);
      localStorage.removeItem(attemptsKey);
      
      return true;
    }

    return false;
  };

  const clearAttempts = () => {
    const attemptsKey = `forgot_password_attempts_${email}`;
    const lockoutKey = `forgot_password_lockout_${email}`;
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lockoutKey);
  };

  const getRemainingAttempts = () => {
    const attemptsKey = `forgot_password_attempts_${email}`;
    const attemptsData = localStorage.getItem(attemptsKey);
    
    if (attemptsData) {
      const { count } = JSON.parse(attemptsData);
      return MAX_ATTEMPTS - count;
    }
    
    return MAX_ATTEMPTS;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Too many attempts. Please try again in ${formatTime(remainingTime)}`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const isNowLocked = recordFailedAttempt();
        
        if (isNowLocked) {
          throw new Error(`Too many failed attempts. Your account has been temporarily locked for 10 minutes.`);
        } else {
          const remaining = getRemainingAttempts();
          throw new Error(data.error || `Failed to send OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }
      }

      // Success - clear attempts and store OTP expiry
      clearAttempts();
      
      const otpExpiry = Date.now() + OTP_EXPIRY;
      localStorage.setItem(`otp_expiry_${email}`, otpExpiry.toString());
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you an OTP to reset your password
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isLocked && (
                <Alert variant="destructive" className="bg-red-50 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">
                    Too many failed attempts. Please try again in {formatTime(remainingTime)}.
                  </AlertDescription>
                </Alert>
              )}

              {error && !isLocked && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    OTP sent successfully! Redirecting to verification page...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success || isLocked}
                  className="h-11"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || success || isLocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : isLocked ? (
                  `Locked (${formatTime(remainingTime)})`
                ) : (
                  "Send OTP"
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Remember your password?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}