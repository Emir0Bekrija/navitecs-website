"use server";

import { revalidatePath } from "next/cache";

export async function revalidateProjects() {
  revalidatePath("/projects");
}

export async function revalidateCareers() {
  revalidatePath("/careers");
}
