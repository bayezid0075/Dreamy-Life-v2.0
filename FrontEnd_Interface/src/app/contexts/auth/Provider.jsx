// Import Dependencies
import { useEffect, useReducer } from "react";
import isObject from "lodash/isObject";
import PropTypes from "prop-types";
import isString from "lodash/isString";

// Local Imports
import axios from "utils/axios";
import { isTokenValid, setSession } from "utils/jwt";
import { AuthContext } from "./context";
import { isServer } from "utils/isServer";

// ----------------------------------------------------------------------

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },

  LOGIN_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  LOGIN_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
      errorMessage: null,
    };
  },

  LOGIN_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  SIGNUP_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  SIGNUP_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
      errorMessage: null,
    };
  },

  SIGNUP_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    errorMessage: null,
  }),
};

const reducer = (state, action) => {
  const handler = reducerHandlers[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        if (isServer) {
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
          return;
        }

        const authToken = window.localStorage.getItem("authToken");

        if (authToken && isTokenValid(authToken)) {
          setSession(authToken);

          try {
            const response = await axios.get("/api/users/userinfo/");
            const user = response.data;

            dispatch({
              type: "INITIALIZE",
              payload: {
                isAuthenticated: true,
                user,
              },
            });
          } catch (err) {
            // Token might be invalid, clear it
            setSession(null);
            dispatch({
              type: "INITIALIZE",
              payload: {
                isAuthenticated: false,
                user: null,
              },
            });
          }
        } else {
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  const login = async ({ username, password }) => {
    dispatch({
      type: "LOGIN_REQUEST",
    });

    try {
      // Clear any existing invalid tokens before login
      // This prevents old/invalid tokens from being sent with the login request
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("refreshToken");
      }

      // Validate inputs
      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      // Detect if username is email or phone number
      // Email contains @, phone is numeric
      const trimmedUsername = username.trim();
      const isEmail = trimmedUsername.includes("@");

      const loginData = {
        password: password.trim(),
      };

      // Only include the field that has a value (not both)
      if (isEmail) {
        loginData.email = trimmedUsername;
      } else {
        // Treat as phone number
        loginData.phone = trimmedUsername;
      }

      // Ensure we have at least one identifier
      if (!loginData.email && !loginData.phone) {
        throw new Error("Please provide either email or phone number");
      }

      const response = await axios.post("/api/users/login/", loginData);

      const { access, refresh } = response.data;

      if (!isString(access)) {
        throw new Error("Invalid response format");
      }

      // Store both tokens
      setSession(access);
      if (refresh && typeof window !== "undefined") {
        window.localStorage.setItem("refreshToken", refresh);
      }

      // Get user profile - token is now set in axios headers via setSession
      try {
        const profileResponse = await axios.get("/api/users/userinfo/");
        const user = profileResponse.data;

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
          },
        });
      } catch (profileErr) {
        // If userinfo fails, try to decode token for basic user info
        try {
          const { jwtDecode } = await import("jwt-decode");
          const decoded = jwtDecode(access);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: {
                id: decoded.user_id || decoded.id,
                username: decoded.username,
                email: decoded.email,
              },
            },
          });
        } catch (decodeErr) {
          // Fallback: login successful but no user data
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: null,
            },
          });
        }
      }
    } catch (err) {
      // Enhanced error handling
      let errorMsg =
        "Login failed. Please check your credentials and try again.";

      if (err?.response?.data) {
        const errorData = err.response.data;

        // Handle different error formats
        if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (typeof errorData === "string") {
          errorMsg = errorData;
        } else if (isObject(errorData)) {
          // Handle field-specific errors
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMsg = firstError[0];
          } else if (typeof firstError === "string") {
            errorMsg = firstError;
          }
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      // Handle network errors
      if (
        err?.code === "ERR_NETWORK" ||
        err?.message?.includes("Network Error")
      ) {
        errorMsg = "Network error. Please check your connection and try again.";
      }

      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: { message: errorMsg },
        },
      });
    }
  };

  const signup = async ({
    username,
    email,
    phone_number,
    password,
    referred_by,
  }) => {
    dispatch({
      type: "SIGNUP_REQUEST",
    });

    try {
      const signupData = {
        username: username?.trim(),
        email: email?.trim(),
        phone_number: phone_number?.trim(),
        password,
      };

      // Only include referred_by if provided and not empty
      // Backend now handles optional referred_by
      if (referred_by && referred_by.trim() !== "") {
        signupData.referred_by = referred_by.trim();
      }

      const registerResponse = await axios.post(
        "/api/users/register/",
        signupData,
      );

      // After successful registration, automatically login using email
      const loginResponse = await axios.post("/api/users/login/", {
        email: email?.trim(),
        password,
      });

      const { access, refresh } = loginResponse.data;

      if (!isString(access)) {
        throw new Error("Invalid response format");
      }

      // Store both tokens
      setSession(access);
      if (refresh && typeof window !== "undefined") {
        window.localStorage.setItem("refreshToken", refresh);
      }

      // Get user profile - token is now set in axios headers via setSession
      try {
        const profileResponse = await axios.get("/api/users/userinfo/");
        const user = profileResponse.data;

        dispatch({
          type: "SIGNUP_SUCCESS",
          payload: {
            user,
          },
        });
      } catch (profileErr) {
        // If userinfo fails, use data from registration response
        dispatch({
          type: "SIGNUP_SUCCESS",
          payload: {
            user: {
              id: registerResponse.data.user_id,
              username: registerResponse.data.username,
              email: registerResponse.data.email,
              referral_code: registerResponse.data.referral_code,
            },
          },
        });
      }
    } catch (err) {
      // Enhanced error handling for signup
      let errorMsg =
        "Signup failed. Please check your information and try again.";

      // Log error for debugging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.error("Signup error:", err);
        console.error("Error response:", err?.response?.data);
      }

      // Handle case where error might be a string (legacy from old interceptor)
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.response?.data) {
        const errorData = err.response.data;
        const statusCode = err.response.status;

        // Handle different error formats from Django REST Framework
        if (errorData.detail) {
          // DRF often uses 'detail' for general errors
          errorMsg = Array.isArray(errorData.detail)
            ? errorData.detail[0]
            : errorData.detail;
        } else if (errorData.message) {
          errorMsg = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message;
        } else if (typeof errorData === "string") {
          errorMsg = errorData;
        } else if (isObject(errorData)) {
          // Handle field-specific validation errors from DRF
          const errorKeys = Object.keys(errorData);

          if (errorKeys.length > 0) {
            // Check for non_field_errors first (general errors)
            if (errorData.non_field_errors) {
              const nonFieldError = errorData.non_field_errors;
              errorMsg = Array.isArray(nonFieldError)
                ? nonFieldError[0]
                : nonFieldError;
            } else {
              // Handle field-specific errors
              const firstKey = errorKeys[0];
              const firstError = errorData[firstKey];

              if (Array.isArray(firstError)) {
                // DRF typically returns arrays: {"field": ["error message"]}
                errorMsg = `${firstKey.replace(/_/g, " ")}: ${firstError[0]}`;
              } else if (typeof firstError === "string") {
                errorMsg = `${firstKey.replace(/_/g, " ")}: ${firstError}`;
              } else if (isObject(firstError)) {
                // Nested error object
                const nestedError = Object.values(firstError)[0];
                if (Array.isArray(nestedError)) {
                  errorMsg = `${firstKey.replace(/_/g, " ")}: ${nestedError[0]}`;
                } else if (typeof nestedError === "string") {
                  errorMsg = `${firstKey.replace(/_/g, " ")}: ${nestedError}`;
                }
              }
            }
          }
        }

        // Handle HTTP status code specific messages
        if (statusCode === 400) {
          // Bad request - validation error (already handled above)
        } else if (statusCode === 401) {
          errorMsg = "Unauthorized. Please check your credentials.";
        } else if (statusCode === 403) {
          errorMsg =
            "Forbidden. You don't have permission to perform this action.";
        } else if (statusCode === 404) {
          errorMsg = "Endpoint not found. Please contact support.";
        } else if (statusCode >= 500) {
          errorMsg = "Server error. Please try again later.";
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      // Handle network errors - check this first as it might not have response data
      if (
        err?.code === "ERR_NETWORK" ||
        err?.message?.includes("Network Error") ||
        err?.message?.includes("Failed to fetch") ||
        (!err?.response && err?.message)
      ) {
        errorMsg =
          "Cannot connect to server. Please ensure the backend server is running at " +
          (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      }

      // Handle timeout errors
      if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
        errorMsg = "Request timeout. Please try again.";
      }

      // Handle CORS errors specifically
      if (
        err?.message?.includes("CORS") ||
        err?.message?.includes("cross-origin") ||
        (err?.response?.status === 0 && !err?.response?.data)
      ) {
        errorMsg =
          "CORS error: Backend server may not be configured to allow requests from this origin. Please check CORS settings.";
      }

      dispatch({
        type: "SIGNUP_ERROR",
        payload: {
          errorMessage: { message: errorMsg },
        },
      });
    }
  };

  const logout = async () => {
    try {
      // Clear session and tokens
      setSession(null);

      // Clear all tokens from localStorage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("refreshToken");
      }

      // Dispatch logout action
      dispatch({ type: "LOGOUT" });

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Even if there's an error, clear everything and redirect
      setSession(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
      dispatch({ type: "LOGOUT" });
    }
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        ...state,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
