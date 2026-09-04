import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, MailCheck, ScanLine } from "lucide-react";
import { resendVerificationEmailApi, verifyEmailApi } from "../../api/user.api";
import { AuthContext } from "../../context/user.context";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const verify = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");
    setIsLoading(true);

    try {
      const data = await verifyEmailApi({ email: email.trim(), otp });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Could not verify your email.");
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    if (cooldownSeconds > 0 || isResending || !email) return;
    setErrorMessage("");
    setMessage("");
    setIsResending(true);
    try {
      const data = await resendVerificationEmailApi(email.trim());
      setMessage(data.message || "A new verification code has been sent.");
      setCooldownSeconds(60);
    } catch (error) {
      setErrorMessage(error.message || "Could not resend the code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 sm:grid sm:place-items-center">
      <div className="w-full max-w-md border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5" aria-label="ResumeIQ home"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 text-slate-950"><ScanLine size={19} /></span><span className="text-lg font-semibold">Resume<span className="text-emerald-600">IQ</span></span></button>
        <span className="mt-9 grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700"><MailCheck size={22} /></span>
        <h1 className="mt-5 text-2xl font-semibold">Verify your email</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">We sent a 6-digit code to your email. Enter it below to activate your ResumeIQ account.</p>
        <form className="mt-7 space-y-5" onSubmit={verify}>
          <label className="block text-sm font-medium text-slate-700">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="block text-sm font-medium text-slate-700">Verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="123456" className="mt-2 h-11 w-full border border-slate-300 px-3 text-center text-lg tracking-[0.35em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
          {errorMessage && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{errorMessage}</p>}
          {message && <p className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{message}</p>}
          <button disabled={isLoading} className="flex h-11 w-full items-center justify-center gap-2 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{isLoading ? "Verifying..." : <>Verify and continue <ArrowRight size={17} /></>}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Did not receive a code? <button type="button" disabled={isResending || cooldownSeconds > 0 || !email} onClick={resend} className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50">{isResending ? "Sending..." : cooldownSeconds > 0 ? `Resend code (${cooldownSeconds}s)` : "Resend code"}</button></p>
      </div>
    </div>
  );
};

export default VerifyEmail;
