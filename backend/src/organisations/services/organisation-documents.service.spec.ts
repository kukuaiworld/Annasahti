import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganisationDocumentsService } from './organisation-documents.service';
import { InMemoryOrganisationDocumentRepository } from '../repositories/in-memory-organisation-document.repository';
import { InMemoryOrganisationRepository } from '../repositories/in-memory-organisation.repository';
import { OrganisationType } from '../enums/organisation-type.enum';
import { DocumentType } from '../entities/organisation-document.entity';
import { DocumentReviewStatus } from '../enums/verification-status.enum';

describe('OrganisationDocumentsService', () => {
  let service: OrganisationDocumentsService;
  let docRepo: InMemoryOrganisationDocumentRepository;
  let orgRepo: InMemoryOrganisationRepository;
  let orgId: string;
  const testUserId = 'user-0001-uuid';

  beforeEach(async () => {
    docRepo = new InMemoryOrganisationDocumentRepository();
    orgRepo = new InMemoryOrganisationRepository();
    service = new OrganisationDocumentsService(docRepo, orgRepo);

    const org = await orgRepo.createOrganisation({
      name: 'Safe Food NGO',
      organisationType: OrganisationType.HUMANITARIAN_NGO,
    });
    orgId = org.id;
  });

  describe('submitDocument', () => {
    it('should submit document metadata with PENDING review status', async () => {
      const doc = await service.submitDocument(
        orgId,
        {
          documentType: DocumentType.BUSINESS_REGISTRATION,
          storagePath: 'organisations/docs/cert-123.pdf',
          originalFilename: 'cert-123.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 204800,
        },
        testUserId,
      );

      expect(doc.id).toBeDefined();
      expect(doc.organisationId).toBe(orgId);
      expect(doc.submittedBy).toBe(testUserId);
      expect(doc.reviewStatus).toBe(DocumentReviewStatus.PENDING);
    });

    it('should throw NotFoundException if organisation does not exist', async () => {
      await expect(
        service.submitDocument(
          'non-existent-org',
          {
            documentType: DocumentType.BUSINESS_REGISTRATION,
            storagePath: 'path/doc.pdf',
            originalFilename: 'doc.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 1024,
          },
          testUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitForVerification', () => {
    it('should throw BadRequestException if no documents uploaded', async () => {
      await expect(service.submitForVerification(orgId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should succeed when at least one document is uploaded', async () => {
      await service.submitDocument(
        orgId,
        {
          documentType: DocumentType.BUSINESS_REGISTRATION,
          storagePath: 'path/doc.pdf',
          originalFilename: 'doc.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1024,
        },
        testUserId,
      );

      const result = await service.submitForVerification(orgId);
      expect(result.documentsCount).toBe(1);
      expect(result.message).toContain('submitted successfully');
    });
  });
});
