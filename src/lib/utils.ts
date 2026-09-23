import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { AxiosInstance } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuração da URL base
// Lê SEMPRE do .env (VITE_API_URL)
function getBaseURL(): string {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    console.warn("⚠️  VITE_API_URL não definido no .env — usando localhost:9000");
    return "http://localhost:9000";
  }

  return url;
}

// Exporta a URL base para uso em imagens e outros recursos
export const productionUrl: string = getBaseURL();

const baseURL = getBaseURL();

console.log("🌐 API Base URL:", baseURL);

// Não define Content-Type global — uploads com FormData precisam
// que o browser defina o boundary correto.
export const customFetch: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // 30s (Render Free tem cold start de ~30s)
});

// Interceptor: adiciona token JWT se existir
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: trata erros
customFetch.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não remove token automaticamente — deixa as actions tratarem
    return Promise.reject(error);
  }
);