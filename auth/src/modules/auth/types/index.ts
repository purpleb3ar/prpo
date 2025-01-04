export enum Provider {
  Local,
  Google,
}

export enum UserRole {
  Admin,
  User,
}

export interface TokenPayload {
  id: string;
  provider: Provider;
  role: UserRole;
}
