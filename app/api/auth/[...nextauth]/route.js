// API Route stub – auth (NextAuth)
// Full implementation arrives in Prompt 2.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

