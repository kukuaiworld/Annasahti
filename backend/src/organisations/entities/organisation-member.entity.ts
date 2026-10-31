import { AppRole } from '../enums/app-role.enum';

export class OrganisationMember {
  id: string;
  organisationId: string;
  userId: string;
  role: AppRole;
  isActive: boolean;
  joinedAt: Date;
}
