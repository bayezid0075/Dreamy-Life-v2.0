export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName?: string;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserProps {
  email: string;
  passwordHash: string;
  fullName?: string;
  isVerified?: boolean;
  verificationCode?: string;
}
