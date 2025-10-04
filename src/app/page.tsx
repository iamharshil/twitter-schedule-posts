import { redirect } from "next/navigation";
import Home from "@/components/Home";
import { session } from "@/utils/session";

export default async function HomePage() {
  const { user } = await session.get();

  if (!user) {
    redirect("/auth")
  } else {
    return (
      <Home />
    )
  }
}