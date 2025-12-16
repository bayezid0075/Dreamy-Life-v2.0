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
      // Detect if username is email or phone
      const isEmail = username.includes("@");
      const loginData = {
        password,
      };

      if (isEmail) {
        loginData.email = username;
      } else {
        loginData.phone = username;
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
      const errorMsg = err?.response?.data?.detail || err?.message || "Login failed";
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: { message: errorMsg },
        },
      });
    }
  };

  const signup = async ({ username, email, phone_number, password, referred_by }) => {
    dispatch({
      type: "SIGNUP_REQUEST",
    });

    try {
      const signupData = {
        username,
        email,
        phone_number,
        password,
      };

      // Only include referred_by if provided
      if (referred_by && referred_by.trim() !== "") {
        signupData.referred_by = referred_by.trim();
      }

      const registerResponse = await axios.post("/api/users/register/", signupData);

      // After successful registration, automatically login
      const loginResponse = await axios.post("/api/users/login/", {
        email: email,
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
      // Handle validation errors from backend
      let errorMsg = "Signup failed";
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        // Handle field-specific errors
        if (typeof errorData === "object") {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMsg = firstError[0];
          } else if (typeof firstError === "string") {
            errorMsg = firstError;
          } else if (errorData.detail) {
            errorMsg = errorData.detail;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } else if (typeof errorData === "string") {
          errorMsg = errorData;
        }
      } else if (err?.message) {
        errorMsg = err.message;
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
    setSession(null);
    dispatch({ type: "LOGOUT" });
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
