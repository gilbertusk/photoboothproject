import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface PaymentPollingProps {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
}

export function PaymentPolling({ status }: PaymentPollingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-sway-surface/50 backdrop-blur-md rounded-2xl border border-sway-border/20 text-center max-w-sm mx-auto animate-fade-in mt-4">
      {status === 'PENDING' && (
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center w-12 h-12 mb-3">
            {/* Pulsing ring */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-500/20 animate-ping" />
            <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
          <p className="text-yellow-500 font-medium text-sm">Menunggu Pembayaran...</p>
          <p className="text-sway-dim text-xs mt-1">Status akan terupdate otomatis jika sudah dibayar</p>
        </div>
      )}

      {status === 'PAID' && (
        <div className="flex flex-col items-center text-green-500">
          <CheckCircle2 className="w-12 h-12 mb-2 animate-scale-up text-green-500" />
          <p className="font-semibold text-sm">Pembayaran Sukses!</p>
          <p className="text-sway-dim text-xs mt-1">Menyiapkan sesi photobooth Anda...</p>
        </div>
      )}

      {status === 'FAILED' && (
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="w-12 h-12 mb-2 animate-bounce text-red-500" />
          <p className="font-semibold text-sm">Pembayaran Gagal</p>
          <p className="text-sway-dim text-xs mt-1">Silakan coba lagi atau hubungi admin</p>
        </div>
      )}

      {status === 'EXPIRED' && (
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="w-12 h-12 mb-2 text-red-500" />
          <p className="font-semibold text-sm">Transaksi Kadaluarsa</p>
          <p className="text-sway-dim text-xs mt-1">Sesi pembayaran telah berakhir</p>
        </div>
      )}
    </div>
  )
}
