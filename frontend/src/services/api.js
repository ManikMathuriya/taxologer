import axios from "axios";

export const API_BASE_URL = "https://api.taxologer.online/api";
export const MEDIA_BASE_URL = "https://api.taxologer.online";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const normalizeFileUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  return `${MEDIA_BASE_URL}${url}`;
};

export default api;