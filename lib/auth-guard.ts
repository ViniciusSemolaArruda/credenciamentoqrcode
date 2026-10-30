
import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Role = "ADMIN" | "FUNCIONARIO";

export async function requireRole(role: Role) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      nome: true,
      role: true,
      ativo: true,
    },
  });

  if (!usuario || !usuario.ativo) {
    redirect("/login");
  }

  if (usuario.role !== role) {
    if (usuario.role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/selecionar-funcionario");
  }

  return usuario;
}
