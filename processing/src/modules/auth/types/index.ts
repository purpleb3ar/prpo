export enum Provider {
  Local,
  Google,
}

export enum UserRole {
  Admin,
  User,
}

export interface TokenPayload {
  username: string;
  id: string;
  provider: Provider;
  role: UserRole;
}
