// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

export const addEligibleVoter = (election_id, register_number) =>
  axiosClient.post("/eligibility/add", { election_id, register_number });

export const uploadEligibilityCSV = (election_id, file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("election_id", election_id);
  return axiosClient.post("/eligibility/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAuditChain = (election_id) =>
  axiosClient.get(`/verification/chain/${election_id}`);
