export const HOST = import.meta.env.VITE_SERVER_URL;

export const ADMIN_ROUTES = "/api/admin";
export const ADMIN_LOGIN_ROUTES = `${ADMIN_ROUTES}/login`;
export const ADMIN_CHANGE_PASSWORD_ROUTES = `${ADMIN_ROUTES}/change-password`;
export const ADMIN_FORGOT_PASSWORD_ROUTES = `${ADMIN_ROUTES}/forgot-password`;
export const ADMIN_RESET_PASSWORD_ROUTES = `${ADMIN_ROUTES}/reset-password`;
