import api from "./axiosConfig";

export const uploadThumbnail = async (thumbnailFile) => {
  const formData = new FormData();
  formData.append("thumbnail", thumbnailFile);

  const response = await api.post("/uploads/thumbnail", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const uploadVideoWithThumbnail = async (videoFile, thumbnailFile) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("thumbnail", thumbnailFile);

  const response = await api.post("/uploads/video", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
