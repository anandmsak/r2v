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
    const msg = err.response?.data?.detail || err.message || "Request failed";
    return Promise.reject(new Error(Array.isArray(msg) ? msg[0]?.msg : msg));
  }
);

export default axiosClient;
