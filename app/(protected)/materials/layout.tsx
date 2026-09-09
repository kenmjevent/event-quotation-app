import RoleGuard from '../../components/RoleGuard'

export default function MaterialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      {children}
    </RoleGuard>
  )
}