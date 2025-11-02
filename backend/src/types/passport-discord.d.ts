declare module "passport-discord" {
  import { Strategy as PassportStrategy } from "passport";

  export interface Profile {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email?: string;
    verified?: boolean;
    locale?: string;
    mfa_enabled?: boolean;
    provider: "discord";
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export type VerifyCallback = (
    error: Error | null,
    user?: any,
    info?: any
  ) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
    authenticate(req: any, options?: any): void;
  }
}
