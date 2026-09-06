const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const getHeaders = (token = null, isFormData = false) => {
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const userLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to connect to backend server.',
    };
  }
};

export const userRegister = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to connect to backend server.',
    };
  }
};

export const getMe = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/get-me`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Session verification failed.',
    };
  }
};

export const logoutUserApi = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Logout request failed.',
    };
  }
};

export const getCareerProfiles = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/career-profiles`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to fetch career profiles.',
    };
  }
};

export const createCareerProfile = async (formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/career-profile`, {
      method: 'POST',
      headers: getHeaders(token, true),
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to create career profile.',
    };
  }
};

export const generateInterviewReportApi = async (payload, token) => {
  try {
    let body;
    let isFormData = false;

    if (payload instanceof FormData) {
      body = payload;
      isFormData = true;
    } else {
      body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE_URL}/api/ai/generate-interview-report`, {
      method: 'POST',
      headers: getHeaders(token, isFormData),
      body,
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to generate interview report.',
    };
  }
};

export const getInterviewReportsApi = async (token, careerProfileId = '') => {
  try {
    const url = careerProfileId
      ? `${API_BASE_URL}/api/ai/reports?careerProfileId=${careerProfileId}`
      : `${API_BASE_URL}/api/ai/reports`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to fetch interview reports.',
    };
  }
};

export const getInterviewReportByIdApi = async (reportId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/report/${reportId}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to fetch interview report details.',
    };
  }
};

export const getCareerProfileByIdApi = async (profileId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/career-profile/${profileId}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to fetch career profile.',
    };
  }
};

export const startMockTestApi = async (payload, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/mock-test/start`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to start mock test.',
    };
  }
};

export const startMockInterviewApi = async (payload, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/mock-interview/start`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to start mock interview.',
    };
  }
};

export const submitMockInterviewAnswerApi = async (payload, token) => {
  try {
    let body;
    let isFormData = false;

    if (payload instanceof FormData) {
      body = payload;
      isFormData = true;
    } else {
      body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE_URL}/api/ai/mock-interview/answer`, {
      method: 'POST',
      headers: getHeaders(token, isFormData),
      body,
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to submit mock interview answer.',
    };
  }
};

export const getMockInterviewAudioUrl = (audioUrl = '') => {
  if (!audioUrl) return '';
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  return `${API_BASE_URL}${audioUrl}`;
};

export const submitMockTestApi = async (payload, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/mock-test/submit`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.success) {
      clearOAReportsCache();
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to submit mock test.',
    };
  }
};

export const reportScore = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/score-card`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to fetch score history.',
    };
  }
};
export const getalltheProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/career-profiles`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateCareerProfileApi = async (profileId, data, token, isFormData = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/career-profile/${profileId}`, {
      method: 'PATCH',
      headers: getHeaders(token, isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const oaReportsCache = new Map();

export const clearOAReportsCache = () => {
  oaReportsCache.clear();
};

export async function getassessmentreports(token, profileId, forceRefresh = false) {
  try {
    const hasProfileId =
      profileId &&
      profileId !== "undefined" &&
      profileId !== "null" &&
      String(profileId).trim().length > 0;

    const cacheKey = `${token}_${hasProfileId ? profileId : "all"}`;

    if (!forceRefresh && oaReportsCache.has(cacheKey)) {
      return oaReportsCache.get(cacheKey);
    }

    const url = hasProfileId
      ? `${API_BASE_URL}/api/ai/oa-reports?careerProfileId=${profileId}`
      : `${API_BASE_URL}/api/ai/oa-reports`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch assessment reports");
    }

    const data = await response.json();
    if (!data?.success) {
      throw new Error(data?.message || "Failed to fetch assessment reports");
    }

    const reports = Array.isArray(data.oaReports) ? data.oaReports : [];
    oaReportsCache.set(cacheKey, reports);
    return reports;
  } catch (error) {
    console.error("Error in getassessmentreports:", error);
    return [];
  }
}


