"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Shield, Loader2, AlertCircle } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000;  
const OTP_EXPIRY = 60 * 1000;  

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [otpExpiryTime, setOtpExpiryTime] = useState(0);
  const [otpTimeRemaining, setOtpTimeRemaining] = useState(0);

useEffect(() => {
  if (!email) {
    router.push("/forgot-password");
    return;
  }
 
  localStorage.removeItem(`otp_expiry_${email}`);
  localStorage.removeItem(`otp_verify_attempts_${email}`);
  localStorage.removeItem(`otp_verify_lockout_${email}`);
 
  const otpExpiry = Date.now() + OTP_EXPIRY;
  localStorage.setItem(`otp_expiry_${email}`, otpExpiry.toString());
  setOtpExpiryTime(otpExpiry);
  setOtpTimeRemaining(OTP_EXPIRY);

  checkLockoutStatus();
}, [email, router]);


  // Lockout countdown
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

  // OTP expiry countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (otpExpiryTime > 0) {
      interval = setInterval(() => {
        const remaining = otpExpiryTime - Date.now();
        if (remaining <= 0) {
          setOtpTimeRemaining(0);
          setError("OTP has expired. Please request a new one.");
        } else {
          setOtpTimeRemaining(remaining);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpExpiryTime]);

  const checkOtpExpiry = () => {
    const expiryKey = `otp_expiry_${email}`;
    const expiry = localStorage.getItem(expiryKey);
    
    if (expiry) {
      const expiryTime = parseInt(expiry);
      const now = Date.now();
      
      if (now < expiryTime) {
        setOtpExpiryTime(expiryTime);
        setOtpTimeRemaining(expiryTime - now);
      } else {
        setError("OTP has expired. Please request a new one.");
        localStorage.removeItem(expiryKey);
      }
    }
  };

  const checkLockoutStatus = () => {
    if (!email) return;

    const lockoutKey = `otp_verify_lockout_${email}`;
    const attemptsKey = `otp_verify_attempts_${email}`;
    
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
    const attemptsKey = `otp_verify_attempts_${email}`;
    const lockoutKey = `otp_verify_lockout_${email}`;
    
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
    const attemptsKey = `otp_verify_attempts_${email}`;
    const lockoutKey = `otp_verify_lockout_${email}`;
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lockoutKey);
  };

  const getRemainingAttempts = () => {
    const attemptsKey = `otp_verify_attempts_${email}`;
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

    if (otpTimeRemaining <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        const isNowLocked = recordFailedAttempt();
        
        if (isNowLocked) {
          throw new Error("Too many failed attempts. Your verification has been temporarily locked for 10 minutes.");
        } else {
          const remaining = getRemainingAttempts();
          throw new Error(data.error || `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }
      }

      // Success - clear all attempts and expiry data
      clearAttempts();
      localStorage.removeItem(`otp_expiry_${email}`);
      
      router.push(`/reset-password?token=${data.resetToken}`);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (isLocked) {
      setError(`Too many attempts. Please try again in ${formatTime(remainingTime)}`);
      return;
    }

    setError("");
    setResending(true);

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
        throw new Error(data.error || "Failed to resend OTP");
      }

      // Reset OTP expiry
      const otpExpiry = Date.now() + OTP_EXPIRY;
      localStorage.setItem(`otp_expiry_${email}`, otpExpiry.toString());
      setOtpExpiryTime(otpExpiry);
      setOtpTimeRemaining(OTP_EXPIRY);
      
      // Clear failed attempts on successful resend
      clearAttempts();
      
      setOtp("");
      alert("OTP resent successfully! Please check your email.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/forgot-password"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {email}
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

              {otpTimeRemaining > 0 && !isLocked && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    OTP expires in: {formatTime(otpTimeRemaining)}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  disabled={loading || isLocked || otpTimeRemaining <= 0}
                  className="h-11 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || otp.length !== 6 || isLocked || otpTimeRemaining <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : isLocked ? (
                  `Locked (${formatTime(remainingTime)})`
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending || isLocked}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPForm />
    </Suspense>
  );
}