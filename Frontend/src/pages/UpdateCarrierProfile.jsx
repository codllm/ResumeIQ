import React, { useState, useContext, useEffect } from 'react';
import CreateNewProfile from "../pages/CreateNewProfile";
import { UserContext } from '../context/user.context';
import { getalltheProfile, updateCareerProfileApi } from "../api/user.api";

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
    targetRole: "",
    selfDescription: "",
    jobDescription: "",
    isActive: false
  });

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
    setSuccessMsg("Selected as active target profile!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleEditProfile = (profileId) => {
    const selectedProfile = profiles.find((p) => p._id === profileId);
    if (selectedProfile) {
      setEditingProfileId(profileId);
      setEditFormData({
        name: selectedProfile.name || "",
        targetRole: selectedProfile.targetRole || "",
        selfDescription: selectedProfile.selfDescription || "",
        jobDescription: selectedProfile.jobDescription || "",
        isActive: selectedProfile.isActive || false
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditFormData({ name: "", targetRole: "", selfDescription: "", jobDescription: "", isActive: false });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async (e, profileId) => {
    e.preventDefault();
    const token = localStorage.getItem("resumeiq_token");
    if (!token) return;

    try {
      const res = await updateCareerProfileApi(profileId, editFormData, token);
      if (res.success) {
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

  // Icon background helper array for profile visual variety
  const iconThemes = [
    { bg: "bg-emerald-100", text: "text-emerald-600", icon: "👤" },
    { bg: "bg-purple-100", text: "text-purple-600", icon: "</>" },
    { bg: "bg-orange-100", text: "text-orange-600", icon: "⚙️" },
  ];

  const mostRecentDate = profiles.length > 0
    ? new Date(Math.max(...profiles.map(p => new Date(p.createdAt || Date.now())))).toLocaleDateString()
    : "N/A";

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#FAFAFA] min-h-screen font-sans">
      {!newprofilestate && (
        <div className="space-y-6">
          {/* Top Navigation / Title Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Career Profiles</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your active career profiles or set up a new one.</p>
            </div>
            <button
              onClick={() => setnewprofilestate(true)}
              className="px-5 py-2.5 bg-[#00875A] hover:bg-[#00714B] text-white font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 text-sm"
            >
              <span className="text-lg leading-none">+</span> Create New Profile
            </button>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-4 p-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                💼
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Total Profiles</p>
                <p className="text-2xl font-extrabold text-gray-900">{profiles.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">All career profiles</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                📈
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Active Profiles</p>
                <p className="text-2xl font-extrabold text-gray-900">{profiles.length > 0 ? 1 : 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Currently active</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                📅
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Last Updated</p>
                <p className="text-xl font-bold text-gray-900">{mostRecentDate}</p>
                <p className="text-xs text-gray-400 mt-0.5">Most recent update</p>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Profile List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 font-medium text-sm">Loading profiles...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-xs text-center">
              <p className="text-gray-500 text-sm mb-4">No career profiles found.</p>
              <button
                onClick={() => setnewprofilestate(true)}
                className="px-4 py-2 bg-[#00875A] text-white text-sm font-medium rounded-xl hover:bg-[#00714B] transition"
              >
                Create your first profile
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile, idx) => {
                const isEditing = editingProfileId === profile._id;
                const isSelectedActive = profile._id === (activeProfileId || profiles[0]?._id);
                const theme = iconThemes[idx % iconThemes.length];

                return (
                  <div
                    key={profile._id || idx}
                    className={`bg-white rounded-2xl p-6 transition-all border ${
                      isSelectedActive
                        ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-gradient-to-br from-emerald-50/20 to-white'
                        : 'border-gray-100 shadow-xs'
                    }`}
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <form onSubmit={(e) => handleSaveProfile(e, profile._id)} className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <h3 className="text-lg font-bold text-gray-900">Edit Career Profile</h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={editFormData.isActive}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00875A]"></div>
                            <span className="ml-2 text-xs font-semibold text-gray-700">Active Profile</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Profile Name</label>
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00875A]"
                              placeholder="e.g. Software Dev II"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Target Role</label>
                            <input
                              type="text"
                              name="targetRole"
                              value={editFormData.targetRole}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00875A]"
                              placeholder="e.g. Full Stack Developer"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Self Description</label>
                          <textarea
                            name="selfDescription"
                            rows={3}
                            value={editFormData.selfDescription}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00875A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Job Description</label>
                          <textarea
                            name="jobDescription"
                            rows={3}
                            value={editFormData.jobDescription}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00875A]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
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
                      /* Display Card Mode */
                      <div>
                        {/* Header Badge */}
                        <div className="mb-3">
                          {isSelectedActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100/70 text-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Active Profile
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                              Secondary Profile
                            </span>
                          )}
                        </div>

                        {/* Top Card Section: Avatar + Title + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center font-bold text-lg`}>
                              {theme.icon}
                            </div>
                            <div>
                              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                                {profile.name || profile.targetRole || "Career Profile"}
                              </h2>
                              <div className="flex items-center gap-6 mt-1 text-xs text-gray-500">
                                <div>
                                  <span className="text-gray-400">Target Role</span>
                                  <p className="font-bold text-gray-900 mt-0.5">{profile.targetRole || "N/A"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Created On</span>
                                  <p className="font-semibold text-gray-700 mt-0.5 flex items-center gap-1">
                                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : "N/A"}
                                    <span className="text-xs">📅</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {!isSelectedActive && (
                              <button
                                onClick={() => handleSetActive(profile._id)}
                                className="px-4 py-2 text-xs font-bold text-white bg-[#00875A] hover:bg-[#00714B] rounded-xl shadow-xs transition"
                              >
                                Set as Active
                              </button>
                            )}
                            <button
                              onClick={() => handleEditProfile(profile._id)}
                              className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl transition flex items-center gap-1.5"
                            >
                               Edit Profile
                            </button>
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="mt-4 space-y-3 text-xs">
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Self Description</p>
                            <p className="text-gray-800 font-medium leading-relaxed">
                              {profile.selfDescription || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Job Description</p>
                            <p className="text-gray-800 font-medium leading-relaxed uppercase">
                              {profile.jobDescription || "N/A"}
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
      )}

      {newprofilestate && (
        <CreateNewProfile setnewprofilestate={setnewprofilestate} />
      )}
    </div>
  );
}

export default UpdateCarrierProfile;