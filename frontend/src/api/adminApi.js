// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

export const addEligibleVoter = (election_id, register_number) =>
  axiosClient.post("/eligibility/add", { election_id, register_number });

export const uploadEligibilityCSV = (election_id, file) => {
  const form = new FormData();
  form.append("file", file);
  // ✅ election_id goes in the URL path, matching backend route /eligibility/upload/{election_id}
  return axiosClient.post(`/eligibility/upload/${election_id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAuditChain = (election_id) =>
  axiosClient.get(`/verify/chain/${election_id}`);
