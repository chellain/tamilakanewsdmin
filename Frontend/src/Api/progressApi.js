import api from "./axiosConfig";

export const getProgress = async (limit = 50) => {
  const response = await api.get(`/progress?limit=${limit}`);
  return response.data;
};

export const logProgress = async (payload) => {
  const response = await api.post("/progress", payload);
  return response.data;
};
