import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import type { AdminProfile } from '@/components/auth/authSlice'

export const RESET_PASSWORD_TOKEN_KEY = 'reset_password_token'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AdminProfile
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  oneTimeCode: number
}

export interface ResendOtpRequest {
  email: string
}

export interface ResetPasswordRequest {
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  countryCode?: string
  gender?: string
  profileImage?: File
}

const MOCK_ADMIN: AdminProfile = {
  id: 'adm_1',
  name: 'Super Admin',
  email: 'admin@gmail.com',
  role: 'super_admin',
}

function mapUserToAdminProfile(userRaw: any): AdminProfile {
  if (!userRaw) {
    return {
      id: 'me',
      name: 'Super Admin',
      email: 'admin@gmail.com',
      role: 'super_admin',
    }
  }
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''
  const avatarUrl = userRaw.profileImage
    ? userRaw.profileImage.startsWith('http')
      ? userRaw.profileImage
      : `${imageUrlBase}${userRaw.profileImage}`
    : undefined

  return {
    id: String(userRaw._id || userRaw.id || ''),
    name: userRaw.name || 'Super Admin',
    email: userRaw.email || '',
    role: userRaw.role === 'super_admin' ? 'super_admin' : 'admin',
    avatarUrl,
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: endpoint<LoginRequest, LoginResponse>({
        mock: ({ email, password }) => {
          if (email !== 'admin@gmail.com' && email !== 'admin@julio.app') {
            throw new Error('Invalid email or password')
          }
          if (password !== 'admin123') {
            throw new Error('Invalid email or password')
          }
          return { token: 'mock-jwt-token', user: MOCK_ADMIN }
        },
        real: (body) => ({
          url: '/auth/login',
          method: 'POST',
          body,
        }),
        transformReal: (response: any): LoginResponse => {
          const payload = response?.data || response
          return {
            token: payload?.token || '',
            user: mapUserToAdminProfile(payload?.user),
          }
        },
      }),
      invalidatesTags: ['User'],
    }),

    forgotPassword: builder.mutation<{ success: boolean; message: string }, ForgotPasswordRequest>({
      queryFn: endpoint({
        mock: () => ({ success: true, message: 'Verification code sent to email.' }),
        real: (body) => ({
          url: '/auth/forget-password',
          method: 'POST',
          body,
        }),
        transformReal: (res: any) => ({
          success: res?.success ?? true,
          message: res?.message || 'Verification code sent to email.',
        }),
      }),
    }),

    verifyOtp: builder.mutation<{ resetToken: string; message: string }, VerifyOtpRequest>({
      queryFn: endpoint({
        mock: () => ({ resetToken: 'mock-reset-token', message: 'Verification successful.' }),
        real: (body) => ({
          url: '/auth/verify-email',
          method: 'POST',
          body,
        }),
        transformReal: (res: any) => {
          const resetToken = res?.data || res?.resetToken || ''
          if (resetToken && typeof localStorage !== 'undefined') {
            localStorage.setItem(RESET_PASSWORD_TOKEN_KEY, resetToken)
          }
          return {
            resetToken,
            message: res?.message || 'Verification successful.',
          }
        },
      }),
    }),

    resendOtp: builder.mutation<{ success: boolean; message: string }, ResendOtpRequest>({
      queryFn: endpoint({
        mock: () => ({ success: true, message: 'OTP resent successfully.' }),
        real: (body) => ({
          url: '/auth/forget-password',
          method: 'POST',
          body,
        }),
        transformReal: (res: any) => ({
          success: res?.success ?? true,
          message: res?.message || 'OTP resent successfully.',
        }),
      }),
    }),

    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      queryFn: endpoint({
        mock: () => ({ success: true, message: 'Password reset successfully.' }),
        real: (body) => {
          const resetToken =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
              : null
          return {
            url: '/auth/reset-password',
            method: 'POST',
            body,
            headers: resetToken ? { resettoken: resetToken } : undefined,
          }
        },
        transformReal: (res: any) => {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(RESET_PASSWORD_TOKEN_KEY)
          }
          return {
            success: res?.success ?? true,
            message: res?.message || 'Password reset successfully.',
          }
        },
      }),
    }),

    getProfile: builder.query<AdminProfile, void>({
      queryFn: endpoint({
        mock: () => MOCK_ADMIN,
        real: () => ({
          url: '/users/profile',
          method: 'GET',
        }),
        transformReal: (res: any) => mapUserToAdminProfile(res?.data || res),
      }),
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<
      { success: boolean; message: string; data: AdminProfile },
      UpdateProfileRequest
    >({
      queryFn: endpoint({
        mock: (body) => ({
          success: true,
          message: 'Profile updated successfully',
          data: { ...MOCK_ADMIN, name: body.name || MOCK_ADMIN.name },
        }),
        real: ({ profileImage, ...fields }) => {
          const formData = new FormData()
          const dataPayload = Object.fromEntries(
            Object.entries(fields).filter(([, value]) => value !== undefined && value !== ''),
          )
          formData.append('data', JSON.stringify(dataPayload))
          if (profileImage) {
            formData.append('profileImage', profileImage)
          }
          return {
            url: '/users',
            method: 'PATCH',
            body: formData,
          }
        },
        transformReal: (res: any) => ({
          success: res?.success ?? true,
          message: res?.message || 'Profile updated successfully',
          data: mapUserToAdminProfile(res?.data || res),
        }),
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<{ success: true; message?: string }, ChangePasswordRequest>({
      queryFn: endpoint({
        mock: ({ currentPassword }) => {
          if (currentPassword !== 'admin123') throw new Error('Current password is incorrect')
          return { success: true as const, message: 'Password changed successfully' }
        },
        real: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
        transformReal: (res: any) => ({
          success: true,
          message: res?.message || 'Password changed successfully',
        }),
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi
