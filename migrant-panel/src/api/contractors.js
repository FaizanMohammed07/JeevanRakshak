import api from "./client";

// Login a contractor
export const loginContractor = async ({ phoneNumber, password }) => {
  // Route placeholder: Adjust "/contractors/login" to your actual backend endpoint
  const { data } = await api.post("/contractors/login", {
    phoneNumber,
    password,
  });
  return data;
};

// Register a new contractor
export const signupContractor = async ({
  name,
  phoneNumber,
  password,
  passwordConfirm,
}) => {
  // Route placeholder: Adjust "/contractors/signup" to your actual backend endpoint
  const { data } = await api.post("/contractors/signup", {
    name,
    phoneNumber,
    password,
    passwordConfirm,
  });
  return data;
};

// Fetch the currently logged-in contractor's profile
export const fetchContractorProfile = async () => {
  // Route placeholder: Adjust "/contractors/me" to your actual backend endpoint
  const { data } = await api.get("/contractors/me");

  // Assuming the backend returns { contractor: { ... } } similar to patients
  return data.contractor;
};

// List workers for current contractor
export const listWorkers = async () => {
  const { data } = await api.get("/contractors/workers");
  return data;
};

// Get a single worker by id
export const getWorker = async (workerId) => {
  const { data } = await api.get(`/contractors/workers/${workerId}`);
  return data;
};

// Create a new worker under current contractor
export const addWorker = async (worker) => {
  const { data } = await api.post("/contractors/workers", worker);
  return data;
};

// Link an existing patient to contractor by phone
export const linkWorkerByPhone = async (phoneNumber) => {
  const { data } = await api.post("/contractors/workers/link", { phoneNumber });
  return data;
};

// Remove a worker by id
export const removeWorker = async (workerId) => {
  const { data } = await api.delete(`/contractors/workers/${workerId}`);
  return data;
};

// Update a worker's details (address/village/taluk/district)
export const updateWorker = async (workerId, payload) => {
  const { data } = await api.put(`/contractors/workers/${workerId}`, payload);
  return data;
};

// Clear contagious alert on worker
export const clearWorkerAlert = async (workerId) => {
  const { data } = await api.post(
    `/contractors/workers/${workerId}/clear-alert`
  );
  return data;
};

// Broadcast message to all patients linked to contractor
export const broadcastToPatients = async ({ title, message }) => {
  const { data } = await api.post(`/contractors/broadcast`, { title, message });
  return data;
};
