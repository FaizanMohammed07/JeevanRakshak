import api from "./client";

export const loginEmployer = async ({ phoneNumber, password }) => {
  const { data } = await api.post("/employers/login", {
    phoneNumber,
    password,
  });
  return data;
};

export const signupEmployer = async ({
  name,
  phoneNumber,
  password,
  passwordConfirm,
}) => {
  const { data } = await api.post("/employers/signup", {
    name,
    phoneNumber,
    password,
    passwordConfirm,
  });
  return data;
};

export const fetchEmployerProfile = async () => {
  const { data } = await api.get("/employers/me");
  return data.employer;
};

export const listContractorsForEmployer = async () => {
  const { data } = await api.get("/employers/contractors");
  return data;
};

export const linkContractorByPhone = async (phoneNumber) => {
  const { data } = await api.post("/employers/contractors/link", {
    phoneNumber,
  });
  return data;
};

export const unlinkContractor = async (contractorId) => {
  const { data } = await api.delete(`/employers/contractors/${contractorId}`);
  return data;
};

export const broadcastToContractors = async ({ title, message }) => {
  const { data } = await api.post(`/employers/contractors/broadcast`, {
    title,
    message,
  });
  return data;
};

export const fetchContractorDetails = async (contractorId) => {
  const { data } = await api.get(`/employers/contractors/${contractorId}`);
  return data;
};

export const pingContractorById = async (contractorId, message) => {
  const { data } = await api.post(`/employers/contractors/${contractorId}/ping`, { message });
  return data;
};

export default {
  loginEmployer,
  signupEmployer,
  fetchEmployerProfile,
  listContractorsForEmployer,
  linkContractorByPhone,
  unlinkContractor,
};
