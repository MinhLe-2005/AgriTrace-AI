export type UserRole =
  | "ADMIN"
  | "USER"
  | "FARMER"
  | "WAREHOUSE"
  | "WAREHOUSE_STAFF"
  | "DISTRIBUTOR"
  | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  roles: UserRole[];
}
