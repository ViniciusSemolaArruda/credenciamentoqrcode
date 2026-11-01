
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function marcarEmailEnviado(formData: FormData) {
  const gerente = await requireRole("ADMIN");

  const retiradaId = formData.get("retiradaId");

  if (
    typeof retiradaId !== "string" ||
    !retiradaId.trim()
  ) {
    throw new Error("Retirada inválida.");
  }

  await prisma.retiradaIngresso.updateMany({
    where: {
      id: retiradaId,
      ativo: true,
      emailEnviadoEm: null,
    },
    data: {
      emailEnviadoEm: new Date(),
      emailEnviadoPorId: gerente.id,
    },
  });

  revalidatePath("/admin/retiradas");
}

export async function marcarEmailPendente(formData: FormData) {
  await requireRole("ADMIN");

  const retiradaId = formData.get("retiradaId");

  if (
    typeof retiradaId !== "string" ||
    !retiradaId.trim()
  ) {
    throw new Error("Retirada inválida.");
  }

  await prisma.retiradaIngresso.updateMany({
    where: {
      id: retiradaId,
      ativo: true,
    },
    data: {
      emailEnviadoEm: null,
      emailEnviadoPorId: null,
    },
  });

  revalidatePath("/admin/retiradas");
}
