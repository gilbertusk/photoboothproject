import { CheckCircle2, Film, Mail, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  id: string
  name: string
  price: number
  photoCount: number
  duration: number       // dalam menit
  printCount: number     // berapa kali cetak
  includeGif: boolean
  includeEmail: boolean
  isActive: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

export function PricingCard({
  name,
  price,
  photoCount,
  duration,
  printCount,
  includeGif,
  includeEmail,
  isActive,
  onEdit,
  onToggle,
  onDelete,
}: PricingCardProps) {
  // Format price to: RP XX.XXX
  const formattedPrice = "RP " + price.toLocaleString('id-ID')

  return (
    <div
      className={cn(
        "bg-sway-card border border-sway-border-dim rounded-md p-6 relative flex flex-col min-h-[360px] hover:border-sway-border transition-colors duration-200",
        !isActive && "opacity-60"
      )}
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start select-none">
        {/* Status Badge */}
        {isActive ? (
          <span className="bg-sway-success text-white px-2.5 py-0.5 rounded-[2px] font-grotesk text-[10px] uppercase tracking-[0.1em] font-bold">
            AKTIF
          </span>
        ) : (
          <span className="bg-sway-card-hi text-sway-ghost px-2.5 py-0.5 rounded-[2px] font-grotesk text-[10px] uppercase tracking-[0.1em] font-bold">
            NONAKTIF
          </span>
        )}

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded border-none bg-transparent hover:bg-sway-card-hi text-sway-dim hover:text-sway-text flex items-center justify-center cursor-pointer transition-colors"
          title="Edit Paket"
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* PACKAGE NAME */}
      <div className="mt-3.5">
        <h3 className="font-bebas text-[24px] text-sway-text tracking-wide uppercase leading-tight">
          {name}
        </h3>
      </div>

      {/* PRICE */}
      <div className="mt-1 flex items-baseline gap-1 select-none">
        <span className="font-bebas text-[40px] text-sway-text leading-none">
          {formattedPrice}
        </span>
        <span className="font-grotesk text-[13px] text-sway-ghost font-medium">
          / sesi
        </span>
      </div>

      {/* DIVIDER */}
      <div className="h-[1px] bg-sway-border-dim my-4" />

      {/* FEATURES LIST */}
      <div className="flex flex-col gap-3">
        {/* Standard Features */}
        <div className="flex items-center gap-3">
          <CheckCircle2
            className={cn(
              "w-4 h-4 shrink-0",
              isActive ? "text-sway-success" : "text-sway-ghost"
            )}
          />
          <span
            className={cn(
              "font-grotesk text-[13px]",
              isActive ? "text-sway-muted" : "text-sway-ghost"
            )}
          >
            {photoCount} Foto per sesi
          </span>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle2
            className={cn(
              "w-4 h-4 shrink-0",
              isActive ? "text-sway-success" : "text-sway-ghost"
            )}
          />
          <span
            className={cn(
              "font-grotesk text-[13px]",
              isActive ? "text-sway-muted" : "text-sway-ghost"
            )}
          >
            {duration} Menit durasi
          </span>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle2
            className={cn(
              "w-4 h-4 shrink-0",
              isActive ? "text-sway-success" : "text-sway-ghost"
            )}
          />
          <span
            className={cn(
              "font-grotesk text-[13px]",
              isActive ? "text-sway-muted" : "text-sway-ghost"
            )}
          >
            {printCount}x Cetak strip
          </span>
        </div>

        {/* Optional Features */}
        {includeGif && (
          <div className="flex items-center gap-3">
            <Film
              className={cn(
                "w-4 h-4 shrink-0",
                isActive ? "text-sway-accent" : "text-sway-ghost"
              )}
            />
            <span
              className={cn(
                "font-grotesk text-[13px] font-medium",
                isActive ? "text-sway-accent" : "text-sway-ghost"
              )}
            >
              Digital GIF included
            </span>
          </div>
        )}

        {includeEmail && (
          <div className="flex items-center gap-3">
            <Mail
              className={cn(
                "w-4 h-4 shrink-0",
                isActive ? "text-sway-accent" : "text-sway-ghost"
              )}
            />
            <span
              className={cn(
                "font-grotesk text-[13px] font-medium",
                isActive ? "text-sway-accent" : "text-sway-ghost"
              )}
            >
              Direct Email
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM ROW */}
      <div className="mt-auto pt-4 flex justify-between items-center select-none">
        {/* Custom Toggle Switch */}
        <div
          onClick={onToggle}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5",
            isActive ? "bg-sway-accent" : "bg-sway-card-hi"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
              isActive ? "translate-x-5 bg-white" : "translate-x-0 bg-sway-ghost"
            )}
          />
        </div>

        {/* Delete Trigger */}
        <button
          type="button"
          onClick={onDelete}
          className="border-none bg-transparent flex items-center gap-1.5 cursor-pointer text-sway-dim hover:text-sway-error transition-colors font-grotesk font-black leading-none outline-none"
        >
          <Trash2 size={14} />
          <span className="text-[10px] uppercase tracking-widest mt-0.5 font-bold">
            DELETE
          </span>
        </button>
      </div>
    </div>
  )
}
