import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
// import { mockPatients } from "../data/mockPatients"; // FIX 1: Comment out mock data
import api from "../api/axios";
const PatientsContext = createContext(undefined);

// A smart hook that handles the cache-or-fetch logic for you
export function useFetchPatient(patientId) {
  const { findPatientById, fetchPatient } = usePatients();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Check Cache immediately
  const cachedPatient = findPatientById(patientId);

  useEffect(() => {
    // If we have data in cache, we don't need to load!
    if (cachedPatient) {
      setLoading(false);
      return;
    }

    // If not, we fetch
    const load = async () => {
      setLoading(true);
      try {
        await fetchPatient(patientId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) load();
  }, [patientId, cachedPatient, fetchPatient]);

  // Return the cached patient if available (instant), otherwise the fetch status
  return { patient: cachedPatient, loading, error };
}

export function PatientsProvider({ children }) {
  // FIX 1: Start with empty array for real production feel
  const [patients, setPatients] = useState([]);

  const normalizePatientShape = useCallback((patient) => {
    if (!patient) return null;

    return {
      // Ensure we catch MongoDB's '_id' or a string 'id'
      id: patient.id || patient._id || patient.migrant_health_id,
      migrant_health_id:
        patient.migrant_health_id ||
        patient.health_id ||
        patient.phoneNumber ||
        "",
      name: patient.name || "Unknown",
      age: patient.age ?? null,
      gender: patient.gender || "",
      blood_group: patient.blood_group || patient.bloodGroup || "",
      emergency_contact:
        patient.emergency_contact || patient.emergencyContact || "",
      photo_url: patient.photo_url || patient.photoUrl || "",
      allergies: patient.allergies || [],
      chronic_diseases:
        patient.chronic_diseases || patient.chronicDiseases || [],
      current_medication:
        patient.current_medication || patient.currentMedication || [],
      vaccinations: patient.vaccinations || [],
      visits: patient.visits || [],
      prescriptions: patient.prescriptions || [],
      documents: patient.documents || [],
    };
  }, []);

  const findPatientById = useCallback(
    (patientId) => {
      // Loose check (==) allows matching string "123" with number 123 if needed
      return (
        patients.find(
          (patient) =>
            patient.id == patientId || patient.migrant_health_id == patientId
        ) || null
      );
    },
    [patients]
  );

  const findPatientByHealthId = useCallback(
    (healthId) => {
      if (!healthId) return null;
      const normalizedId = healthId.trim().toLowerCase();
      return (
        patients.find(
          (patient) => patient.migrant_health_id.toLowerCase() === normalizedId
        ) || null
      );
    },
    [patients]
  );

  const updatePatientRecord = useCallback((patientId, updater) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.id === patientId ? updater(patient) : patient
      )
    );
  }, []);

  const upsertPatient = useCallback(
    (patient) => {
      const normalized = normalizePatientShape(patient);
      if (!normalized || !normalized.id) return null;

      setPatients((prevPatients) => {
        const exists = prevPatients.some((item) => item.id === normalized.id);
        if (exists) {
          return prevPatients.map((item) =>
            item.id === normalized.id ? { ...item, ...normalized } : item
          );
        }
        return [normalized, ...prevPatients];
      });

      return normalized;
    },
    [normalizePatientShape]
  );

  // --- API FETCH FUNCTION ---
  const fetchPatient = useCallback(
    async (identifier) => {
      try {
        console.log("identifier = " + identifier);
        const response = await api.get(`/patients/${identifier}`);

        const payload = response.data;
        const patientData = payload?.patient || payload?.data;
        const savedPatient = upsertPatient(patientData);

        return savedPatient;
      } catch (err) {
        console.error("Context Fetch Error:", err);
        const message = err.response?.data?.msg || "Patient not found";
        throw new Error(message);
      }
    },
    [upsertPatient]
  );

  const addPrescription = useCallback(
    (patientId, newPrescription) => {
      updatePatientRecord(patientId, (patient) => ({
        ...patient,
        prescriptions: [newPrescription, ...(patient.prescriptions || [])],
      }));
    },
    [updatePatientRecord]
  );

  const addDocument = useCallback(
    (patientId, newDocument) => {
      updatePatientRecord(patientId, (patient) => ({
        ...patient,
        documents: [newDocument, ...(patient.documents || [])],
      }));
    },
    [updatePatientRecord]
  );

  const updatePatientInfo = useCallback(
    (
      patientId,
      {
        allergies,
        chronicDiseases,
        currentMedication,
        emergencyContact,
        bloodGroup,
      }
    ) => {
      updatePatientRecord(patientId, (patient) => ({
        ...patient,
        allergies,
        chronic_diseases: chronicDiseases,
        current_medication: currentMedication,
        emergency_contact: emergencyContact,
        blood_group: bloodGroup,
      }));
    },
    [updatePatientRecord]
  );

  // FIX 2: Add fetchPatient to the value object
  const value = useMemo(
    () => ({
      patients,
      findPatientById,
      findPatientByHealthId,
      upsertPatient,
      fetchPatient, // <--- CRITICAL: This was missing!
      addPrescription,
      addDocument,
      updatePatientInfo,
    }),
    [
      patients,
      findPatientById,
      findPatientByHealthId,
      upsertPatient,
      fetchPatient, // <--- Add to dependency array
      addPrescription,
      addDocument,
      updatePatientInfo,
    ]
  );

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientsProvider");
  }
  return context;
}
