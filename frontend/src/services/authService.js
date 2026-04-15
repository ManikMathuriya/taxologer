import api from "./api";

export const registerUser = async (payload) => {
  const response = await api.post("/register/", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await api.post("/login/", payload);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};