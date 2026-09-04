import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  LogOut,
  Plus,
  ScanLine,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../context/user.context";
import {
  createCareerProfile,
  generateReportByProfile,
  getCareerProfiles,
} from "../api/generateResume";

const emptyForm = {
  name: "",
  targetRole: "",
  selfDescription: "",
  jobDescription: "",
};

// Fields required before a profile can be saved + a report generated.
// Used to drive the little progress indicator on the create form.
const REQUIRED_FIELDS = ["name", "targetRole", "selfDescription", "jobDescription"];

const BuildProfile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const menuRef = useRef(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const data = await getCareerProfiles();
        setProfiles(data.careerProfiles || []);
        if (data.careerProfiles?.length) {
          setSelectedProfileId(data.careerProfiles[0]._id);
        } else {
          setIsCreating(true);
        }
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();
  }, []);

  // Close the account menu on outside click / Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const completedCount = REQUIRED_FIELDS.filter((field) =>
    form[field].trim()
  ).length + (resume ? 1 : 0);
  const totalSteps = REQUIRED_FIELDS.length + 1;

  const validateForm = () => {
    if (
      !resume ||
      !form.name.trim() ||
      !form.targetRole.trim() ||
      !form.jobDescription.trim() ||
      !form.selfDescription.trim()
    ) {
      setErrorMessage(
        "Please fill in all details: Profile Name, Target Role, Resume PDF, About You, and Job Description."
      );
      return false;
    }
    return true;
  };

  const saveProfileOnly = async () => {
    if (!validateForm()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingProfile(true);

    try {
      const profileResult = await createCareerProfile({ ...form, resume });
      const newProfile = profileResult.careerProfile;
      setProfiles((current) => [newProfile, ...current]);
      setSelectedProfileId(newProfile._id);
      setIsCreating(false);
      setSuccessMessage("Career profile saved successfully!");
      setForm(emptyForm);
      setResume(null);
    } catch (error) {
      setErrorMessage(error.message || "Unable to save the career profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const createAndGenerate = async () => {
    if (!validateForm()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsGenerating(true);

    try {
      const profileResult = await createCareerProfile({ ...form, resume });
      const profile = profileResult.careerProfile;
      setProfiles((current) => [profile, ...current]);
      setSelectedProfileId(profile._id);

      const reportResult = await generateReportByProfile(profile._id);
      navigate("/resume-analysis", {
        state: { report: reportResult.report, careerProfile: profile },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to create profile and generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateForSelectedProfile = async () => {
    if (!selectedProfileId) {
      setErrorMessage("Choose a saved career profile first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsGenerating(true);

    try {
      const reportResult = await generateReportByProfile(selectedProfileId);
      const profile = profiles.find((item) => item._id === selectedProfileId);
      navigate("/resume-analysis", {
        state: { report: reportResult.report, careerProfile: profile },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to generate the report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const selectedProfile = profiles.find(
    (profile) => profile._id === selectedProfileId
  );

  const initials = (user?.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-200">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ScanLine size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Resume<span className="text-emerald-500">IQ</span>
          </span>
        </div>

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 hover:border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {user?.username || "Your Workspace"}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {profiles.length} saved profile{profiles.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
              {initials}
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform hidden sm:block ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="px-2.5 py-2 sm:hidden">
                <p className="text-xs font-bold text-slate-800">
                  {user?.username || "Your Workspace"}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-indigo-100/50 py-10 sm:py-14 px-6 lg:px-12">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header Banner */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <span>Career Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build your interview plan from a profile you can reuse.
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Save your resume, role details, and career context once. Generate
              fresh reports and practice sessions from the same profile whenever
              you need them.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700 shadow-xs"
            >
              <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-rose-200 text-[10px] text-rose-700">
                !
              </span>
              {errorMessage}
            </div>
          )}

          {/* Workspace Layout Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* LEFT ASIDE: Saved Profiles List */}
            <aside className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-xl h-fit lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Saved Profiles
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(true);
                    setSelectedProfileId("");
                    setForm(emptyForm);
                    setResume(null);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition cursor-pointer"
                  title="Create profile"
                  aria-label="Create profile"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="mt-4">
                {isLoadingProfiles ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-14 rounded-xl bg-slate-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profiles.map((profile) => {
                      const isActive =
                        selectedProfileId === profile._id && !isCreating;
                      return (
                        <button
                          type="button"
                          key={profile._id}
                          onClick={() => {
                            setSelectedProfileId(profile._id);
                            setIsCreating(false);
                            setErrorMessage("");
                            setSuccessMessage("");
                          }}
                          aria-current={isActive}
                          className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                            isActive
                              ? "border-emerald-500 bg-emerald-50/80 shadow-xs"
                              : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[10px] font-bold ${
                              isActive
                                ? "bg-emerald-500 text-white"
                                : "bg-white text-slate-500 border border-slate-200 group-hover:border-slate-300"
                            }`}
                          >
                            {profile.name?.slice(0, 2).toUpperCase() || "CP"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {profile.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {profile.targetRole || "Career profile"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {!profiles.length && !isCreating && (
                      <div className="py-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <BriefcaseBusiness size={18} />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          No saved profiles yet
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Create one to get started.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT PANEL */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 p-6 sm:p-8 shadow-2xl">
              {isCreating ? (
                <section className="space-y-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        New Career Profile
                      </h2>
                      <p className="mt-1 text-xs text-slate-600">
                        Upload your profile details and resume to save your profile.
                      </p>
                    </div>

                    <div className="flex flex-none items-center gap-3">
                      {/* Progress indicator */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-5 rounded-full transition-colors ${
                              i < completedCount
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      {profiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false);
                            setSelectedProfileId(profiles[0]._id);
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile & Target Role Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Profile Name
                      </label>
                      <input
                        value={form.name}
                        onChange={updateForm("name")}
                        placeholder="e.g., Full Stack Engineer 2026"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Target Role
                      </label>
                      <input
                        value={form.targetRole}
                        onChange={updateForm("targetRole")}
                        placeholder="e.g., Senior Frontend Developer"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Drag-and-Drop Resume Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Upload Resume (PDF)
                    </label>
                    <label
                      htmlFor="resume"
                      className={`flex min-h-36 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                        resume
                          ? "border-emerald-500 bg-emerald-50/60"
                          : "border-slate-300 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/30"
                      }`}
                    >
                      <input
                        id="resume"
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) =>
                          setResume(event.target.files?.[0] || null)
                        }
                      />
                      {resume ? (
                        <div>
                          <CheckCircle2
                            className="mx-auto text-emerald-600"
                            size={28}
                          />
                          <p className="mt-2 text-xs font-bold text-slate-900">
                            {resume.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            PDF selected · click to replace
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                            <Upload size={18} />
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            Upload your resume PDF
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Supports PDF up to 5MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* About & Job Description Textareas */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        About You
                      </label>
                      <textarea
                        value={form.selfDescription}
                        onChange={updateForm("selfDescription")}
                        rows={6}
                        placeholder="Your key experience, technical stack, accomplishments, and skills."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Job Description
                      </label>
                      <textarea
                        value={form.jobDescription}
                        onChange={updateForm("jobDescription")}
                        rows={6}
                        placeholder="Paste target job responsibilities, skills, and requirements."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={saveProfileOnly}
                      disabled={isSavingProfile || isGenerating}
                      className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving Profile...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Save Career Profile
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={createAndGenerate}
                      disabled={isSavingProfile || isGenerating}
                      className="flex-1 h-11 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Save & Generate AI Report
                        </>
                      )}
                    </button>
                  </div>
                </section>
              ) : (
                <section className="flex flex-col justify-between h-full space-y-8">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                        <BriefcaseBusiness size={22} />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Saved Profile
                      </span>
                    </div>

                    <p className="mt-6 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Selected Career Profile
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
                      {selectedProfile?.name}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <UserRound size={15} className="text-slate-400" />
                      {selectedProfile?.targetRole ||
                        "Target role not specified"}
                    </p>

                    {/* Profile Details Summary */}
                    <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                      {selectedProfile?.selfDescription && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            About You
                          </p>
                          <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 line-clamp-3">
                            {selectedProfile.selfDescription}
                          </p>
                        </div>
                      )}

                      {selectedProfile?.jobDescription && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Job Description
                          </p>
                          <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 line-clamp-3">
                            {selectedProfile.jobDescription}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features Card List */}
                    <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <FileText size={18} className="text-emerald-500" />
                        <p className="mt-2 text-xs font-bold text-slate-900">
                          Resume PDF
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Uploaded & Parsed
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <BriefcaseBusiness
                          size={18}
                          className="text-indigo-500"
                        />
                        <p className="mt-2 text-xs font-bold text-slate-900">
                          Target Context
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Role & Job details stored
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Sparkles size={18} className="text-amber-500" />
                        <p className="mt-2 text-xs font-bold text-slate-900">
                          AI Ready
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Ready for interview analysis
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(true);
                        setSelectedProfileId("");
                        setForm(emptyForm);
                        setResume(null);
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className="flex-1 h-11 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
                    >
                      <Plus size={16} />
                      Create Another Profile
                    </button>

                    <button
                      type="button"
                      onClick={generateForSelectedProfile}
                      disabled={isGenerating}
                      className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate Interview Report
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuildProfile;