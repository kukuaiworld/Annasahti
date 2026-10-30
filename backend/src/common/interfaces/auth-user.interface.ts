import { AppRole } from '../enums/app.enums';

export interface AuthUser {
  id: string;
  email?: string;
  fullName: string;
  role: AppRole;
  organisationId?: string;
  organisationRole?: AppRole;
}
