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
    // For division-scoped permissions, narrow access by divisionScope.
    if (permissionCode.startsWith('division:manage:')) {
      const requiredDivision = permissionCode.split(':')[2].toUpperCase();

      // Read divisionScope from the DB record (authoritative) rather than the
      // passed-in user, so a stale session JWT can't cause a false negative.
      const effectiveScope = userWithRoles.divisionScope ?? user.divisionScope ?? null;

      // Unscoped users (e.g. SUPERADMIN, KETUA) have no divisionScope, which
      // means the permission alone grants access to ALL divisions.
      if (!effectiveScope) return true;

      // Scoped users (DIVISION_HEAD) can only manage their own division.
      return effectiveScope.toUpperCase() === requiredDivision.toUpperCase();
    }

    // For CCTV access, if user has a divisionScope set (e.g. DIVISION_HEAD of another division), restrict to KEAMANAN only.
    if (permissionCode === 'cctv:view') {
      const effectiveScope = userWithRoles.divisionScope ?? user.divisionScope ?? null;
      if (effectiveScope) {
        return effectiveScope.toUpperCase() === 'KEAMANAN';
      }
      return true;
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
    'division:manage:keamanan',
  ]);
}

/**
 * Check if a given userId belongs to the SUPERADMIN role.
 * Independent of session — callable from cron, server actions, etc.
 */
export async function isUserSuperAdminById(userId: string): Promise<boolean> {
  const count = await db.userRole.count({
    where: { userId, role: { name: 'SUPERADMIN' } },
  });
  return count > 0;
}

