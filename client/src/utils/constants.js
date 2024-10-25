export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "/api/auth";
export const SIGNUP_ROUTES = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTES = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;

export const VERIFY_EMAIL_ROUTES = `${AUTH_ROUTES}/verify-email`;
export const FORGOT_PASSWORD_ROUTES = `${AUTH_ROUTES}/forgot-password`;
export const RESET_PASSWORD_ROUTES = `${AUTH_ROUTES}/reset-password`;
