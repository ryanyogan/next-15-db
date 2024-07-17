import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { User } from "./app/lib/definitions";
import { authConfig } from "./auth.config";

async function getUser(email: string): Promise<User | undefined> {
  try {
    let user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error("Error getting user", error);
    throw new Error("Error getting user");
  }
}

export let { signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        let parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          let { email, password } = parsedCredentials.data;
          let user = await getUser(email);
          if (!user) return null;

          let passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) return user;
        }

        return null;
      },
    }),
  ],
});
