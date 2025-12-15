const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://oilapp-42v8.onrender.com"
    : "";

export default API_BASE_URL;
