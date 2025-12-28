import { jwtDecode } from "jwt-decode";
import axios from "./axios";
import { isServer } from "./isServer";

/**
 * Checks if the provided JWT token is valid.
 * For extended sessions, we check if token exists and is decodable.
 * Expiration check is lenient - we'll rely on refresh tokens for renewal.
 *
 * @param {string} authToken - The JWT token to validate.
 * @returns {boolean} - Returns `true` if the token exists and is decodable, otherwise `false`.
 */
const isTokenValid = (authToken) => {
  if (typeof authToken !== "string" || authToken.trim() === "") {
    return false;
  }

  try {
    const decoded = jwtDecode(authToken);
    // Just check if token is decodable - expiration will be handled by refresh mechanism
    // This allows users to stay logged in longer
    return decoded && typeof decoded === "object";
  } catch (err) {
    console.error("Failed to decode token:", err);
    return false;
  }
};

/**
 * Sets or removes the authentication token in local storage and axios headers.
 *
 * @param {string} [authToken] - The JWT token to set. If `undefined` or `null`, the session will be cleared.
 */
const setSession = (authToken) => {
  if (isServer) {
    // On server, only set axios headers
    if (typeof authToken === "string" && authToken.trim() !== "") {
      axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
    return;
  }

  if (typeof authToken === "string" && authToken.trim() !== "") {
    // Store token in local storage and set authorization header for axios
    localStorage.setItem("authToken", authToken);
    axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  } else {
    // Remove token from local storage and delete authorization header from axios
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common.Authorization;
  }
};

export { isTokenValid, setSession };
