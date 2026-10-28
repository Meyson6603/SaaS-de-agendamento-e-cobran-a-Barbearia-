"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Weekday } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export type BarbershopSetupState = {
  error: string | null;
  success: string | null;
};

type ShopAuthorization =
  | { success: true; slug: string }
  | { success: false; error: string };

const weekdays: Weekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export async function createProfessional(
  _previousState: BarbershopSetupState,
  formData: FormData,
): Promise<BarbershopSetupState> {
  const shopId = getFormString(formData, "shopId");
  const email = getFormString(formData, "email").toLowerCase();
  const displayName = getFormString(formData, "displayName");
  const authorization = await authorizeShopManagement(shopId);

  if (!authorization.success) {
    return { error: authorization.error, success: null };
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    displayName.length < 2 ||
    displayName.length > 100
  ) {
    return { error: "Informe um nome e o e-mail de uma conta verificada.", success: null };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user?.emailVerified) {
    return {
      error: "Não encontrei uma conta verificada com esse e-mail.",
      success: null,
    };
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId, userId: user.id } },
    select: { role: true },
  });

  if (existingMembership) {
    return {
      error: "Essa conta já está vinculada à barbearia com outro papel.",
      success: null,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const membership = await transaction.membership.create({
        data: { shopId, userId: user.id, role: "PROFESSIONAL" },
        select: { id: true },
      });

      await transaction.professional.create({
        data: {
          shopId,
          membershipId: membership.id,
          displayName,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Essa conta já foi vinculada à equipe desta barbearia.",
        success: null,
      };
    }

    throw error;
  }

  await revalidateShopPages(authorization.slug);
  return { error: null, success: `${displayName} foi adicionado(a) à equipe.` };
}

export async function createShopService(
  _previousState: BarbershopSetupState,
  formData: FormData,
): Promise<BarbershopSetupState> {
  const shopId = getFormString(formData, "shopId");
  const name = getFormString(formData, "name");
  const description = getFormString(formData, "description");
  const durationMinutes = Number(getFormString(formData, "durationMinutes"));
  const price = getFormString(formData, "price").replace(",", ".");
  const professionalIds = [
    ...new Set(
      formData
        .getAll("professionalIds")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
  const authorization = await authorizeShopManagement(shopId);

  if (!authorization.success) {
    return { error: authorization.error, success: null };
  }

  if (
    name.length < 2 ||
    name.length > 100 ||
    description.length > 500 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 5 ||
    durationMinutes > 480 ||
    !/^\d{1,8}(?:\.\d{1,2})?$/.test(price) ||
    Number(price) <= 0 ||
    professionalIds.length === 0
  ) {
    return {
      error: "Confira o nome, a duração, o preço e selecione ao menos um profissional.",
      success: null,
    };
  }

  const professionalsCount = await prisma.professional.count({
    where: { shopId, id: { in: professionalIds }, isActive: true },
  });

  if (professionalsCount !== professionalIds.length) {
    return {
      error: "Selecione apenas profissionais ativos desta barbearia.",
      success: null,
    };
  }

  await prisma.$transaction(async (transaction) => {
    const service = await transaction.service.create({
      data: {
        shopId,
        name,
        description: description || null,
        durationMinutes,
        price: new Prisma.Decimal(price),
      },
      select: { id: true },
    });

    await transaction.professionalService.createMany({
      data: professionalIds.map((professionalId) => ({
        shopId,
        professionalId,
        serviceId: service.id,
      })),
    });
  });

  await revalidateShopPages(authorization.slug);
  return { error: null, success: `O serviço ${name} foi cadastrado.` };
}

export async function addWeeklyAvailability(
  _previousState: BarbershopSetupState,
  formData: FormData,
): Promise<BarbershopSetupState> {
  const shopId = getFormString(formData, "shopId");
  const professionalId = getFormString(formData, "professionalId");
  const weekday = getFormString(formData, "weekday");
  const selectedWeekday = weekdays.find((value) => value === weekday);
  const startMinute = parseTime(getFormString(formData, "startTime"));
  const endMinute = parseTime(getFormString(formData, "endTime"));
  const authorization = await authorizeShopManagement(shopId);

  if (!authorization.success) {
    return { error: authorization.error, success: null };
  }

  if (
    !selectedWeekday ||
    startMinute === null ||
    endMinute === null ||
    startMinute >= endMinute
  ) {
    return { error: "Informe um dia e um intervalo de horários válido.", success: null };
  }

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, shopId, isActive: true },
    select: { id: true, displayName: true },
  });

  if (!professional) {
    return { error: "Selecione um profissional ativo desta barbearia.", success: null };
  }

  try {
    await prisma.weeklyAvailability.create({
      data: {
        shopId,
        professionalId,
        weekday: selectedWeekday,
        startMinute,
        endMinute,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Já existe um horário com esse início para o profissional neste dia.",
        success: null,
      };
    }

    throw error;
  }

  await revalidateShopPages(authorization.slug);
  return {
    error: null,
    success: `Horário semanal adicionado para ${professional.displayName}.`,
  };
}

async function authorizeShopManagement(shopId: string): Promise<ShopAuthorization> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Entre na sua conta para continuar." };
  }

  const shop = await prisma.barbershop.findUnique({
    where: { id: shopId },
    select: { slug: true },
  });

  if (!shop) {
    return { success: false, error: "A barbearia selecionada não foi encontrada." };
  }

  const membership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId, userId: session.user.id } },
    select: { role: true },
  });

  if (
    !isPlatformAdmin(session.user) &&
    membership?.role !== "OWNER" &&
    membership?.role !== "MANAGER"
  ) {
    return {
      success: false,
      error: "Você não tem permissão para configurar esta barbearia.",
    };
  }

  return { success: true, slug: shop.slug };
}

async function revalidateShopPages(slug: string) {
  revalidatePath("/gerencia");
  revalidatePath("/");
  revalidatePath(`/${slug}`);
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
