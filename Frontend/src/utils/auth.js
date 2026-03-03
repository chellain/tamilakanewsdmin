const TOKEN_KEY = "userToken";
const USER_KEY = "userData";

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getAuthToken());
};

export const setAuth = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  notifyAuthChanged();
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChanged();
};

export const notifyAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authChanged"));
  }
};
