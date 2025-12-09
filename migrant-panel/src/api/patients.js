import api from "./client";

export const loginPatient = async ({ phoneNumber, password }) => {
  const { data } = await api.post("/patients/login", {
    phoneNumber,
    password,
  });
  return data;
};

export const fetchMyProfile = async () => {
  const { data } = await api.get("/patients/me");
  return data.patient;
};

export const fetchMyLabReports = async () => {
  const { data } = await api.get("/patients/me/labs");
  return data.documents || [];
};

export const signupPatient = async (patientData) => {
  const { data } = await api.post("/patients/signup", patientData);
  return data;
};
