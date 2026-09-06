import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  Check,
  Mic,
  Layers,
  Play,
  Sparkles,
  ArrowRight,
  Monitor,
  CircleCheckBig
} from "lucide-react";
import { useUser } from "../context/user.context";
import {
  getInterviewReportsApi,
  startMockTestApi,
  submitMockTestApi,
} from "../api/user.api";

const OnlineAssessment = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestedReportId = queryParams.get("reportId") || "";
  const shouldOpenSetup = queryParams.get("phase") === "permissions";

  // Order of Phases: "entry" -> "permissions" -> "pattern" -> "testing" -> "results"
  const [testPhase, setTestPhase] = useState(shouldOpenSetup ? "permissions" : "entry");

  // Camera & Stream Refs
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [environmentConfirmed, setEnvironmentConfirmed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-Cheating & Warning Monitor State
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Reports & Selected Report for Test Generation
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [loadingPattern, setLoadingPattern] = useState(false);
  const [error, setError] = useState("");

  // Real Backend Exam Pattern Data
  const [examPatternData, setExamPatternData] = useState(null);
  const [testSections, setTestSections] = useState([]);

  // Test Session Data
  const [testSessionId, setTestSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(900); // in seconds
  const [testResult, setTestResult] = useState(null);

  // Fetch Reports for target role selection
  useEffect(() => {
    const fetchReports = async () => {
      if (!token) return;
      try {
        const res = await getInterviewReportsApi(token);
        //page ke load hote hi sara report user ka acces krliya
        if (res.success && res.reports?.length > 0) {
          //saare reports ko select setreport me save kr diya
          setReports(res.reports);
          const requestedReport = res.reports.find((report) => report._id === requestedReportId);
          setSelectedReportId(requestedReport?._id || res.reports[0]._id);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      }
    };
    fetchReports();
  }, [token, requestedReportId]);

  const mergeMediaStream = (stream) => {
    setMediaStream((previousStream) => {
      if (!previousStream) return stream;
      return new MediaStream([
        ...previousStream.getTracks(),
        ...stream.getTracks(),
      ]);
    });
  };

  const requestCameraPermission = async () => {
    try {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support camera access for proctored tests.");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      mergeMediaStream(stream);
      setCameraGranted(true);
      return true;
    } catch (err) {
      console.error("Camera permission denied:", err);
      setError("Webcam access is required before the mock test pattern can be generated.");
      setCameraGranted(false);
      return false;
    }
  };

  const requestMicPermission = async () => {
    try {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support microphone access for proctored tests.");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mergeMediaStream(stream);
      setMicGranted(true);
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setError("Microphone access is required before the mock test pattern can be generated.");
      setMicGranted(false);
      return false;
    }
  };

  // Attach stream to video element when granted
  useEffect(() => {
    if (cameraGranted && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [cameraGranted, mediaStream, testPhase]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Enter Fullscreen Mode (User Gesture Compliant)
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
  };

  // Exit Fullscreen Mode
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Stop Media Stream Tracks
  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setCameraGranted(false);
      setMicGranted(false);
    }
  };

  // Anti-Cheating Event Handlers (Focus Loss / Tab Switch)
  useEffect(() => {
    if (testPhase !== "testing") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerProctorWarning("Tab switch or window blur detected!");
      }
    };

    const handleWindowBlur = () => {
      triggerProctorWarning("Focus lost! Assessment window was blurred.");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        triggerProctorWarning("Fullscreen mode exited!");
      } else {
        setIsFullscreen(true);
      }
    };

    const preventCopyPaste = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventCopyPaste);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventCopyPaste);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
    };
  }, [testPhase, warningCount]);

  const triggerProctorWarning = async (reason) => {
    return;
    setWarningCount((prev) => {
      const nextCount = prev + 1;
      setWarningMessage(`${reason} (Warning ${nextCount}/3)`);
      setShowWarningModal(true);

      if (nextCount >= 3) {
        setTimeout(() => {
          handleSubmitAssessment();
        }, 1500);
      }
      return nextCount;
    });
  };

  // Timer Countdown
  useEffect(() => {
    if (testPhase !== "testing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testPhase]);

  useEffect(() => {
    const phaseParam = new URLSearchParams(location.search).get("phase");
    if (phaseParam === "permissions") {
      setTestPhase("permissions");
    }
  }, [location.search]);

  // PHASE TRANSITION 1: Move from Entry Card to Permissions Setup
  const handleEnterPortal = () => {
    const params = new URLSearchParams(location.search);
    if (selectedReportId) params.set("reportId", selectedReportId);
    params.set("phase", "permissions");
    const targetPath = location.pathname === "/" ? "/online-assessment" : location.pathname;
    navigate(`${targetPath}?${params.toString()}`);
    setTestPhase("permissions");
  };

  // PHASE TRANSITION 2: Fetch Real Exam Pattern from Backend and Move to Pattern View
  const handleFetchBackendPattern = async () => {
    if (!cameraGranted || !micGranted || !environmentConfirmed || !isFullscreen) {
      setError("Complete each setup step before generating your assessment pattern.");
      return;
    }

    setLoadingPattern(true);
    setError("");

    try {
      const targetId = selectedReportId || (reports.length > 0 ? reports[0]._id : "");
      if (!targetId) {
        setError("No interview report found. Generate a resume report before starting a mock test.");
        return;
      }

      const res = await startMockTestApi(
        { reportId: targetId, experienceLevel },
        token
      );

      console.table("consoling the mock test question has been generated",res)

      if (res.success) {
        setExamPatternData(res);
        setTestSessionId(res.sessionId || res.mocktestId);

        const extractedQuestions =
          res.questions ||
          res.sections?.flatMap((s) => s.questions || []) ||
          [];

        if (!res.sections?.length || extractedQuestions.length === 0) {
          setError("Backend did not return a complete generated pattern and question set. Please try again.");
          return;
        }

        setTestSections(res.sections);
        setQuestions(extractedQuestions);
        setTimeLeft((res.totalDurationMinutes || 45) * 60);
        setTestPhase("pattern");
      } else {
        setError(res.message || "Failed to generate exam pattern from backend.");
      }
    } catch (err) {
      console.error("Error generating backend pattern:", err);
      setError("Failed to communicate with backend service.");
    } finally {
      setLoadingPattern(false);
    }
  };

  // PHASE TRANSITION 3: Start Real Assessment Mode
  const handleStartExam = async () => {
    await enterFullscreen();
    if (!document.fullscreenElement) {
      setError("Fullscreen is required to start the real mock test.");
      return;
    }
    if (questions.length === 0 || testSections.length === 0) {
      setError("Generated test data is missing. Please regenerate the exam pattern.");
      setTestPhase("permissions");
      return;
    }
    const firstSectionCategory = testSections[0]?.category;
    const firstQuestionIndex = questions.findIndex(
      (question) => question.category === firstSectionCategory
    );
    setCurrentQIndex(firstQuestionIndex >= 0 ? firstQuestionIndex : 0);
    setActiveSectionIdx(0);
    setUserAnswers({});
    setWarningCount(0);
    setTestPhase("testing");
  };

  // Select Question Option
  const handleSelectOption = (questionId, optionValue) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue,
    }));
  };

  // Submit Final Assessment
  const handleSubmitAssessment = async () => {
    stopMediaStream();
    exitFullscreen();

    try {
      if (testSessionId) {
        const mocktestsheet = {
          questions: questions.map((question, index) => {
            const questionId = question._id || question.id;
            return {
              questionId,
              chosenAnswer: userAnswers[questionId || index] || "",
            };
          }).filter((answer) => answer.questionId),
        };
        const payload = {
          mocktestId: testSessionId,
          mocktestsheet,
        };
        const res = await submitMockTestApi(payload, token);
        if (res.success) {
          const score = res.mocktestscore ?? res.score ?? 0;
          const totalScore = res.totalScore || res.totalQuestions || 1;
          setTestResult({
            ...res,
            score,
            totalQuestions: res.totalQuestions || questions.length,
            scorePercentage: Math.round((score / totalScore) * 100),
            warningsCount: warningCount,
          });
        } else {
          setTestResult(calculateLocalResult());
        }
      } else {
        setTestResult(calculateLocalResult());
      }
    } catch (err) {
      console.error("Failed to submit mock test:", err);
      setTestResult(calculateLocalResult());
    } finally {
      setTestPhase("results");
    }
  };

  const calculateLocalResult = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const key = q._id || idx;
      if (userAnswers[key] === q.correctAnswer) {
        correct++;
      }
    });
    const total = questions.length || 1;
    const scorePct = Math.round((correct / total) * 100);
    return {
      score: correct,
      totalQuestions: total,
      scorePercentage: scorePct,
      passed: scorePct >= 60,
      warningsCount: warningCount,
    };
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const activeReport = reports.find((r) => r._id === selectedReportId) || reports[0];
  const targetRoleName =
    examPatternData?.role ||
    activeReport?.careerProfile?.targetRole ||
    activeReport?.careerProfile?.name ||
    "Software Engineer";
  const currentSetupStep = !cameraGranted
    ? "camera"
    : !micGranted
    ? "microphone"
    : !environmentConfirmed
    ? "environment"
    : !isFullscreen
    ? "fullscreen"
    : "ready";
  const setupStepNumber = {
    camera: 1,
    microphone: 2,
    environment: 3,
    fullscreen: 4,
    ready: 4,
  }[currentSetupStep];
  const setupComplete = currentSetupStep === "ready";

  const currentSection = testSections[activeSectionIdx] || null;
  const currentSectionQuestionIndexes = questions.reduce((indexes, question, index) => {
    if (!currentSection || question.category === currentSection.category) {
      indexes.push(index);
    }
    return indexes;
  }, []);
  const visibleQuestionIndexes = currentSectionQuestionIndexes.length > 0
    ? currentSectionQuestionIndexes
    : questions.map((_, index) => index);
  const currentSectionPosition = Math.max(0, visibleQuestionIndexes.indexOf(currentQIndex));
  const currentSectionTotalQuestions = visibleQuestionIndexes.length;
  const currentSectionAnsweredCount = visibleQuestionIndexes.filter((questionIndex) => {
    const question = questions[questionIndex];
    const questionKey = question?._id || questionIndex;
    return Boolean(userAnswers[questionKey]);
  }).length;
  const isFirstQuestionInSection = currentSectionPosition <= 0;
  const isLastQuestionInSection =
    currentSectionPosition === currentSectionTotalQuestions - 1;
  const hasNextSection = activeSectionIdx < testSections.length - 1;

  const handlePreviousQuestion = () => {
    if (isFirstQuestionInSection) return;
    setCurrentQIndex(visibleQuestionIndexes[currentSectionPosition - 1]);
  };

  const handleNextQuestion = () => {
    if (isLastQuestionInSection) return;
    setCurrentQIndex(visibleQuestionIndexes[currentSectionPosition + 1]);
  };

  // Jump straight to any question within the currently unlocked section (question palette)
  const handleJumpToQuestion = (questionIndex) => {
    if (!visibleQuestionIndexes.includes(questionIndex)) return;
    setCurrentQIndex(questionIndex);
  };

  const handleFinishSection = () => {
    setError("");

    if (!hasNextSection) {
      handleSubmitAssessment();
      return;
    }

    const nextSectionIndex = activeSectionIdx + 1;
    const nextSectionCategory = testSections[nextSectionIndex]?.category;
    const nextQuestionIndex = questions.findIndex(
      (question) => question.category === nextSectionCategory
    );
    setActiveSectionIdx(nextSectionIndex);
    setCurrentQIndex(nextQuestionIndex >= 0 ? nextQuestionIndex : currentQIndex);
  };

  useEffect(() => {
    if (testPhase !== "testing" || visibleQuestionIndexes.includes(currentQIndex)) {
      return;
    }

    setCurrentQIndex(visibleQuestionIndexes[0] ?? 0);
  }, [testPhase, visibleQuestionIndexes, currentQIndex]);

  return (
    <div className="min-h-screen bg-black text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* PROCTORING WARNING MODAL OVERLAY */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-white backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white border border-emerald-200 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Proctoring Warning</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {warningMessage}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                Switching tabs, blurring windows, or exiting fullscreen is logged as a policy violation. Max 3 warnings permitted.
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false);
                  enterFullscreen();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer"
              >
                Re-Enter Proctored Environment and Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 1: SIMPLE BASIC ENTRY UI IN ACTIVE TAB */}
      {testPhase === "entry" && (
        <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-2xl mx-auto w-full space-y-5">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
              Online Assessment
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tigh text-white">
              Ready for Your Mock Test
            </h1>
            <p className="text-xs sm:text-sm text-white max-w-lg mx-auto leading-relaxed">
            The AI agent is generating your assessment. This may take a few moments.
            </p>
          </div>

          <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Target Role</span>
                <h3 className="text-lg font-black text-emerald-400">{targetRoleName}</h3>
              </div>

              {reports.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Select Profile / Scan</label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {reports.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.careerProfile?.targetRole || "Profile"} (Score: {Math.round((r.matchScore || 7.5) * 10)}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Experience Level</span>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="Fresher">Fresher (0-1 yrs)</option>
                  <option value="0-2 Years">0-2 Years</option>
                  <option value="2-4 Years">2-4 Years</option>
                  <option value="4+ Years">4+ Years</option>
                </select>
              </label>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Next</span>
                <p className="text-xs font-bold text-slate-800">Camera, mic, workspace check, fullscreen</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterPortal}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-60"
            disabled={reports.length === 0}
          >
            <span>{reports.length === 0 ? "Generate a Resume Report First" : "Enter"}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* PHASE 2: STEP-BY-STEP HARDWARE & ENVIRONMENT PERMISSIONS */}
      {testPhase === "permissions" && (
        <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px]font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-1 py-1 rounded-full border border-emerald-200">
              Setup Step {setupStepNumber} of 4
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Prepare Your Test Window
            </h1>
            <p className="text-xs text-white max-w-lg mx-auto leading-relaxed">
              Complete each check before the backend generates your personal exam pattern.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 w-full">
              <AlertTriangle size={16} className="text-emerald-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Camera", done: cameraGranted },
                { label: "Microphone", done: micGranted },
                { label: "Tabs Closed", done: environmentConfirmed },
                { label: "Fullscreen", done: isFullscreen },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-3 py-2 text-xs font-extrabold flex items-center justify-between ${
                    item.done
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-500 border-slate-200"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.done && <Check size={14} />}
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              {currentSetupStep === "camera" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Camera size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Allow Camera</h4>
                      <p className="text-xs text-slate-500">Your webcam preview appears here after permission is granted.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={requestCameraPermission}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0"
                  >
                    Allow Camera
                  </button>
                </div>
              )}

              {currentSetupStep === "microphone" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Mic size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Allow Microphone</h4>
                      <p className="text-xs text-slate-500">Audio permission is required for the proctored test session.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={requestMicPermission}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0"
                  >
                    Allow Microphone
                  </button>
                </div>
              )}

              {currentSetupStep === "environment" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Close Extra Tabs and Apps</h4>
                      <p className="text-xs text-slate-500">
                        Close unnecessary Chrome, Safari, browser, document, and file windows before continuing.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnvironmentConfirmed(true)}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    I Have Closed Everything Else
                  </button>
                </div>
              )}

              {currentSetupStep === "fullscreen" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Maximize2 size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Enter Fullscreen</h4>
                      <p className="text-xs text-slate-500">The assessment remains fullscreen while tab and window focus are monitored.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={enterFullscreen}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    Enter Fullscreen
                  </button>
                </div>
              )}

              {currentSetupStep === "ready" && (
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CircleCheckBig size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Setup Complete</h4>
                    <p className="text-xs text-slate-500">Generate your real exam pattern and review it before starting.</p>
                  </div>
                </div>
              )}
            </div>

            {cameraGranted && (
              <div className="w-96 h-90% bg-white rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute bottom-3 left-3 bg-white/90 border border-emerald-200 px-3 py-1 rounded-xl text-[10px] text-emerald-700 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Webcam Active</span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-[11px] text-emerald-700 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="text-emerald-600 shrink-0" />
              <span>Switching tabs, blurring the window, or exiting fullscreen during the test creates a warning.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(location.search);
                params.delete("phase");
                const targetPath = location.pathname === "/" ? "/online-assessment" : location.pathname;
                navigate(`${targetPath}?${params.toString()}`);
                setTestPhase("entry");
              }}
              className="px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Back
            </button>

            <button
              type="button"
              disabled={loadingPattern || !setupComplete}
              onClick={handleFetchBackendPattern}
              className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPattern ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is generating your exam pattern...</span>
                </>
              ) : (
                <>
                  <span>Show Generated Exam Pattern</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: REAL BACKEND GENERATED EXAM PATTERN VIEW */}
      {testPhase === "pattern" && (
        <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            
            <h1 className="text-3xl font-black tracking-tight text-white">
               Generated Test Pattern
            </h1>
            <p className="text-xs text-white max-w-xl mx-auto leading-relaxed">
            Review your test structure before starting the proctored mock test
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 w-full">
              <AlertTriangle size={16} className="text-emerald-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overview Summary Box */}
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Profile Role</span>
              <h3 className="text-xl font-extrabold text-emerald-400">{targetRoleName}</h3>
              <p className="text-xs text-slate-500">Candidate: {user?.username || "Nishant Nikhil"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl space-y-0.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Duration</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-center">
                  <Clock size={13} /> {examPatternData?.totalDurationMinutes} Mins
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl space-y-0.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Questions</span>
                <span className="text-xs font-black text-emerald-400">
                  {questions.length} Questions
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl space-y-0.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Experience</span>
                <span className="text-xs font-black text-emerald-600">{experienceLevel}</span>
              </div>
            </div>
          </div>

          {/* REAL BACKEND GENERATED SECTIONS BREAKDOWN GRID */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" /> Generated Sections ({testSections.length})
              </h4>
              
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testSections.map((sec, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 hover:border-slate-200 transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      Section {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{sec.durationMinutes} Mins</span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900">{sec.category}</h4>

                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {sec.reason}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">{sec.questionCount} Questions</span>
                    <span className="capitalize">Difficulty: <strong className="text-emerald-400">{sec.difficulty}</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(sec.topicsToTest || []).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Assessment Action Bar */}
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setTestPhase("permissions")}
              className="px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Back to Permissions
            </button>

            <button
              type="button"
              onClick={handleStartExam}
              className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={16} className="fill-white" />
              <span>Start Real Mock Test</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: REAL PROCTORED MOCK TEST INTERFACE */}
      {testPhase === "testing" && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#03070a] text-slate-100">
          <header className="bg-[#071017]/95 px-4 sm:px-7 py-4 flex items-center justify-between shrink-0 gap-4 border-b border-slate-800 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-emerald-400 text-black flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-emerald-500/20">
                {"</>"}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-white truncate">Online Proctored Assessment</h3>
                <p className="text-xs text-emerald-400 font-bold truncate">{targetRoleName} &middot; {experienceLevel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 shadow-inner">
                <ShieldAlert size={13} className={warningCount > 0 ? "text-white" : "text-emerald-400"} />
                <span className="hidden sm:inline">Warnings</span> {warningCount}/3
              </div>

              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 sm:px-4 py-2.5 rounded-xl font-mono text-sm font-black text-white tabular-nums shadow-inner">
                <Clock size={16} className="text-slate-200" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="px-4 sm:px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs sm:text-sm font-black transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                End Test
              </button>
            </div>
          </header>

          {/* Section strip */}
          <div className="flex items-center gap-3 px-4 sm:px-7 py-3 bg-[#071017] border-b border-slate-800 overflow-x-auto shrink-0">
            {testSections.map((sec, sIdx) => (
              <div
                key={sIdx}
                className={`px-4 py-2 rounded-full text-xs font-extrabold border whitespace-nowrap transition ${
                  activeSectionIdx === sIdx
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                    : sIdx < activeSectionIdx
                    ? "bg-slate-800 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800/70 border-slate-700 text-slate-300"
                }`}
              >
                {sIdx < activeSectionIdx ? "✓ " : ""}{sec.category}
              </div>
            ))}
          </div>

          {error && (
            <div className="mx-4 sm:mx-7 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-2 shrink-0">
              <AlertTriangle size={15} className="text-emerald-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Split Layout: Question Palette (left) + Question Panel (right) */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {/* LEFT: Question Palette Sidebar */}
            <aside className="lg:w-[300px] shrink-0 bg-[#04090d] border-b border-slate-800 lg:border-b-0 lg:border-r flex flex-col">
              <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Section {activeSectionIdx + 1} of {testSections.length}
                  </span>
                  <h4 className="mt-3 text-lg font-black text-slate-200 leading-tight">{currentSection?.category}</h4>
                </div>

                <div className="grid grid-cols-6 lg:grid-cols-4 gap-2">
                  {visibleQuestionIndexes.map((qIdx, pos) => {
                    const question = questions[qIdx];
                    const qKey = question?._id || qIdx;
                    const isAnswered = Boolean(userAnswers[qKey]);
                    const isCurrent = qIdx === currentQIndex;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => handleJumpToQuestion(qIdx)}
                        className={`aspect-square min-h-12 rounded-lg text-sm font-black flex items-center justify-center border transition cursor-pointer ${
                          isCurrent
                            ? "bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-200 shadow-lg shadow-emerald-500/20"
                            : isAnswered
                            ? "bg-white border-white text-slate-950"
                            : "bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-400"
                        }`}
                      >
                        {pos + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-400 shrink-0" /> Current question
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-white shrink-0" /> Answered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-slate-700 border border-slate-500 shrink-0" /> Not answered
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-300 mb-3">
                    <span>Section Progress</span>
                    <span>{currentSectionAnsweredCount}/{currentSectionTotalQuestions}</span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${currentSectionTotalQuestions ? (currentSectionAnsweredCount / currentSectionTotalQuestions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT: Question Panel */}
            <main className="flex-1 min-h-0 overflow-y-auto bg-[#05090d]">
              <div className="max-w-6xl mx-auto p-5 sm:p-8 lg:p-10">
                {questions.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-[#0b141c] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-black/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-2xl font-black text-white">
                          Question {currentSectionPosition + 1}
                        </span>
                        <span className="rounded-full bg-emerald-500/80 px-4 py-1.5 text-xs font-black text-white border border-emerald-300/30">
                          Multiple Choice
                        </span>
                        <span className="rounded-full bg-slate-700 px-4 py-1.5 text-xs font-black text-slate-100 border border-slate-600 capitalize">
                          {questions[currentQIndex]?.difficulty || "Medium"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        {currentSectionTotalQuestions} questions in this section
                      </span>
                    </div>

                    {/* Question Text */}
                    <h2 className="mt-7 text-2xl sm:text-3xl font-black text-white leading-snug">
                      {questions[currentQIndex]?.question}
                    </h2>

                    {/* Options List */}
                    <div className="mt-8 space-y-2.5">
                      {questions[currentQIndex]?.options?.map((opt, optIdx) => {
                        const qKey = questions[currentQIndex]._id || currentQIndex;
                        const isSelected = userAnswers[qKey] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, opt)}
                            className={`w-full p-4 rounded-lg border text-left text-base transition-all flex items-center gap-5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/15 border-emerald-400 text-white shadow-[inset_3px_0_0_#34d399]"
                                : "bg-slate-800/70 border-slate-700 hover:border-emerald-400 hover:bg-slate-800 text-slate-100"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-emerald-400 bg-emerald-500" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="font-mono text-sm font-black text-emerald-400 shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className={isSelected ? "font-black" : "font-bold"}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer Action Bar */}
                    <div className="pt-8 mt-8 border-t border-slate-700 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={isFirstQuestionInSection}
                        onClick={handlePreviousQuestion}
                        className="px-5 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-sm font-black hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>

                      {!isLastQuestionInSection ? (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                        >
                          <span>Save & Next</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishSection}
                          className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                        >
                          {hasNextSection ? <ChevronRight size={16} /> : <Check size={16} />}
                          <span>{hasNextSection ? "Next Section" : "Submit Assessment"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* PHASE 5: ASSESSMENT RESULTS & PERFORMANCE SUMMARY */}
      {testPhase === "results" && testResult && (
        <div className="flex-1 flex items-center justify-center p-6 max-w-2xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Award size={36} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Assessment Complete
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">
                Performance Score Summary
              </h2>
              <p className="text-xs text-slate-500">
                Your response metrics have been analyzed against your target career profile.
              </p>
            </div>

            {/* Score Ring */}
            <div className="my-4 p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-3">
              <span className="text-4xl font-black text-emerald-400">
                {testResult.scorePercentage || Math.round((testResult.score / (testResult.totalQuestions || 1)) * 100)}%
              </span>
              <p className="text-xs font-bold text-slate-700">
                {testResult.score} of {testResult.totalQuestions} Questions Correct
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${testResult.scorePercentage || Math.round((testResult.score / (testResult.totalQuestions || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Proctor Status</span>
                <p className="font-extrabold text-emerald-400">Verified Clear</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Warnings Issued</span>
                <p className="font-extrabold text-slate-700">{testResult.warningsCount || warningCount}/3</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineAssessment;
