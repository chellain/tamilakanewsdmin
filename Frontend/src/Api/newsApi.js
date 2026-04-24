import api from "./axiosConfig";
import { normalizeNewsPayload } from "../utils/media";

export const getAllNews = async () => {
  const response = await api.get("/news");
  return normalizeNewsPayload(response.data);
};

export const createNews = async (payload) => {
  const response = await api.post("/news", payload);
  return normalizeNewsPayload(response.data);
};

export const updateNews = async (id, payload) => {
  const response = await api.put(`/news/${id}`, payload);
  return normalizeNewsPayload(response.data);
};

export const deleteNews = async (id) => {
  const response = await api.delete(`/news/${id}`);
  return response.data;
};
