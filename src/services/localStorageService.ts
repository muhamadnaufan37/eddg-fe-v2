export const setLocalStorage = (key: string, value: any) => {
  return localStorage.setItem(key, JSON.stringify(value));
};

export const getLocalStorage = (key: string) => {
  const item = localStorage.getItem(key);
  return item !== null ? JSON.parse(item) : null;
};

export const removeLocalStorage = (key: string) => {
  return localStorage.removeItem(key);
};

export const clearLocalStorage = () => {
  return localStorage.clear();
};
