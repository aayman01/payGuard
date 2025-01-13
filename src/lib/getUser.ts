import { supabase } from "./supabase";

export default async function CheckUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  const user = data?.user;
  return user?.user_metadata?.email || null;
}