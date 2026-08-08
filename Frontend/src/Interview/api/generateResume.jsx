const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3639";

export const generateReportByAI = async (
  jobDescription,
  selfDescription,
  resume
) => {
  if (!jobDescription || !selfDescription || !resume) {
    throw new Error("Please fill all the fields");
  }

  const formData = new FormData();

  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  formData.append("resume", resume);

  const response = await fetch(
    `${BASE_URL}/api/ai/generate-interview-report`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }
  );
  console.log("im falling after api call")
  console.log(response)
  const result = await response.json();

console.log(result);

if (!response.ok) {
  throw new Error(result.message || "Failed to generate report.");
}

return result;
  console.log("Response from  ai gnerate report API:", response);

  return await response.json();
};