import { supabase } from './supabase'

export type UserRole =
  | 'admin'
  | 'estimator'

export type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  department: string | null
  is_active: boolean
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error(
      'AUTH USER ERROR:',
      userError
    )

    return null
  }

  const {
    data: profileById,
    error: idError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      department,
      is_active
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (idError) {
    console.error(
      'PROFILE BY ID ERROR:',
      idError
    )
  }

  if (profileById) {
    return {
      id: profileById.id,
      full_name: profileById.full_name,
      email: profileById.email,
      role: profileById.role as UserRole,
      department: profileById.department,
      is_active: profileById.is_active,
    }
  }

  if (user.email) {
    const {
      data: profileByEmail,
      error: emailError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        department,
        is_active
      `)
      .ilike('email', user.email)
      .maybeSingle()

    if (emailError) {
      console.error(
        'PROFILE BY EMAIL ERROR:',
        emailError
      )
    }

    if (profileByEmail) {
      return {
        id: profileByEmail.id,
        full_name: profileByEmail.full_name,
        email: profileByEmail.email,
        role: profileByEmail.role as UserRole,
        department: profileByEmail.department,
        is_active: profileByEmail.is_active,
      }
    }
  }

  return null
}

export function canCreateCosting(
  role: UserRole
) {
  return (
    role === 'admin' ||
    role === 'estimator'
  )
}

export function canEditCosting(
  role: UserRole
) {
  return (
    role === 'admin' ||
    role === 'estimator'
  )
}

export function canManageMaterials(
  role: UserRole
) {
  return role === 'admin'
}

export function canApproveCosting(
  role: UserRole
) {
  return role === 'admin'
}

export function canViewActivity(
  role: UserRole
) {
  return role === 'admin'
}

export function canManageUsers(
  role: UserRole
) {
  return role === 'admin'
}