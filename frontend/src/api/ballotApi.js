// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

export const issueToken = (election_id) =>
  axiosClient.post("/ballot/token", { election_id });

export const castVote = (election_id, candidate_id, token) =>
  axiosClient.post("/ballot/cast", { election_id, candidate_id, token });

// ✅ Correct paths — backend uses /verify/ NOT /verification/
export const verifyReceipt = (receipt_id) =>
  axiosClient.get(`/verify/receipt/${receipt_id}`);

export const verifyChain = (election_id) =>
  axiosClient.get(`/verify/chain/${election_id}`);