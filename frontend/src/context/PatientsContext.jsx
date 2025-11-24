import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { mockPatients } from "../data/mockPatients";

const PatientsContext = createContext(undefined);

export function PatientsProvider({ children }) {
  const [patients, setPatients] = useState(mockPatients);

  const normalizePatientShape = useCallback((patient) => {
    if (!patient) return null;

    return {
      id: patient.id || patient._id,
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
    (patientId) => patients.find((patient) => patient.id === patientId) || null,
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

  const value = useMemo(
    () => ({
      patients,
      findPatientById,
      findPatientByHealthId,
      upsertPatient,
      addPrescription,
      addDocument,
      updatePatientInfo,
    }),
    [
      patients,
      findPatientById,
      findPatientByHealthId,
      upsertPatient,
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
