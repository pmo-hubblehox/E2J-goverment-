import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startAiAnalysis(payload) {
  const { data } = await api.post(
    "/analyze",
    payload,
    {
      headers: getAuthHeaders(),
    }
  );
  return data;
}

export async function getAiAnalysisStatus(taskId) {
  const { data } = await api.get(`/status/${encodeURIComponent(taskId)}`, {
    headers: getAuthHeaders(),
  });
  return data;
}

export async function getAiAnalysisResult(taskId) {
  const { data } = await api.get(`/result/${encodeURIComponent(taskId)}`, {
    headers: getAuthHeaders(),
  });
  return data;
}

export async function suggestPositions(field) {
  const { data } = await api.post(
    "/suggest-positions",
    { field },
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );
  return data;
}
