export interface JwtPayload {
    email: string;
    sub: string; // ou string, dependendo do tipo do ID
    is_admin: boolean;
  }