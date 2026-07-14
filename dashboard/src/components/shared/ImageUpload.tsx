import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Loader2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  placeholder = 'Klik atau seret file gambar ke sini (PNG, JPG, WEBP, GIF up to 10MB)',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { error, success } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploading(true)
      const formData = new FormData()
      formData.append('image', file)

      try {
        const response = await api.post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        if (response.data?.success && response.data?.data?.url) {
          const uploadedUrl = response.data.data.url
          onChange(uploadedUrl)
          success('Gambar berhasil diunggah')
        } else {
          error('Gagal mengunggah gambar', 'Respons server tidak valid')
        }
      } catch (err: any) {
        console.error(err)
        const errMsg = err.response?.data?.message || 'Terjadi kesalahan jaringan'
        error('Gagal mengunggah gambar', errMsg)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange, error, success]
  )

  const removeImage = () => {
    onChange('')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {value ? (
        // Preview Frame
        <div className="relative group overflow-hidden rounded-2xl border border-border bg-secondary/20 aspect-video flex items-center justify-center max-w-sm">
          <img
            src={value}
            alt="Upload Preview"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <button
              type="button"
              onClick={removeImage}
              className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors duration-200 shadow-lg"
              title="Hapus Gambar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        // Dropzone Area
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] bg-secondary/10 hover:bg-secondary/20 hover:border-primary/50",
            isDragActive && "border-primary bg-primary/5",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Mengunggah file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <UploadCloud size={22} className="animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{placeholder}</p>
                <p className="text-xs text-muted-foreground">Seret file ke sini atau klik untuk memilih file</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default ImageUpload
