export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "/api/auth";
export const SIGNUP_ROUTES = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTES = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;

export const VERIFY_EMAIL_ROUTES = `${AUTH_ROUTES}/verify-email`;
export const FORGOT_PASSWORD_ROUTES = `${AUTH_ROUTES}/forgot-password`;
export const RESET_PASSWORD_ROUTES = `${AUTH_ROUTES}/reset-password`;
export const UPDATE_PROFILE_ROUTES = `${AUTH_ROUTES}/update-profile`;
export const UPLOAD_PROFILE_IMAGE_ROUTES = `${AUTH_ROUTES}/upload-profile-image`;
export const REMOVE_PROFILE_IMAGE_ROUTES = `${AUTH_ROUTES}/delete-profile-image`;
export const CHANGE_PASSWORD_ROUTES = `${AUTH_ROUTES}/change-password`;
export const LOGOUT_ROUTES = `${AUTH_ROUTES}/logout`;
