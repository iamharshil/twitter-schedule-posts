import { redirect } from "next/navigation";
import Home from "@/components/Home";
import { session } from "@/utils/session";
import { validateAndRefreshToken } from "@/utils/token-validation";

export default async function HomePage() {
  const { user } = await session.get();

  // user information available here in server render

  if (!user) {
    redirect("/auth");
  }

  // Validate and refresh token if needed
  const tokenValidation = await validateAndRefreshToken();

  if (!tokenValidation.isValid) {
    console.error("Token validation failed:", tokenValidation.error);
    if (tokenValidation.needsRefresh) {
      // If refresh failed, redirect to auth to get new tokens
      redirect("/auth");
    } else {
      redirect("/auth");
    }
  }

  if (tokenValidation.needsRefresh) {
    // token refreshed successfully
  }

  return <Home />;
}