// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

// Step 0 — check if register number exists in DB before sending OTP
export const checkUser = (register_number) =>
  axiosClient.post("/auth/check-user", { register_number });

// Step 1 — request OTP (only called after checkUser succeeds)
export const requestOtp = (register_number) =>
  axiosClient.post("/auth/request-otp", { register_number });

// Step 2 — verify OTP and receive JWT
export const verifyOtp = (register_number, otp) =>
  axiosClient.post("/auth/verify-otp", { register_number, otp });

// Admin self-registration (requires invite_key from .env)
export const adminRegister = (data) =>
  axiosClient.post("/auth/admin/register", data);
