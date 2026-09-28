import { api } from "@/lib/api";
import { currentUser, isAdmin } from "@/lib/auth";

export const GET = api(async () => {
  const u = await currentUser();
  return { user: u && { id: u.id, phone: u.phone, name: u.name, admin: isAdmin(u.phone) } };
});
