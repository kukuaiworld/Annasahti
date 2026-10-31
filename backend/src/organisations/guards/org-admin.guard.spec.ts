import { ExecutionContext, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrgAdminGuard } from './org-admin.guard';
import { InMemoryOrganisationRepository } from '../repositories/in-memory-organisation.repository';
import { OrganisationType } from '../enums/organisation-type.enum';
import { AppRole } from '../enums/app-role.enum';

describe('OrgAdminGuard', () => {
  let guard: OrgAdminGuard;
  let repo: InMemoryOrganisationRepository;
  let orgId: string;
  const adminUserId = 'admin-user-uuid';
  const volunteerUserId = 'volunteer-user-uuid';
  const strangerUserId = 'stranger-user-uuid';

  beforeEach(async () => {
    repo = new InMemoryOrganisationRepository();
    guard = new OrgAdminGuard(repo);

    const org = await repo.createOrganisation({
      name: 'Hope Kitchen',
      organisationType: OrganisationType.HUMANITARIAN_NGO,
    });
    orgId = org.id;

    await repo.addMember({
      organisationId: orgId,
      userId: adminUserId,
      role: AppRole.ADMIN,
      isActive: true,
    });

    await repo.addMember({
      organisationId: orgId,
      userId: volunteerUserId,
      role: AppRole.VOLUNTEER,
      isActive: true,
    });
  });

  function createMockExecutionContext(
    user?: { id: string; role: string },
    params: Record<string, string> = { id: orgId },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access to active admin of the organisation', async () => {
    const context = createMockExecutionContext({
      id: adminUserId,
      role: 'authenticated',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if user is not authenticated', async () => {
    const context = createMockExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException if organisation does not exist', async () => {
    const context = createMockExecutionContext(
      { id: adminUserId, role: 'authenticated' },
      { id: 'non-existent-id' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not a member of the organisation', async () => {
    const context = createMockExecutionContext({
      id: strangerUserId,
      role: 'authenticated',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is a member but not an admin', async () => {
    const context = createMockExecutionContext({
      id: volunteerUserId,
      role: 'authenticated',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
