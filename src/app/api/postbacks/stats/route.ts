import { startOfDay, subDays } from 'date-fns';
import prisma from '@/lib/prisma';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';

/**
 * GET /api/postbacks/stats
 * Returns aggregated statistics for user's postback endpoints.
 * Includes total requests, successful, failed, and revenue over last 30 days.
 */
export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) return error();

  const startDate = startOfDay(subDays(new Date(), 30));

  // Get endpoint IDs for user (owned or via team membership)
  const endpoints = await prisma.client.postbackEndpoint.findMany({
    where: {
      OR: [{ userId: auth.user.id }, { team: { teamUser: { some: { userId: auth.user.id } } } }],
      deletedAt: null,
    },
    select: { id: true, websiteId: true },
  });

  const endpointIds = endpoints.map(e => e.id);

  if (endpointIds.length === 0) {
    return json({
      total: 0,
      successful: 0,
      failed: 0,
      revenue: 0,
    });
  }

  // Get request stats grouped by status
  const stats = await prisma.client.postbackRequest.groupBy({
    by: ['status'],
    where: {
      endpointId: { in: endpointIds },
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  // Get unique website IDs for revenue query
  const websiteIds = [...new Set(endpoints.map(e => e.websiteId))];

  // Get revenue sum for associated websites
  const revenueResult = await prisma.client.revenue.aggregate({
    where: {
      websiteId: { in: websiteIds },
      createdAt: { gte: startDate },
    },
    _sum: { revenue: true },
  });

  // Calculate totals
  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const successful = stats.find(s => s.status === 'recorded')?._count || 0;
  const failed = stats.find(s => s.status === 'failed')?._count || 0;

  return json({
    total,
    successful,
    failed,
    revenue: revenueResult._sum.revenue?.toNumber() || 0,
  });
}
