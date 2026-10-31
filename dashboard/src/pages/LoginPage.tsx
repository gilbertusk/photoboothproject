import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'


const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { success, error } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/login', data)

      if (response.data?.success && response.data?.data) {
        const { token, admin } = response.data.data
        login(token, admin)
        success('Login Berhasil', `Selamat datang kembali, ${admin.name}!`)
        navigate('/')
      } else {
        error('Login Gagal', response.data?.message || 'Identitas tidak valid')
      }
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.message || 'Email atau password salah'
      error('Login Gagal', errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full h-11 rounded-lg border bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-zinc-400 focus:bg-white focus:border-sway-accent focus:ring-4 focus:ring-sway-accent/10 disabled:opacity-60',
      hasError
        ? 'border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/10'
        : 'border-zinc-200'
    )

  const year = new Date().getFullYear()

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white font-sans">
      {/* Brand panel */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sway-accent text-white p-10">
        <div className="relative z-10 flex items-center justify-between text-sm">
          <span className="font-semibold tracking-tight">bertpixx</span>
          <span className="text-white/70">Dashboard admin</span>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="text-[28px] font-semibold leading-tight tracking-tight">
            Kiosk, paket, voucher dan transaksi semua cabang, di satu tempat.
          </p>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[0.18em] -left-[0.04em] font-bebas text-[min(26vw,340px)] leading-[0.8] tracking-[-0.01em] text-white/[0.12] select-none"
        >
          BERTPIXX
        </span>
      </section>

      {/* Form */}
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <span className="lg:hidden font-bebas text-[30px] leading-none tracking-wide text-sway-accent">
          BERTPIXX
        </span>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">Selamat datang kembali</h1>
            <p className="mt-2 text-sm text-zinc-500">Masuk dengan akun owner atau admin cabang.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="nama@bertpixx.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={inputClass(!!errors.email)}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p id="email-error" className="text-[13px] text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Minimal 6 karakter"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={cn(inputClass(!!errors.password), 'pr-11')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-[13px] text-red-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group mt-3 w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/15 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-zinc-400">© {year} bertpixx</p>
      </section>
    </main>
  )
}
export default LoginPage
