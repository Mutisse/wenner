// features/user/userTypes.ts

// Interface que representa um usuário
export interface User {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  photo?: string;
  phone?: string;
  role?: "admin" | "client" | "manager";
  password?: string;
  passwordConfirm?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrder?: string;
  active?: boolean;
}

// Estado do slice de usuário
export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  users: User[];
}

// Payload de login
export interface LoginPayload {
  email: string;
  password: string;
}

// Payload de cadastro
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
}

// Payload de atualização de perfil
export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

// Payload de alteração de senha
export interface UpdatePasswordPayload {
  passwordCurrent: string;
  password: string;
  passwordConfirm: string;
}

// Payload de reset de senha (via token)
export interface ResetPasswordPayload {
  password: string;
  passwordConfirm: string;
}

// Payload de resposta da API (login)
export interface LoginResponse {
  user: User;
  token: string;
}
