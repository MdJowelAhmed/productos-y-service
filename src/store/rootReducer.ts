import { combineReducers } from '@reduxjs/toolkit'
import { api } from '@/services/api'
import authReducer from '@/components/auth/authSlice'

export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
})
