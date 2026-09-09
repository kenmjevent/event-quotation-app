import RoleGuard from '../../components/RoleGuard'

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'estimator']}>
      {children}
    </RoleGuard>
  )
}