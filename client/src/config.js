const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://oilapp-42v8.onrender.com"
    : "http://localhost:5001";

export default BASE_URL;
