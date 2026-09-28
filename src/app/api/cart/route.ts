import { api } from "@/lib/api";
import { cartView, getCart } from "@/lib/cart";

export const GET = api(async () => cartView(await getCart()));
