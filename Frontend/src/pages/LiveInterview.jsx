import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Mic,
} from "lucide-react";
import {
  getCareerProfiles,
  getMockInterviewAudioUrl,
  startMockInterviewApi,
  submitMockInterviewAnswerApi,
} from "../api/user.api";
import { useUser } from "../context/user.context";

const SILENCE_MS = 2400;
const MIN_RECORDING_MS = 1800;
const MAX_ANSWER_MS = 120000;
const NO_SPEECH_RETRY_MS = 45000;
const VOICE_THRESHOLD = 0.035;

// Illustrated placeholder avatar for the AI interviewer (not a real person's photo).
const INTERVIEWER_AVATAR_URL =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ira&backgroundColor=b6e3f4&top=longHairStraight2,longHairCurly&facialHairProbability=0";

const formatElapsed = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const LiveInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useUser();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceFrameRef = useRef(null);
  const submittingRef = useRef(false);
  const sessionRef = useRef(null);
  const currentQuestionRef = useRef(null);

  const [profile, setProfile] = useState(location.state?.profile || null);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [interviewPhase, setInterviewPhase] = useState("asking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const profileId = location.state?.profileId || profile?._id;
  const answeredCount = transcript.filter((turn) => turn.answer).length;
  const totalQuestions = currentQuestion?.totalQuestions || finalResult?.totalQuestions || 6;
  const progress = useMemo(() => {
    if (completed) return 100;
    if (!currentQuestion?.totalQuestions) return 0;
    return Math.round(
      ((currentQuestion.questionNumber || 1) / currentQuestion.totalQuestions) * 100
    );
  }, [completed, currentQuestion]);

  const averageScore = finalResult?.averageScore ?? null;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // Session clock shown in the candidate tile, mirroring the reference layout.
  useEffect(() => {
    if (completed) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [completed]);

  const stopMicCapture = () => {
    if (silenceFrameRef.current) {
      cancelAnimationFrame(silenceFrameRef.current);
      silenceFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError("Camera preview is unavailable.");
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      stopMicCapture();
    };
  }, []);

  useEffect(() => {
    const startInterview = async () => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        let selectedProfileId = profileId;
        let selectedProfile = profile;

        if (!selectedProfileId) {
          const profileRes = await getCareerProfiles(token);
          if (profileRes.success && profileRes.careerProfiles?.length) {
            selectedProfile = profileRes.careerProfiles[0];
            selectedProfileId = selectedProfile._id;
            setProfile(selectedProfile);
          }
        }

        if (!selectedProfileId) {
          setError("Create a career profile before starting an interview.");
          setLoading(false);
          return;
        }

        const res = await startMockInterviewApi(
          {
            profileId: selectedProfileId,
            totalQuestions: 6,
          },
          token
        );

        if (!res.success || !res.data) {
          setError(res.message || "Failed to start interview.");
          setLoading(false);
          return;
        }

        const startedSession = {
          id: res.data.mockInterviewSessionId || res.data.sessionId,
          profileId: res.data.profileId || selectedProfileId,
        };

        setSession(startedSession);
        setCurrentQuestion(res.data);
        setInterviewPhase("asking");
      } catch (err) {
        setError("Failed to communicate with backend service.");
      } finally {
        setLoading(false);
      }
    };

    startInterview();
  }, [token]);

  const submitRecordedAnswer = async (audioBlob) => {
    const activeSession = sessionRef.current;
    const activeQuestion = currentQuestionRef.current;
    if (!token || !activeSession?.id || !activeQuestion?.mockInterviewId || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setInterviewPhase("processing");
    setError("");

    try {
      const formData = new FormData();
      formData.append("mockInterviewSessionId", activeSession.id);
      formData.append("mockInterviewId", activeQuestion.mockInterviewId);
      formData.append("profileId", activeSession.profileId || profileId);
      formData.append("question", activeQuestion.text);
      formData.append("audioAnswer", audioBlob, "interview-answer.webm");

      const res = await submitMockInterviewAnswerApi(formData, token);

      if (!res.success) {
        setError(res.message || "Failed to submit your answer.");
        setInterviewPhase("listening");
        return;
      }

      const updatedTranscript = res.interview?.transcript || [
        ...transcript,
        {
          question: res.question,
          answer: res.answer,
        },
      ];

      setTranscript(updatedTranscript);

      if (res.interview?.isComplete || res.interview?.status === "completed") {
        const result = res.interview?.finalResult || res.finalResult;
        setFinalResult(result);
        setCompleted(true);
        setCurrentQuestion(null);
        setInterviewPhase("completed");
      } else if (res.interview?.nextQuestion) {
        setCurrentQuestion({
          ...res.interview.nextQuestion,
          mockInterviewSessionId: activeSession.id,
          totalQuestions: res.interview.totalQuestions,
        });
        setInterviewPhase("asking");
      }
    } catch (err) {
      setError("Failed to communicate with backend service.");
      setInterviewPhase("listening");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const startAutoRecording = async () => {
    if (completed || submittingRef.current || !currentQuestionRef.current) return;

    try {
      setError("");
      stopMicCapture();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const data = new Uint8Array(analyser.fftSize);
      const voiceState = {
        hasVoice: false,
      };

      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stopMicCapture();
        setIsRecording(false);

        if (voiceState.hasVoice && blob.size > 1000) {
          submitRecordedAnswer(blob);
          return;
        }

        setInterviewPhase("listening");
        setError("I could not detect an answer yet.");
        window.setTimeout(() => {
          if (!completed && !submittingRef.current) {
            startAutoRecording();
          }
        }, 900);
      };

      const startedAt = Date.now();
      let lastVoiceAt = Date.now();

      const detectSilence = () => {
        analyser.getByteTimeDomainData(data);

        let sumSquares = 0;
        for (let index = 0; index < data.length; index += 1) {
          const normalized = (data[index] - 128) / 128;
          sumSquares += normalized * normalized;
        }

        const rms = Math.sqrt(sumSquares / data.length);
        const now = Date.now();

        if (rms > VOICE_THRESHOLD) {
          voiceState.hasVoice = true;
          lastVoiceAt = now;
        }

        const recordingDuration = now - startedAt;
        const silentFor = now - lastVoiceAt;

        if (
          voiceState.hasVoice &&
          recordingDuration > MIN_RECORDING_MS &&
          silentFor > SILENCE_MS &&
          recorder.state === "recording"
        ) {
          recorder.stop();
          return;
        }

        if (
          (!voiceState.hasVoice && recordingDuration > NO_SPEECH_RETRY_MS) ||
          recordingDuration > MAX_ANSWER_MS
        ) {
          if (recorder.state === "recording") {
            recorder.stop();
          }
          return;
        }

        silenceFrameRef.current = requestAnimationFrame(detectSilence);
      };

      recorder.start(250);
      setIsRecording(true);
      setInterviewPhase("listening");
      silenceFrameRef.current = requestAnimationFrame(detectSilence);
    } catch (err) {
      setError("Allow microphone access before starting the interview.");
      setInterviewPhase("asking");
    }
  };

  useEffect(() => {
    if (!currentQuestion?.audioUrl || !audioRef.current) return;
    setInterviewPhase("asking");
    audioRef.current.load();
    audioRef.current.play().catch(() => {
      setInterviewPhase("asking");
    });
  }, [currentQuestion?.audioUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-white flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
          <div>
            <h1 className="text-lg font-bold">Preparing AI interviewer</h1>
            <p className="text-sm text-slate-400">Generating your first profile-based question.</p>
          </div>
        </div>
      </div>
    );
  }

  const interviewerSpeaking = interviewPhase === "asking";
  const candidateSpeaking = interviewPhase === "listening";

  return (
    <div className="h-screen w-screen bg-[#0d0f13] text-slate-100 overflow-hidden flex flex-col font-sans">
      {/* Top bar */}
      <header className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft size={17} />
          </button>
          <h1 className="text-sm font-semibold truncate">
            {profile?.targetRole || profile?.name || "AI Interview"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 w-40">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <LogOut size={13} />
            Exit
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-100 text-xs flex items-center gap-2 shrink-0">
          <AlertTriangle size={14} className="text-rose-300 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {completed ? (
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="text-center space-y-3">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold">Interview complete</h2>
              <p className="text-sm text-slate-400">
                {finalResult?.totalQuestions || answeredCount} questions · average score{" "}
                {averageScore ?? "-"}/10
              </p>
            </div>

            <div className="space-y-2.5">
              {(finalResult?.transcript || transcript).map((turn, index) => (
                <div key={`${turn.question}-${index}`} className="p-3.5 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-xs text-slate-400">Question {index + 1}</p>
                    {Number.isFinite(Number(turn.score)) && (
                      <span className="text-xs font-semibold text-emerald-300">{turn.score}/10</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{turn.question}</p>
                  <p className="text-sm text-slate-400 mt-1">{turn.answer}</p>
                  {turn.feedback && (
                    <p className="text-xs text-slate-500 mt-2 border-t border-white/10 pt-2">
                      {turn.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 gap-4">
          {/* Video stage: interviewer (left, larger) and candidate (right) side by side, like a call UI */}
          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-3 sm:gap-4">
            {/* Interviewer tile */}
            <div
              className={`relative rounded-2xl overflow-hidden bg-[#161a20] border-2 transition-colors duration-300 flex items-center justify-center ${
                interviewerSpeaking ? "border-sky-400" : "border-white/10"
              }`}
            >
              <div
                className={`w-32 h-32 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 transition-all duration-300 ${
                  interviewerSpeaking ? "ring-sky-400/70" : "ring-white/10"
                }`}
              >
                <img
                  src={INTERVIEWER_AVATAR_URL}
                  alt="AI interviewer avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="absolute bottom-3 left-3 text-[11px] font-medium bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md">
                Interviewer (IRA)
              </span>

              {interviewerSpeaking && (
                <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Speaking
                </span>
              )}
            </div>

            {/* Candidate tile */}
            <div
              className={`relative rounded-2xl overflow-hidden bg-black border-2 transition-colors duration-300 ${
                candidateSpeaking ? "border-emerald-400" : "border-white/10"
              }`}
            >
              <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-semibold bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-md tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>

              {isRecording && (
                <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 text-[10px] font-semibold bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-md">
                  <Mic size={10} className="text-rose-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Rec
                </span>
              )}

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              <span className="absolute bottom-2.5 left-2.5 z-10 text-[11px] font-medium bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-md truncate max-w-[85%]">
                {user?.username || user?.email || "You"}
              </span>

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[11px] text-amber-200 p-3 text-center">
                  {cameraError}
                </div>
              )}
            </div>
          </div>

          {/* Transcription strip, full width beneath the video stage */}
          <div className="shrink-0 rounded-xl bg-white/[0.04] border border-white/10 p-4 sm:p-5">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-1 rounded">
              Transcription
            </span>
            <p className="text-base sm:text-lg leading-relaxed text-white mt-3">
              {currentQuestion?.text}
            </p>

            {currentQuestion?.audioUrl && (
              <audio ref={audioRef} className="hidden" onEnded={startAutoRecording}>
                <source src={getMockInterviewAudioUrl(currentQuestion.audioUrl)} />
              </audio>
            )}

            <div className="flex items-center gap-2 mt-3">
              {submitting && <Loader2 size={13} className="animate-spin text-slate-400" />}
              <p className="text-xs text-slate-500">
                {interviewPhase === "asking" && "Question playing…"}
                {interviewPhase === "listening" &&
                  (isRecording ? "Listening — speak naturally." : "Listening…")}
                {interviewPhase === "processing" && "Processing your answer…"}
              </p>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default LiveInterview;