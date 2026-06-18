import { api } from '@/services/api'
import { endpoint } from '@/services/mock/mockQuery'
import type { AdminProfile } from '@/components/auth/authSlice'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AdminProfile
}

const MOCK_ADMIN: AdminProfile = {
  id: 'adm_1',
  name: 'Julio Admin',
  email: 'admin@julio.app',
  role: 'super_admin',
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: endpoint<LoginRequest, LoginResponse>({
        mock: ({ email, password }) => {
          // Demo credentials for the mock backend.
          if (email !== 'admin@julio.app' || password !== 'admin123') {
            throw new Error('Invalid email or password')
          }
          return { token: 'mock-jwt-token', user: MOCK_ADMIN }
        },
        real: (body) => ({ url: '/auth/login', method: 'POST', body }),
      }),
    }),

    changePassword: builder.mutation<{ success: true }, { currentPassword: string; newPassword: string }>({
      queryFn: endpoint({
        mock: ({ currentPassword }) => {
          if (currentPassword !== 'admin123') throw new Error('Current password is incorrect')
          return { success: true as const }
        },
        real: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      }),
    }),
  }),
})

export const { useLoginMutation, useChangePasswordMutation } = authApi
