import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganisationDocumentRepository } from '../repositories/organisation-document.repository.interface';
import { IOrganisationRepository } from '../repositories/organisation.repository.interface';
import { SubmitDocumentDto } from '../dto/submit-document.dto';
import {
  OrganisationDocument,
} from '../entities/organisation-document.entity';
import { DocumentReviewStatus } from '../enums/verification-status.enum';

@Injectable()
export class OrganisationDocumentsService {
  constructor(
    @Inject('ORGANISATION_DOCUMENT_REPOSITORY')
    private readonly docRepository: IOrganisationDocumentRepository,
    @Inject('ORGANISATION_REPOSITORY')
    private readonly orgRepository: IOrganisationRepository,
  ) {}

  async submitDocument(
    orgId: string,
    submitDto: SubmitDocumentDto,
    submittedBy: string,
  ): Promise<OrganisationDocument> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    return this.docRepository.createDocument({
      organisationId: orgId,
      documentType: submitDto.documentType,
      storagePath: submitDto.storagePath,
      originalFilename: submitDto.originalFilename,
      mimeType: submitDto.mimeType,
      fileSizeBytes: submitDto.fileSizeBytes,
      submittedBy,
      reviewStatus: DocumentReviewStatus.PENDING,
    });
  }

  async getDocumentsByOrg(orgId: string): Promise<OrganisationDocument[]> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    return this.docRepository.findByOrgId(orgId);
  }

  async updateDocumentReview(
    docId: string,
    status: DocumentReviewStatus,
    reviewedBy: string,
    reviewNotes?: string,
  ): Promise<OrganisationDocument> {
    const doc = await this.docRepository.findById(docId);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${docId} not found`);
    }

    return this.docRepository.updateReviewStatus(
      docId,
      status,
      reviewedBy,
      new Date(),
      reviewNotes,
    );
  }

  async submitForVerification(
    orgId: string,
  ): Promise<{ message: string; documentsCount: number }> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    const docs = await this.docRepository.findByOrgId(orgId);
    if (docs.length === 0) {
      throw new BadRequestException(
        'At least one compliance or verification document must be uploaded before submitting for verification.',
      );
    }

    return {
      message: 'Organisation documentation submitted successfully for reviewer verification.',
      documentsCount: docs.length,
    };
  }
}
