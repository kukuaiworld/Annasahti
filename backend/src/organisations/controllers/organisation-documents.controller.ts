import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { OrgAdminGuard } from '../guards/org-admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { OrganisationDocumentsService } from '../services/organisation-documents.service';
import { SubmitDocumentDto } from '../dto/submit-document.dto';

@ApiTags('Organisation Documents')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard, OrgAdminGuard)
@Controller('organisations/:id')
export class OrganisationDocumentsController {
  constructor(
    private readonly documentsService: OrganisationDocumentsService,
  ) {}

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit verification document metadata',
    description:
      'Records metadata for regulatory, identity, or tax exemption documents uploaded to secure storage.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 201, description: 'Document metadata recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid document metadata' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async submitDocument(
    @Param('id') id: string,
    @Body() submitDto: SubmitDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.submitDocument(id, submitDto, user.id);
  }

  @Get('documents')
  @ApiOperation({
    summary: 'List documents for organisation',
    description:
      'Retrieves all verification and compliance documents submitted for this organisation.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'List of submitted documents' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async getDocuments(@Param('id') id: string) {
    return this.documentsService.getDocumentsByOrg(id);
  }

  @Post('submit-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit organisation for verification review',
    description:
      'Validates that required documentation is attached and submits the organisation to platform reviewers.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Successfully submitted for verification' })
  @ApiResponse({ status: 400, description: 'No documents attached' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async submitForVerification(@Param('id') id: string) {
    return this.documentsService.submitForVerification(id);
  }
}
