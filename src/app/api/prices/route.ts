import { handle, json } from "@/lib/api";
import { getPrices } from "@/lib/prices";

export const revalidate = 60;

export const GET = handle(async () => json(await getPrices()));
