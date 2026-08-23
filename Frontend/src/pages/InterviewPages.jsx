import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Camera,
  Mic,
  Maximize2,
  Check,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { getCareerProfiles, getInterviewReportsApi } from "../api/user.api";
import { useUser } from "../context/user.context";

const InterviewPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useUser();

  const queryParams = new URLSearchParams(location.search);
  const requestedReportId = queryParams.get("reportId") || "";

  const [auiodGranted, setaudiodGranted] = useState(false);
  const [CameraGranted, setCameraGranted] = useState(false);
  const [fullscreenGranted, setfullscreenGranted] = useState(false);
  const [error, seterror] = useState("");
  const [profile, setProfile] = useState(location.state?.profile || null);
  const profileId = location.state?.profileId || profile?._id;

  useEffect(() => {
    const loadProfile = async () => {
      if (profileId || !token) return;

      if (requestedReportId) {
        try {
          const repRes = await getInterviewReportsApi(token);
          if (repRes.success && repRes.reports?.length) {
            const foundReport = repRes.reports.find((r) => r._id === requestedReportId);
            if (foundReport?.careerProfile) {
              setProfile(foundReport.careerProfile);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load report profile:", err);
        }
      }

      const res = await getCareerProfiles(token);
      if (res.success && res.careerProfiles?.length) {
        setProfile(res.careerProfiles[0]);
      }
    };

    loadProfile();
  }, [profileId, requestedReportId, token]);

  const handelCamera = async () => {
    try {
      seterror("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraGranted(true);
    } catch (err) {
      seterror("Allow camera to start Interview");
    }
  };

  const handelAudio = async () => {
    try {
      seterror("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      setaudiodGranted(true);
    } catch (err) {
      seterror("Allow voice to start Interview");
    }
  };

  const handelFullscreen = async () => {
    try {
      seterror("");
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setfullscreenGranted(true);
    } catch (err) {
      seterror("Allow fullscreen to start Interview");
    }
  };

  const allGranted = CameraGranted && auiodGranted && fullscreenGranted;

  const handleContinue = () => {
    if (!allGranted) {
      seterror("Complete all steps before starting the interview.");
      return;
    }

    const selectedProfileId = profileId || profile?._id;
    if (!selectedProfileId) {
      seterror("Create or select a career profile before starting the interview.");
      return;
    }

    navigate("/ai/interview/live", {
      state: {
        profileId: selectedProfileId,
        profile,
      },
    });
  };

  const steps = [
    {
      key: "camera",
      label: "Camera",
      done: CameraGranted,
      icon: Camera,
      description: "We need your webcam to observe your interview session.",
      action: handelCamera,
      buttonLabel: "Allow Camera",
    },
    {
      key: "audio",
      label: "Microphone",
      done: auiodGranted,
      icon: Mic,
      description: "We need your microphone to hear your responses.",
      action: handelAudio,
      buttonLabel: "Allow Microphone",
    },
    {
      key: "fullscreen",
      label: "Fullscreen",
      done: fullscreenGranted,
      icon: Maximize2,
      description: "The interview runs in fullscreen mode for focus.",
      action: handelFullscreen,
      buttonLabel: "Enter Fullscreen",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            Interview Setup
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Prepare Your Interview
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Complete each check below before your AI interview begins
            {profile?.targetRole || profile?.name ? ` for ${profile.targetRole || profile.name}` : ""}.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-emerald-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xl">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border ${
                  step.done
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      step.done
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-emerald-600 border-emerald-200"
                    }`}
                  >
                    {step.done ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900">{step.label}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{step.description}</p>
                  </div>
                </div>

                {!step.done && (
                  <button
                    type="button"
                    onClick={step.action}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] shadow-sm transition cursor-pointer shrink-0"
                  >
                    {step.buttonLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!allGranted}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allGranted ? (
            <>
              <ShieldCheck size={18} />
              <span>Start Interview</span>
              <ArrowRight size={18} />
            </>
          ) : (
            <span>Complete Setup to Continue</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default InterviewPages;
