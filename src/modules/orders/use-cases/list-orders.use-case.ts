import { prisma } from "../../../lib/prisma.js";

type ListOrdersFilters = {
  search?: string;
  status?: string;
};

export async function listOrdersUseCase(
  page = 1,
  limit = 10,
  filters: ListOrdersFilters = {},
) {
  const skip = (page - 1) * limit;
  const { search, status } = filters;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" as const } },
            {
              customer: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
