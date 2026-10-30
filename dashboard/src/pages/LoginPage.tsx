import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
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

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden px-4">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-[350px] w-[350px] rounded-full bg-sway-gold/20 blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <Card className="w-full max-w-[440px] border-border bg-card/65 backdrop-blur-md rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        {/* Brand Banner Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-sway-accent-dim to-sway-gold" />
        
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-sway-gold flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-white text-xl">📸</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground pt-2">
            bertpixx Admin
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Masuk untuk mengakses Dashboard Admin
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@photobooth.app"
                  {...register('email')}
                  className={cn(
                    "pl-10.5 pr-4 py-5 bg-white border-border text-foreground rounded-xl placeholder:text-muted-foreground/60 transition-all duration-200 focus-visible:ring-primary focus-visible:border-primary/50",
                    errors.email && "border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500/50"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(
                    "pl-10.5 pr-11 py-5 bg-white border-border text-foreground rounded-xl placeholder:text-muted-foreground/60 transition-all duration-200 focus-visible:ring-primary focus-visible:border-primary/50",
                    errors.password && "border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500/50"
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {/* Login Action */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all duration-200 hover:shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Memproses Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
export default LoginPage
