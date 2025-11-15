"use client";

import { useEffect, useState } from "react";
import type { SupportReport } from "../types/support";
import { fetchReports } from "../services/supportReportsService";

export function useTickets() {
  const [tickets, setTickets] = useState<SupportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports()
      .then(setTickets)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { tickets, loading, error };
}
