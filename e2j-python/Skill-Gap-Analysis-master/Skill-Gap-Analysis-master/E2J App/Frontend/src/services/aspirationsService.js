import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getAspirations() {
  const token = localStorage.getItem("token");
  const { data } = await axios.get(`${API_BASE_URL}/aspirations/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}

export async function createAspirations(payload) {
  const token = localStorage.getItem("token");
  const { data } = await axios.post(`${API_BASE_URL}/aspirations`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}

export async function updateCertifications(payload) {
  const token = localStorage.getItem("token");
  const { data } = await axios.put(`${API_BASE_URL}/aspirations/certifications`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}
