import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout as logoutAction } from '@/components/auth/authSlice'

/** Convenience accessor for auth state + actions. */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { token, user } = useAppSelector((s) => s.auth)

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    logout: () => dispatch(logoutAction()),
  }
}
