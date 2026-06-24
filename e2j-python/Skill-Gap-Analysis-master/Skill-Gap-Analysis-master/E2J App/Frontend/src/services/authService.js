import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/auth",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

export async function sendOtp({ email, flow }) {
  const { data } = await api.post("/send-otp", { email, flow });
  return data;
}

export async function verifyOtp({ email, otp }) {
  const { data } = await api.post("/verify-otp", { email, otp });
  return data;
}

export async function createPassword({ email, password }) {
  const { data } = await api.post("/register", { email, password });
  return data;
}

export async function resetPassword({ email, password }) {
  const { data } = await api.post("/reset-password", { email, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post("/login", { email, password });
  return data;
}

export async function instituteLogin({ email, password }) {
  const { data } = await axios.post("http://localhost:5000/api/institute/login", { email, password });
  return data;
}
