import { formatRupiah } from '@/lib/utils'

interface QrisDisplayProps {
  qrUrl: string
  amount: number
}

export function QrisDisplay({ qrUrl, amount }: QrisDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-sway-surface rounded-3xl border border-sway-border/30 shadow-2xl max-w-sm mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-sway-text mb-1">Scan QRIS</h3>
        <p className="text-sm text-sway-dim">Gunakan aplikasi e-wallet atau mobile banking Anda</p>
      </div>

      <div className="relative p-4 bg-white rounded-2xl overflow-hidden shadow-inner flex items-center justify-center w-64 h-64 border border-sway-border/20 animate-scale-up">
        {qrUrl ? (
          <img 
            src={qrUrl} 
            alt="QRIS Payment" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="animate-pulse bg-gray-200 w-full h-full rounded" />
        )}
      </div>

      <div className="mt-6 text-center w-full">
        <span className="text-xs uppercase tracking-wider text-sway-dim block mb-1">Total Pembayaran</span>
        <div className="text-2xl font-bold text-sway-accent bg-sway-accent/10 py-2 px-4 rounded-xl border border-sway-accent/20 inline-block shadow-[0_0_15px_rgba(255,107,90,0.12)]">
          {formatRupiah(amount)}
        </div>
      </div>
    </div>
  )
}
