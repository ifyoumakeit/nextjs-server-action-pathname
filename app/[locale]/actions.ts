"use server";

import { headers } from "next/headers";

export async function homePageAction() {
	const headersList = await headers();
	const actionId = headersList.get("next-action") || "not-found";
	// Return the action ID so the client can use it
	return actionId;
}
