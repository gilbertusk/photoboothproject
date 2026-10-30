import { Transaction } from '../models/transaction.model';
import { Session } from '../models/session.model';
import { PricingPackage } from '../models/pricing.model';
import { BranchFilter } from '../utils/branch-scope';

const timezone = 'Asia/Jakarta';
const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

export function fillRevenueDays(rows: { _id: string; revenue: number }[], now = new Date()) {
  const today = new Date(`${dayKey(now)}T00:00:00+07:00`);
  const values = new Map(rows.map(row => [row._id, row.revenue]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = dayKey(new Date(today.getTime() - (6 - i) * 86400000));
    return { date, revenue: values.get(date) ?? 0 };
  });
}

export async function getDashboardAnalytics(now = new Date(), scope: BranchFilter = {}) {
  const today = new Date(`${dayKey(now)}T00:00:00+07:00`);
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekStart = new Date(today.getTime() - 6 * 86400000);
  const monthStart = new Date(`${dayKey(now).slice(0, 7)}-01T00:00:00+07:00`);
  const [payments, sessions, recentSessions] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...scope, status: 'PAID' } },
      { $facet: {
        total: [{ $group: { _id: null, revenue: { $sum: '$amount' } } }],
        today: [{ $match: { paidAt: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, revenue: { $sum: '$amount' } } }],
        days: [{ $match: { paidAt: { $gte: weekStart, $lt: tomorrow } } }, { $group: { _id: { $dateToString: { date: '$paidAt', format: '%Y-%m-%d', timezone } }, revenue: { $sum: '$amount' } } }],
        undated: [{ $match: { paidAt: null } }, { $count: 'count' }],
        packages: [
          { $match: { paidAt: { $gte: monthStart, $lt: tomorrow } } },
          { $lookup: { from: Session.collection.name, localField: 'sessionId', foreignField: '_id', as: 'session' } },
          { $unwind: { path: '$session', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$session.packageId', count: { $sum: 1 } } },
          { $lookup: { from: PricingPackage.collection.name, localField: '_id', foreignField: '_id', as: 'package' } },
          { $project: { _id: 0, name: { $ifNull: [{ $arrayElemAt: ['$package.name', 0] }, 'Paket dihapus'] }, count: 1 } },
          { $sort: { count: -1, name: 1 } },
        ],
      } },
    ]),
    Session.aggregate([{ $match: scope }, { $group: {
      _id: null, totalSessions: { $sum: 1 },
      totalCompletedSessions: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
      sessionsToday: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', today] }, { $lt: ['$createdAt', tomorrow] }] }, 1, 0] } },
    } }]),
    Session.find(scope).sort({ createdAt: -1, _id: -1 }).limit(5).populate('packageId'),
  ]);
  const paid = payments[0];
  return {
    timezone,
    totalSessions: sessions[0]?.totalSessions ?? 0,
    totalCompletedSessions: sessions[0]?.totalCompletedSessions ?? 0,
    sessionsToday: sessions[0]?.sessionsToday ?? 0,
    totalRevenue: paid?.total[0]?.revenue ?? 0,
    revenueToday: paid?.today[0]?.revenue ?? 0,
    undatedPayments: paid?.undated[0]?.count ?? 0,
    revenueByDay: fillRevenueDays(paid?.days ?? [], now),
    popularPackages: paid?.packages ?? [],
    recentSessions,
  };
}
