// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("r2v_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    // Pydantic v2 validation errors come as an array of objects
    let raw;
    if (Array.isArray(detail)) {
      raw = detail[0]?.msg || "Validation error";
    } else {
      raw = detail || err.message || "Request failed";
    }

    // Replace any Pydantic internal messages with clean user-facing strings
    const lower = (raw || "").toLowerCase();
    let clean = raw;
    if (lower.includes("string should have") || lower.includes("value error"))
      clean = "Please fill in all required fields correctly.";

    return Promise.reject(new Error(clean));
  }
);

export default axiosClient;
