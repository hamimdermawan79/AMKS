import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Division } from '@prisma/client';

interface User {
  id: string;
  username: string;
  divisionScope?: Division | null;
}

/**
 * Check if user has a specific permission
 * @param user - User object (from session or direct)
 * @param permissionCode - Permission code (e.g., 'user:create', 'piket:schedule')
 * @param scope - Optional scope for division-specific permissions (e.g., 'KEBERSIHAN')
 */
export async function can(
  user: User | null | undefined,
  permissionCode: string,
  scope?: Division | null
): Promise<boolean> {
  if (!user) return false;

  // Get user's roles and their permissions
  const userWithRoles = await db.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return false;

  // Collect all permission codes from all roles
  const userPermissions = new Set<string>();

  for (const userRole of userWithRoles.roles) {
    for (const rolePermission of userRole.role.permissions) {
      userPermissions.add(rolePermission.permission.code);
    }
  }

  // Check direct permission match
  if (userPermissions.has(permissionCode)) {
    // For division-scoped permissions, check if scope matches
    if (permissionCode.startsWith('division:manage:')) {
      const requiredDivision = permissionCode.split(':')[2].toUpperCase();

      // SuperAdmin, Ketua, Sekretaris can manage all divisions
      const hasGlobalAccess =
        userPermissions.has('role:manage') ||
        userPermissions.has('permission:manage');

      if (hasGlobalAccess) return true;

      // Division head can only manage their own division
      if (scope && user.divisionScope) {
        return user.divisionScope.toUpperCase() === requiredDivision.toUpperCase();
      }

      return user.divisionScope?.toUpperCase() === requiredDivision.toUpperCase();
    }

    return true;
  }

  return false;
}

/**
 * Server-side wrapper to check permission using current session
 */
export async function canFromSession(
  permissionCode: string,
  scope?: Division | null
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  return can(
    {
      id: session.user.id,
      username: session.user.username,
      divisionScope: session.user.divisionScope as Division | null,
    },
    permissionCode,
    scope
  );
}

/**
 * Check if user has ANY of the given permissions
 */
export async function canAny(
  user: User | null | undefined,
  permissionCodes: string[],
  scope?: Division | null
): Promise<boolean> {
  if (!user || permissionCodes.length === 0) return false;

  for (const code of permissionCodes) {
    if (await can(user, code, scope)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has ALL of the given permissions
 */
export async function canAll(
  user: User | null | undefined,
  permissionCodes: string[],
  scope?: Division | null
): Promise<boolean> {
  if (!user || permissionCodes.length === 0) return false;

  for (const code of permissionCodes) {
    if (!(await can(user, code, scope))) {
      return false;
    }
  }

  return true;
}

/**
 * Check if user is SuperAdmin (has role:manage or permission:manage)
 */
export async function isSuperAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  return (
    (await can(user, 'role:manage')) ||
    (await can(user, 'permission:manage'))
  );
}

/**
 * Check if user can access all division pages (SuperAdmin, Ketua, Sekretaris)
 */
export async function canAccessAllDivisions(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  return await canAny(user, [
    'role:manage',
    'permission:manage',
    'division:manage:kebersihan',
    'division:manage:kesenian',
    'division:manage:keolahragaan',
    'division:manage:rohani',
  ]);
}
