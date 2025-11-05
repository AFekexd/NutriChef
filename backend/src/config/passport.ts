import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(
              new Error("No email found in Google profile"),
              undefined
            );
          }

          // Check if user exists with this OAuth provider
          let user = await prisma.user.findFirst({
            where: {
              oauthProvider: "google",
              oauthId: profile.id,
            },
          });

          if (!user) {
            // Check if email is already registered
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });

            if (existingUser) {
              // Link OAuth to existing account
              user = await prisma.user.update({
                where: { userId: existingUser.userId },
                data: {
                  oauthProvider: "google",
                  oauthId: profile.id,
                  oauthAvatar: profile.photos?.[0]?.value,
                  isEmailVerified: true,
                },
              });
            } else {
              // Create new user
              user = await prisma.user.create({
                data: {
                  name: profile.displayName || "Google User",
                  email,
                  passwordHash: null, // OAuth users don't have passwords
                  oauthProvider: "google",
                  oauthId: profile.id,
                  oauthAvatar: profile.photos?.[0]?.value,
                  isEmailVerified: true,
                },
              });
            }
          } else {
            // Update existing user's avatar in case it changed
            user = await prisma.user.update({
              where: { userId: user.userId },
              data: {
                oauthAvatar: profile.photos?.[0]?.value,
              },
            });
          }

          return done(null, user as any);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Discord OAuth Strategy
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  console.log("Configuring Discord OAuth Strategy");
  console.log("DISCORD_CLIENT_ID:", process.env.DISCORD_CLIENT_ID);
  console.log("DISCORD_CLIENT_SECRET:", process.env.DISCORD_CLIENT_SECRET);
  console.log("BACKEND_URL:", process.env.BACKEND_URL);
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/discord/callback`,
        scope: ["identify", "email"],
      },
      async (accessToken: any, refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.email;
          if (!email) {
            return done(
              new Error("No email found in Discord profile"),
              undefined
            );
          }

          // Check if user exists with this OAuth provider
          let user = await prisma.user.findFirst({
            where: {
              oauthProvider: "discord",
              oauthId: profile.id,
            },
          });

          if (!user) {
            // Check if email is already registered
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });

            if (existingUser) {
              // Link OAuth to existing account
              user = await prisma.user.update({
                where: { userId: existingUser.userId },
                data: {
                  oauthProvider: "discord",
                  oauthId: profile.id,
                  oauthAvatar: profile.avatar
                    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                    : undefined,
                  isEmailVerified: profile.verified || true,
                },
              });
            } else {
              // Create new user
              user = await prisma.user.create({
                data: {
                  name: profile.username || "Discord User",
                  email,
                  passwordHash: null, // OAuth users don't have passwords
                  oauthProvider: "discord",
                  oauthId: profile.id,
                  oauthAvatar: profile.avatar
                    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                    : undefined,
                  isEmailVerified: profile.verified || true,
                },
              });
            }
          } else {
            // Update existing user's avatar in case it changed
            user = await prisma.user.update({
              where: { userId: user.userId },
              data: {
                oauthAvatar: profile.avatar
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                  : undefined,
              },
            });
          }

          return done(null, user as any);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
