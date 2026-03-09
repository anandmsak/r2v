// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import axiosClient from "./axiosClient";

export const getActiveElections = () => axiosClient.get("/elections/active");
export const getAllElections = () => axiosClient.get("/elections/");
export const getElection = (id) => axiosClient.get(`/elections/${id}`);
export const createElection = (data) => axiosClient.post("/elections/", data);
export const startElection = (id) => axiosClient.post(`/elections/${id}/start`);
export const endElection = (id) => axiosClient.post(`/elections/${id}/end`);
export const archiveElection = (id) =>
  axiosClient.post(`/elections/${id}/archive`);
export const getCandidates = (electionId) =>
  axiosClient.get(`/candidates/${electionId}`);
export const addCandidate = (data) => axiosClient.post("/candidates/", data);
export const getResults = (electionId) =>
  axiosClient.get(`/results/${electionId}`);
