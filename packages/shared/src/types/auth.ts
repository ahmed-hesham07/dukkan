export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  businessName: string;
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  username: string;
  role: 'owner' | 'cashier';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
