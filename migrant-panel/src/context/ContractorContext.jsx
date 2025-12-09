import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as contractorsApi from "../api/contractors";

const ContractorContext = createContext(undefined);

export function ContractorProvider({ children }) {
  const [contractor, setContractor] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await contractorsApi.fetchContractorProfile();
      setContractor(data || null);
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to fetch profile"
      );
      setContractor(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const data = await contractorsApi.listWorkers();
      // backend returns { workers, count }
      setWorkers(data.workers || []);
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to list workers"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createWorker = async (workerPayload) => {
    setLoading(true);
    try {
      const data = await contractorsApi.addWorker(workerPayload);
      // data.worker expected
      if (data.worker) setWorkers((w) => [data.worker, ...w]);
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to add worker"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const linkWorker = async (phoneNumber) => {
    setLoading(true);
    try {
      const data = await contractorsApi.linkWorkerByPhone(phoneNumber);
      // Refresh full worker list to ensure consistent shape from backend
      await fetchWorkers();
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to link worker"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeWorker = async (workerId) => {
    setLoading(true);
    try {
      const data = await contractorsApi.removeWorker(workerId);
      // Refresh full list to reflect DB state
      await fetchWorkers();
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to remove worker"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAlert = async (workerId) => {
    setLoading(true);
    try {
      const data = await contractorsApi.clearWorkerAlert(workerId);
      // refresh list to get updated alert state
      await fetchWorkers();
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to clear alert"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const broadcast = async ({ title, message }) => {
    setLoading(true);
    try {
      const data = await contractorsApi.broadcastToPatients({ title, message });
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Failed to broadcast");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      contractor,
      workers,
      loading,
      error,
      fetchProfile,
      fetchWorkers,
      createWorker,
      linkWorker,
      removeWorker,
      clearAlert,
      broadcast,
      setContractor,
    }),
    [contractor, workers, loading, error]
  );

  return (
    <ContractorContext.Provider value={value}>
      {children}
    </ContractorContext.Provider>
  );
}

export function useContractor() {
  const ctx = useContext(ContractorContext);
  if (!ctx)
    throw new Error("useContractor must be used within ContractorProvider");
  return ctx;
}
