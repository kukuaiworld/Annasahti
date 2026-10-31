import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../auth/guards/supabase-auth.guard';
import { IOrganisationRepository } from '../repositories/organisation.repository.interface';
import { AppRole } from '../enums/app-role.enum';

@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(
    @Inject('ORGANISATION_REPOSITORY')
    private readonly orgRepository: IOrganisationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const rawOrgId = request.params.id;
    const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
    if (!orgId || typeof orgId !== 'string') {
      throw new ForbiddenException('Organisation ID parameter is missing');
    }

    const organisation = await this.orgRepository.findById(orgId);
    if (!organisation) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    const member = await this.orgRepository.findMembership(orgId, user.id);
    if (!member || !member.isActive) {
      throw new ForbiddenException(
        'Access denied: You are not an active member of this organisation',
      );
    }

    if (member.role !== AppRole.ADMIN) {
      throw new ForbiddenException(
        'Access denied: Organisation administrator role required',
      );
    }

    return true;
  }
}
