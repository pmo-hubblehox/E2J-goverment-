import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/profile",
  timeout: 10_000,
});

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProfile() {
  const { data } = await api.get("/me", { headers: getAuthHeader() });
  return data;
}

export async function saveProfile(profileData, isDraft = false) {
  const { data } = await api.post("/", { ...profileData, isDraft }, {
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
  });
  return data;
}

export async function getPrefill() {
  const { data } = await api.get("/prefill", { headers: getAuthHeader() });
  return data;
}
