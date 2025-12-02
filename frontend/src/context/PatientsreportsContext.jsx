import { useEffect, useState } from "react";
import api from "../api/axios";

export function usePatientReports(patientId) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    const fetchReports = async () => {
      try {
        console.log(patientId);
        const res = await api.get(`/reports/patient/${patientId}`);
        setReports(res.data?.reports || []);
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


