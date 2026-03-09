// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState, useEffect } from "react";
import { getElection, getCandidates, getResults } from "../api/electionApi";

export function useElection(id) {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getElection(id).then((r) => r.data),
      getCandidates(id).then((r) => r.data),
    ])
      .then(([e, c]) => {
        setElection(e);
        setCandidates(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    getResults(id)
      .then((r) => setResults(r.data))
      .catch(() => {});
  }, [id]);

  function refresh() {
    if (!id) return;
    getElection(id)
      .then((r) => setElection(r.data))
      .catch(() => {});
    getResults(id)
      .then((r) => setResults(r.data))
      .catch(() => {});
  }

  return { election, candidates, results, loading, error, refresh };
}
