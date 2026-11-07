export type Account = {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "admin";
  mustChangePassword: boolean;
};

export type ManagedAccount = Account & {
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};
