import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMyProfile, fetchMyLabReports } from "../api/patients";
import { fetchMyPrescriptions } from "../api/prescriptions";
import { useAuth } from "./AuthContext";
import api from "../api/client";

const PatientsContext = createContext(undefined);

export function usePatientReports(patientId) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    const fetchReports = async () => {
      try {
        const res = await api.get(`/reports/patient/${patientId}`);
        setReports(res.data?.reports || []);
        console.log(res.data?.reports);
      } catch (err) {
        setError("Could not load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [patientId]);

  return { reports, loading, error };
}

export function PatientsProvider({ children }) {
  const { patient: authPatient, setPatient: syncPatient } = useAuth();

  const [profile, setProfile] = useState(authPatient);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);

  const [status, setStatus] = useState({
    profile: "idle",
    prescriptions: "idle",
    labs: "idle",
  });

  const [errors, setErrors] = useState({
    profile: null,
    prescriptions: null,
    labs: null,
  });

  useEffect(() => {
    setProfile(authPatient);
  }, [authPatient]);

  useEffect(() => {
    if (!authPatient) {
      setPrescriptions([]);
      setLabReports([]);
      setStatus({ profile: "idle", prescriptions: "idle", labs: "idle" });
      setErrors({ profile: null, prescriptions: null, labs: null });
    }
  }, [authPatient]);

  const updateStatus = useCallback((key, value) => {
    setStatus((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateError = useCallback((key, value) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadProfile = useCallback(
    async (force = false) => {
      if (!force && (profile || status.profile === "success")) return profile;
      if (status.profile === "loading") return profile;
      updateStatus("profile", "loading");
      try {
        const data = await fetchMyProfile();
        setProfile(data);
        syncPatient(data);
        updateError("profile", null);
        updateStatus("profile", "success");
        return data;
      } catch (err) {
        const message =
          err.response?.data?.msg || err.message || "Unable to load profile";
        updateError("profile", message);
        updateStatus("profile", "error");
        throw err;
      }
    },
    [profile, status.profile, syncPatient, updateError, updateStatus]
  );

  const loadPrescriptions = useCallback(
    async (force = false) => {
      if (!force) {
        if (prescriptions.length) return prescriptions;
        if (status.prescriptions === "success") return prescriptions;
      }
      if (status.prescriptions === "loading") return prescriptions;
      updateStatus("prescriptions", "loading");
      try {
        const data = await fetchMyPrescriptions();
        setPrescriptions(data);
        updateError("prescriptions", null);
        updateStatus("prescriptions", "success");
        return data;
      } catch (err) {
        const message =
          err.response?.data?.msg ||
          err.message ||
          "Unable to load prescriptions";
        updateError("prescriptions", message);
        updateStatus("prescriptions", "error");
        throw err;
      }
    },
    [prescriptions, status.prescriptions, updateError, updateStatus]
  );

  const loadLabReports = useCallback(
    async (force = false) => {
      if (!force) {
        if (labReports.length) return labReports;
        if (status.labs === "success") return labReports;
      }
      if (status.labs === "loading") return labReports;
      updateStatus("labs", "loading");
      try {
        const data = await fetchMyLabReports();
        setLabReports(data);
        updateError("labs", null);
        updateStatus("labs", "success");
        return data;
      } catch (err) {
        const message =
          err.response?.data?.msg ||
          err.message ||
          "Unable to load lab reports";
        updateError("labs", message);
        updateStatus("labs", "error");
        throw err;
      }
    },
    [labReports, status.labs, updateError, updateStatus]
  );

  const value = useMemo(
    () => ({
      profile,
      prescriptions,
      labReports,
      status,
      errors,
      loadProfile,
      loadPrescriptions,
      loadLabReports,
    }),
    [
      profile,
      prescriptions,
      labReports,
      status,
      errors,
      loadProfile,
      loadPrescriptions,
      loadLabReports,
    ]
  );

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePatientData() {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error("usePatientData must be used within PatientsProvider");
  }
  return context;
}
