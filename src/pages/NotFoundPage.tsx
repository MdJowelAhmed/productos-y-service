import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-ink-900">Page not found</h1>
      <p className="max-w-sm text-ink-500">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link to={ROUTES.dashboard}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
