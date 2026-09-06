import React, { useState, useContext, useEffect } from 'react';
import CreateNewProfile from "../pages/CreateNewProfile";
import { UserContext } from '../context/user.context';
import { getalltheProfile, updateCareerProfileApi } from "../api/user.api";

// Icon Components
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function UpdateCarrierProfile() {
  const [newprofilestate, setnewprofilestate] = useState(false);
  const { user } = useContext(UserContext);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Profile State
  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem("active_profile_id") || null;
  });

  // Edit Mode States
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    selfDescription: "",
    jobDescription: "",
    isActive: false,
  });

  // Date Formatter: Converts Date -> DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const fetchUserProfiles = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("resumeiq_token");
    if (!token) {
      setError("Authentication token missing");
      setLoading(false);
      return;
    }

    const res = await getalltheProfile(token);

    if (!res?.success) {
      setError(res?.message || "Failed to fetch career profiles");
      setLoading(false);
      return;
    }

    const fetchedProfiles = res.careerProfiles || [];
    setProfiles(fetchedProfiles);

    if (fetchedProfiles.length > 0 && !activeProfileId) {
      setActiveProfileId(fetchedProfiles[0]._id);
      localStorage.setItem("active_profile_id", fetchedProfiles[0]._id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const handleSetActive = (profileId) => {
    setActiveProfileId(profileId);
    localStorage.setItem("active_profile_id", profileId);
    setSuccessMsg("Set as active career profile!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleEditProfile = (profileId) => {
    const selectedProfile = profiles.find((p) => p._id === profileId);
    if (selectedProfile) {
      setEditingProfileId(profileId);
      setEditFormData({
        name: selectedProfile.name || "",
        selfDescription: selectedProfile.selfDescription || "",
        jobDescription: selectedProfile.jobDescription || "",
        isActive: selectedProfile._id === activeProfileId,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditFormData({ name: "", selfDescription: "", jobDescription: "", isActive: false });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveProfile = async (e, profileId) => {
    e.preventDefault();
    const token = localStorage.getItem("resumeiq_token");
    if (!token) return;

    try {
      const res = await updateCareerProfileApi(profileId, editFormData, token);
      if (res.success) {
        if (editFormData.isActive) {
          handleSetActive(profileId);
        }
        setSuccessMsg("Career profile updated successfully!");
        setEditingProfileId(null);
        await fetchUserProfiles();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(res.message || "Failed to update profile.");
      }
    } catch (err) {
      setError("Failed to save changes.");
    }
  };

  const mostRecentDate = profiles.length > 0
    ? formatDate(Math.max(...profiles.map((p) => new Date(p.createdAt || Date.now()))))
    : "N/A";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      {!newprofilestate ? (
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Career <span className="text-[#00875A]">Profiles</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your career profiles, track your progress, and explore new opportunities.
              </p>
            </div>
            <button
              onClick={() => setnewprofilestate(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00875A] hover:bg-[#00714B] text-white text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <PlusIcon />
              <span>Create New Profile</span>
            </button>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-[#00875A] rounded-xl flex items-center justify-center">
                <BriefcaseIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{profiles.length}</p>
                <p className="text-xs font-semibold text-slate-700">Total Profiles</p>
                <p className="text-[11px] text-slate-400">All your career profiles</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-[#00875A] rounded-xl flex items-center justify-center">
                <BriefcaseIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{profiles.length > 0 ? 1 : 0}</p>
                <p className="text-xs font-semibold text-slate-700">Active Profiles</p>
                <p className="text-[11px] text-slate-400">Currently active</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-[#00875A] rounded-xl flex items-center justify-center">
                <CalendarIcon />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{mostRecentDate}</p>
                <p className="text-xs font-semibold text-slate-700">Last Updated</p>
                <p className="text-[11px] text-slate-400">Most recent activity</p>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Profiles Container */}
          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-sm text-slate-500">
              Loading profiles...
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-sm text-slate-500 mb-4">No career profiles found.</p>
              <button
                onClick={() => setnewprofilestate(true)}
                className="px-4 py-2 bg-[#00875A] text-white text-xs font-semibold rounded-xl hover:bg-[#00714B] transition"
              >
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const isEditing = editingProfileId === profile._id;
                const isSelectedActive = profile._id === (activeProfileId || profiles[0]?._id);

                return (
                  <div
                    key={profile._id}
                    className={`bg-white rounded-2xl p-6 transition-all border ${
                      isSelectedActive
                        ? "border-[#00875A] ring-1 ring-[#00875A]/20"
                        : "border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <form onSubmit={(e) => handleSaveProfile(e, profile._id)} className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="text-base font-bold text-slate-900">Edit Career Profile</h3>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={editFormData.isActive}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00875A]"></div>
                            <span className="text-xs font-semibold text-slate-700">Set as Active</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Profile Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00875A]/30 focus:border-[#00875A]"
                            placeholder="e.g. Placement Resume"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Self Description</label>
                          <textarea
                            name="selfDescription"
                            rows={3}
                            value={editFormData.selfDescription}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00875A]/30 focus:border-[#00875A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Job Description</label>
                          <textarea
                            name="jobDescription"
                            rows={3}
                            value={editFormData.jobDescription}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00875A]/30 focus:border-[#00875A]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#00875A] hover:bg-[#00714B] rounded-xl transition"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Card Display Mode */
                      <div className="space-y-4">
                        {/* Active Badge */}
                        <div>
                          {isSelectedActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#00875A] border border-emerald-200/80">
                              <span className="w-2 h-2 rounded-full bg-[#00875A]"></span>
                              Active Profile
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Inactive Profile
                            </span>
                          )}
                        </div>

                        {/* Profile Details Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00875A] flex items-center justify-center font-bold text-lg shrink-0">
                              <BriefcaseIcon />
                            </div>

                            <div>
                              <h2 className="text-xl font-bold text-slate-900">
                                {profile.name || "Career Profile"}
                              </h2>

                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon /> Created on {formatDate(profile.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarIcon /> Last updated {formatDate(profile.updatedAt || profile.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProfile(profile._id)}
                              className="px-4 py-2 text-xs font-semibold text-[#00875A] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 border border-emerald-200/60"
                            >
                              <EditIcon />
                              <span>Edit Profile</span>
                            </button>

                            {!isSelectedActive && (
                              <button
                                onClick={() => handleSetActive(profile._id)}
                                className="px-4 py-2 text-xs font-bold text-white bg-[#00875A] hover:bg-[#00714B] rounded-xl transition shadow-xs"
                              >
                                Set Active
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Self Description & Job Description Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-1.5">
                              <DocumentIcon />
                              <p className="text-xs font-bold text-slate-700">Self Description</p>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {profile.selfDescription || "No self description provided."}
                            </p>
                          </div>

                          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-1.5">
                              <BriefcaseIcon />
                              <p className="text-xs font-bold text-slate-700">Job Description</p>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed uppercase">
                              {profile.jobDescription || "No job description provided."}
                            </p>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <CreateNewProfile setnewprofilestate={setnewprofilestate} />
      )}
    </div>
  );
}

export default UpdateCarrierProfile;