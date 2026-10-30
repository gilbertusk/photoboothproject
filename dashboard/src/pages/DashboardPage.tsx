import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Session, DashboardStats } from '@/types'
import { useBranchStore } from '@/stores/branchStore'
import { BranchSelect } from '@/components/shared/BranchSelect'

export function DashboardPage() {
  const navigate = useNavigate()

  const branchId = useBranchStore((s) => s.branchId)

  // Totals are computed over the complete dataset on the server.
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-analytics', branchId],
    refetchInterval: 60000,
    queryFn: async () => {
      const response = await api.get('/api/analytics', { params: branchId ? { branchId } : {} })
      return response.data.data as DashboardStats & { recentSessions: Session[]; undatedPayments: number }
    },
  })

  const stats = data

  if (isLoading) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center bg-sway-bg text-sway-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-sway-accent animate-spin" />
          <p className="text-sm font-semibold font-grotesk text-sway-dim animate-pulse">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center bg-sway-bg px-4">
        <div className="rounded-md border border-sway-border bg-sway-card p-6 text-center max-w-lg shadow-xl">
          <p className="font-bebas text-[24px] text-sway-accent tracking-wider">TERJADI KESALAHAN</p>
          <p className="text-sm text-sway-dim mt-2 font-grotesk">Gagal memuat data statistik dari server backend.</p>
        </div>
      </div>
    )
  }

  const displayTotalRevenue = formatRupiah(stats?.totalRevenue ?? 0)
  const displayTotalCompleted = `${stats?.totalCompletedSessions ?? 0} SESI SELESAI`
  const displaySessionsToday = String(stats?.sessionsToday ?? 0)
  const displayTotalSessions = String(stats?.totalSessions ?? 0)
  const displayRevenueToday = formatRupiah(stats?.revenueToday ?? 0)
  const displayRevenueTodaySessions = `DARI ${stats?.sessionsToday ?? 0} SESI`
  const chartData = (stats?.revenueByDay ?? []).map(day => ({ date: format(parseISO(day.date), 'dd MMM', { locale: id }), value: day.revenue }))

  const colors = ['bg-sway-accent', 'bg-sway-gold', 'bg-[#3b82f6]', 'bg-sway-dim']
  const totalPicks = stats?.popularPackages.reduce((sum, pkg) => sum + pkg.count, 0) ?? 0
  const packagesToDisplay = totalPicks > 0
    ? (stats?.popularPackages ?? []).slice(0, 3).map((pkg, idx) => ({
        name: pkg.name,
        percentage: Math.round((pkg.count / totalPicks) * 100),
        color: colors[idx % colors.length],
      }))
    : []
  const displayTotalPicksThisMonth = `${totalPicks} PAKET`

  const transactionsToDisplay = (data?.recentSessions ?? []).map((session) => {
      const timeFormatted = session.createdAt ? new Date(session.createdAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '—'
      let statusLabel = session.status || 'UNKNOWN'
      if (statusLabel === 'COMPLETED') statusLabel = 'PAID' // normalized completion
      return {
        id: `#BPX-${session.id ? session.id.substring(session.id.length - 4).toUpperCase() : '—'}`,
        package: (session.package?.name || 'PAKET DIHAPUS').toUpperCase(),
        price: formatRupiah(session.finalPrice || 0),
        status: statusLabel.toUpperCase(),
        time: timeFormatted
      }
    })

  return (
    <div className="space-y-6">
      <BranchSelect />
      <p className="text-xs text-sway-dim">Pendapatan kiosk berdasarkan transaksi lunas; tanggal pembayaran dalam WIB. Booking acara dicatat terpisah.</p>
      {!!data?.undatedPayments && <p className="text-xs text-sway-dim">{data.undatedPayments} pembayaran tanpa tanggal masuk total pendapatan, tetapi tidak masuk grafik harian.</p>}
      {/* ROW 1: Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: TOTAL REVENUE */}
        <div className="bg-sway-card border border-sway-border-dim rounded-md p-5 border-l-[3px] border-l-sway-accent flex flex-col justify-between h-[130px]">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-grotesk font-bold">
            TOTAL REVENUE
          </span>
          <span className="font-bebas text-[36px] text-sway-text leading-none mt-2">
            {displayTotalRevenue}
          </span>
          <span className="text-[11px] text-sway-accent mt-2 flex items-center gap-1 font-grotesk font-bold">
            ✓ {displayTotalCompleted}
          </span>
        </div>

        {/* Card 2: SESI HARI INI */}
        <div className="bg-sway-card border border-sway-border-dim rounded-md p-5 border-l-[3px] border-l-sway-gold flex flex-col justify-between h-[130px]">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-grotesk font-bold">
            SESI HARI INI
          </span>
          <span className="font-bebas text-[36px] text-sway-text leading-none mt-2">
            {displaySessionsToday}
          </span>
          <span className="text-[11px] text-sway-gold mt-2 flex items-center gap-1 font-grotesk font-bold">
            ◇ DIBUAT HARI INI (WIB)
          </span>
        </div>

        {/* Card 3: TOTAL SESI */}
        <div className="bg-sway-card border border-sway-border-dim rounded-md p-5 border-l-[3px] border-l-sway-success flex flex-col justify-between h-[130px]">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-grotesk font-bold">
            TOTAL SESI
          </span>
          <span className="font-bebas text-[36px] text-sway-text leading-none mt-2">
            {displayTotalSessions}
          </span>
          <span className="text-[11px] text-sway-success mt-2 flex items-center gap-1 font-grotesk font-bold">
            ⊙ SEJAK AWAL
          </span>
        </div>

        {/* Card 4: REVENUE HARI INI */}
        <div className="bg-sway-card border border-sway-border-dim rounded-md p-5 border-l-[3px] border-l-sway-accent flex flex-col justify-between h-[130px]">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-grotesk font-bold">
            REVENUE HARI INI
          </span>
          <span className="font-bebas text-[36px] text-sway-text leading-none mt-2">
            {displayRevenueToday}
          </span>
          <span className="text-[11px] text-sway-accent mt-2 flex items-center gap-1 font-grotesk font-bold">
            ↗ {displayRevenueTodaySessions}
          </span>
        </div>
      </div>

      {/* ROW 2: Charts */}
      <div className="flex gap-4 mt-6">
        {/* LEFT — Revenue Line Chart */}
        <div className="flex-[6] bg-sway-card border border-sway-border-dim rounded-md p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bebas text-[22px] text-sway-text leading-none">
              REVENUE 7 HARI
            </span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sway-accent animate-pulse" />
              <span className="text-[10px] text-sway-dim uppercase tracking-widest font-grotesk font-bold mt-0.5">
                DIPERBARUI TIAP MENIT
              </span>
            </div>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b5a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff6b5a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fbe3d8" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#a57c6b', fontSize: 11, fontFamily: 'Space Grotesk' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f6d3c3',
                    borderRadius: 4,
                    color: '#3b1d12',
                    fontFamily: 'Space Grotesk',
                    fontSize: 12
                  }}
                  formatter={(val: any) => [formatRupiah(val), 'REVENUE']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ff6b5a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    if (index === chartData.length - 1) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#ff6b5a"
                          stroke="#ffffff"
                          strokeWidth={2}
                          key="last-dot"
                        />
                      );
                    }
                    return null as any;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT — Paket Terpopuler */}
        <div className="flex-[4] bg-sway-card border border-sway-border-dim rounded-md p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bebas text-[22px] text-sway-text mb-6">
              PAKET TERPOPULER
            </h3>

            <div className="space-y-5">
              {packagesToDisplay.length === 0 && (
                <p className="py-8 text-center text-sm text-sway-dim">Belum ada data penjualan paket.</p>
              )}
              {packagesToDisplay.map((pkg, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center">
                    <span className="font-grotesk text-[12px] font-bold uppercase tracking-wider text-sway-text">
                      {pkg.name}
                    </span>
                    <span className={`font-grotesk text-[13px] font-bold ${pkg.color === 'bg-sway-accent' ? 'text-sway-accent' : pkg.color === 'bg-sway-gold' ? 'text-sway-gold' : 'text-[#3b82f6]'}`}>
                      {pkg.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-sway-card-hi rounded-full w-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pkg.color}`}
                      style={{ width: `${pkg.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-[1px] bg-sway-border-dim my-4" />
            <span className="text-[10px] uppercase tracking-widest text-sway-dim font-grotesk font-bold block">
              TOTAL PENJUALAN BULAN INI
            </span>
            <span className="font-bebas text-[24px] text-sway-text mt-1 block">
              {displayTotalPicksThisMonth}
            </span>
          </div>
        </div>
      </div>

      {/* ROW 3: Recent Transactions */}
      <div className="bg-sway-card border border-sway-border-dim rounded-md p-5 mt-6">
        <div className="flex justify-between items-center mb-5">
          <span className="font-bebas text-[22px] text-sway-text leading-none">
            TRANSAKSI TERBARU
          </span>
          <button
            onClick={() => navigate('/transactions')}
            className="border border-sway-border-dim rounded px-3.5 py-1.5 text-[11px] uppercase tracking-widest text-sway-dim font-grotesk font-bold hover:border-sway-accent hover:text-sway-accent transition-colors duration-200 cursor-pointer"
          >
            LIHAT SEMUA
          </button>
        </div>

        {/* Table wrapper */}
        <div className="w-full">
          {/* Header Row */}
          <div className="flex border-b border-sway-border-dim pb-2.5 mb-1 font-grotesk text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold">
            <div className="w-[18%]">ID SESI</div>
            <div className="w-[28%]">PAKET</div>
            <div className="w-[20%]">HARGA</div>
            <div className="w-[16%]">STATUS</div>
            <div className="w-[18%]">WAKTU</div>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-sway-border-dim/30">
            {transactionsToDisplay.length === 0 && (
              <p className="py-8 text-center text-sm text-sway-dim">Belum ada transaksi.</p>
            )}
            {transactionsToDisplay.map((tx, idx) => (
              <div
                key={idx}
                className={`flex py-3.5 items-center font-grotesk text-[13px] ${
                  idx % 2 === 1 ? 'bg-sway-bg/30' : 'bg-transparent'
                }`}
              >
                {/* ID SESI */}
                <div className="w-[18%] font-bold text-sway-text">
                  {tx.id}
                </div>

                {/* PAKET */}
                <div className="w-[28%] text-sway-muted truncate pr-2">
                  {tx.package}
                </div>

                {/* HARGA */}
                <div className="w-[20%] text-sway-text">
                  {tx.price}
                </div>

                {/* STATUS */}
                <div className="w-[16%]">
                  {tx.status === 'PAID' ? (
                    <span className="bg-sway-success/10 text-sway-success border border-sway-success/30 px-2.5 py-0.5 rounded-[2px] text-[10px] uppercase tracking-wider font-bold inline-block">
                      PAID
                    </span>
                  ) : tx.status === 'PENDING' ? (
                    <span className="bg-sway-gold/10 text-sway-gold border border-sway-gold/30 px-2.5 py-0.5 rounded-[2px] text-[10px] uppercase tracking-wider font-bold inline-block">
                      PENDING
                    </span>
                  ) : (
                    <span className="bg-sway-card-hi text-sway-dim border border-sway-ghost px-2.5 py-0.5 rounded-[2px] text-[10px] uppercase tracking-wider font-bold inline-block">
                      {tx.status}
                    </span>
                  )}
                </div>

                {/* WAKTU */}
                <div className="w-[18%] text-sway-dim">
                  {tx.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
