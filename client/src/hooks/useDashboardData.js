import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

const REFRESH_INTERVAL = 30000; // 30 seconds

export const useDashboardData = () => {
  const [data, setData] = useState({
    overallStats: null,
    userStats: null,
    messageStats: null,
    roomStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const endpoints = [
        "/api/admin/dashboard/stats",
        "/api/admin/dashboard/user-stats",
        "/api/admin/dashboard/message-stats",
        "/api/admin/dashboard/room-stats",
      ];

      const [overall, users, messages, rooms] = await Promise.all(
        endpoints.map((endpoint) =>
          apiClient
            .get(endpoint, { withCredentials: true })
            .then((res) => res.data.data)
        )
      );

      setData({
        overallStats: overall,
        userStats: users,
        messageStats: messages,
        roomStats: rooms,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Set up refresh interval
  useEffect(() => {
    const intervalId = setInterval(fetchStats, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchStats,
  };
};
