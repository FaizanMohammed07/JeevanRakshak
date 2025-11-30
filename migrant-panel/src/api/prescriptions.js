import api from "./client";

export const fetchMyPrescriptions = async () => {
  const { data } = await api.get("/prescriptions/my");
  return data.prescriptions || [];
};
