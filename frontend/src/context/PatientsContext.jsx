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

export function usePrescriptions(patientId) {
  const { findPatientById, fetchPatientPrescriptions } = usePatients();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get patient from cache to see if we already have prescriptions
  const patient = findPatientById(patientId);
  const prescriptions = patient?.prescriptions || [];

  useEffect(() => {
    // If patient exists but has no prescriptions loaded yet (or empty array), fetch them.
    // You might want to add a flag like 'hasLoadedPrescriptions' to the patient object
    // if you want to distinguish between "not fetched" and "empty list".
    // For now, we fetch every time the component mounts to be safe.

    if (!patientId) return;

    const load = async () => {
      setLoading(true);
      try {
        await fetchPatientPrescriptions(patientId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [patientId, fetchPatientPrescriptions]);

  return { prescriptions, loading, error };
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
      district: patient.district || "",
      taluk: patient.taluk || "",
      village: patient.village || "",
      address: patient.address || "",
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
        const response = await api.get(`/patients/${identifier}`);

        const payload = response.data;
        const patientData = payload?.patient || payload?.data;
        const savedPatient = upsertPatient(patientData);
        // console.log("raw data " + patientData);
        // console.log("saved patient " + savedPatient);

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
    async (patientId, prescriptionDetails) => {
      try {
        // 1. Make the API Call
        const response = await api.post("/prescriptions", {
          patientId,
          ...prescriptionDetails,
        });

        // 2. Extract the NEW prescription object from the response
        // (Adjust the path .data.prescription based on exactly what your backend sends)
        const newPrescription =
          response.data?.prescription || response.data?.data?.prescription;

        if (!newPrescription) {
          throw new Error("Server did not return the new prescription data");
        }

        // 3. Update the Patient in Local State manually
        // We find the patient by ID, keep all their existing data (...patient),
        // and just add the new prescription to the start of their list.
        updatePatientRecord(patientId, (patient) => ({
          ...patient,
          prescriptions: [newPrescription, ...(patient.prescriptions || [])],
        }));

        return newPrescription;
      } catch (err) {
        console.error("Add Prescription Error:", err);
        const message = err.response?.data?.msg || "Failed to add prescription";
        throw new Error(message);
      }
    },
    [updatePatientRecord] // We depend on this helper now, not upsertPatient
  );

  const fetchPatientPrescriptions = useCallback(
    async (patientId) => {
      try {
        // 1. Call API
        // Adjust URL based on your backend route (e.g., /patients/:id/prescriptions)
        const response = await api.get(`/prescriptions/patient/${patientId}`);
        console.log(response);
        // 2. Extract Data
        // Check if your backend returns { data: { prescriptions: [...] } } or just { prescriptions: [...] }
        const prescriptionsList =
          response.data?.data?.prescriptions ||
          response.data?.prescriptions ||
          [];

        // 3. Update Local State
        // We find the patient and specifically replace their 'prescriptions' array
        updatePatientRecord(patientId, (patient) => ({
          ...patient,
          prescriptions: prescriptionsList,
        }));

        return prescriptionsList;
      } catch (err) {
        console.error("Fetch Prescriptions Error:", err);
        const message =
          err.response?.data?.msg || "Failed to fetch prescriptions";
        throw new Error(message);
      }
    },
    [updatePatientRecord]
  );

  // --- UPDATED ADD DOCUMENT FUNCTION ---
  // --- UPDATED ADD DOCUMENT FUNCTION ---
  const addDocument = useCallback(
    async (patientId, docData) => {
      try {
        // The controller requires files, so we MUST use FormData
        if (!docData.file) {
          throw new Error("No file provided for upload");
        }

        const formData = new FormData();

        // 1. Append Metadata Fields (Matching req.body destructuring in controller)
        formData.append("patientId", patientId);
        formData.append("confirmedDisease", docData.confirmedDisease || "");
        formData.append("contagious", docData.contagious || false);

        // 2. Append the File
        // We use "images" as the key because your backend uses req.files (plural)
        // and returns 'imageUrls'.
        formData.append("images", docData.file);

        // 3. Call API: /prescriptions/images
        const response = await api.post("/prescriptions/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // 4. Extract the returned prescription object
        // Controller returns: { msg: "...", prescription: { ... } }
        const savedDocument =
          response.data?.prescription || response.data?.data;

        if (!savedDocument) {
          throw new Error("Server did not return the new document data");
        }

        // 5. Update Local State
        // We add this to the 'documents' list so it shows up in the UI immediately.
        // Note: Ensure your UI can render the fields returned by 'savedDocument' (which is a Prescription object).
        updatePatientRecord(patientId, (patient) => ({
          ...patient,
          // We assume this 'prescription' counts as a document in your UI logic
          documents: [savedDocument, ...(patient.documents || [])],
        }));

        return savedDocument;
      } catch (err) {
        console.error("Add Document Error:", err);
        const message =
          err.response?.data?.msg ||
          err.response?.data?.error ||
          "Failed to upload document";
        throw new Error(message);
      }
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
      fetchPatientPrescriptions,
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
      fetchPatientPrescriptions,
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
