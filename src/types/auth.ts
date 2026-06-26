export type AuthUserRole =
  | "STUDENT"
  | "STAFF"
  | "ADMIN";

export type LoginRole =
  | "student"
  | "staff";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  studentId: string | null;
  role: AuthUserRole;
  createdAt: string;
};

export type RegisterStudentInput = {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
  role: LoginRole;
};

export type AuthUserResponse = {
  success: true;
  data: {
    user: AuthUser;
  };
  message?: string;
};

export type AuthMessageResponse = {
  success: true;
  message: string;
};

export type AuthErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};