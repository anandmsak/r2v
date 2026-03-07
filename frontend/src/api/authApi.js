// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

export const requestOtp = (register_number) =>
  axiosClient.post("/auth/request-otp", { register_number });

export const verifyOtp = (register_number, otp) =>
  axiosClient.post("/auth/verify-otp", { register_number, otp });
