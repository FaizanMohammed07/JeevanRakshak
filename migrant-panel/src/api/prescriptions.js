import api from "./client";

export const fetchMyPrescriptions = async () => {
  const { data } = await api.get("/prescriptions/my");
  return data.prescriptions || [];
};

export const requestPrescriptionSpeech = async (
  prescriptionId,
  lang = "en",
  options = {}
) => {
  const params = { lang };
  if (options.previewOnly) {
    params.previewOnly = true;
  }
  const { data } = await api.get(`/prescriptions/${prescriptionId}/tts`, {
    params,
  });
  return data;
};
