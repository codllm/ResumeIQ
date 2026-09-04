const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3639";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed. Please try again.");
  }

  return result;
}

export function getCareerProfiles() {
  return request("/api/ai/career-profiles");
}

export function createCareerProfile({ name, targetRole, resume, jobDescription, selfDescription }) {
  const formData = new FormData();
  if (name) formData.append("name", name);
  if (targetRole) formData.append("targetRole", targetRole);
  if (jobDescription) formData.append("jobDescription", jobDescription);
  if (selfDescription) formData.append("selfDescription", selfDescription);
  if (resume) formData.append("resume", resume);

  return request("/api/ai/career-profile", {
    method: "POST",
    body: formData,
  });
}

export function generateReportByProfile(careerProfileId, reportType = "base") {
  return request("/api/ai/generate-interview-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ careerProfileId, reportType }),
  });
}


