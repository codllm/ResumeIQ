import React, { useState, useContext, useEffect } from 'react';
import CreateNewProfile from "../pages/CreateNewProfile";
import { UserContext } from '../context/user.context';
import { getalltheProfile } from "../api/user.api";

function UpdateCarrierProfile() {
  const [newprofilestate, setnewprofilestate] = useState(false);
  const { user } = useContext(UserContext);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      setProfiles(res.careerProfiles || []);
      setLoading(false);
    };

    fetchUserProfiles();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {!newprofilestate && (
        <div>
          {/* Header with Action Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Career Profiles</h1>
              <p className="text-sm text-gray-500">Manage your active career profiles or set up a new one.</p>
            </div>
            <button
              onClick={() => setnewprofilestate(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="text-lg">+</span> Create New Profile
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading profiles...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Cards Column */}
              <div className="lg:col-span-2 space-y-6">
                {profiles.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                    <p className="text-gray-500 text-sm mb-4">No career profiles found.</p>
                    <button
                      onClick={() => setnewprofilestate(true)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                      Create your first profile
                    </button>
                  </div>
                ) : (
                  profiles.map((profile, idx) => (
                    <div key={profile._id || idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-1 ${
                            profile.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}>
                            {profile.isActive ? "Active Profile" : "Inactive Profile"}
                          </span>
                          <h2 className="text-xl font-bold text-gray-800">
                            {profile.targetRole || profile.name || "Career Profile"}
                          </h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Target Role</p>
                          <p className="text-gray-900 font-semibold mt-1">{profile.targetRole || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Created On</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500 font-medium">Self Description</p>
                          <p className="text-gray-700 mt-1 line-clamp-2">{profile.selfDescription || "N/A"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500 font-medium">Job Description</p>
                          <p className="text-gray-700 mt-1 line-clamp-2">{profile.jobDescription || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sidebar */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-fit">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Profile Actions</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Set up different career profiles tailored for specific target roles and job descriptions.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setnewprofilestate(true)}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
                  >
                    + Add New Career Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {newprofilestate && (
        <div>
          <CreateNewProfile setnewprofilestate={setnewprofilestate} />
        </div>
      )}
    </div>
  );
}

export default UpdateCarrierProfile;