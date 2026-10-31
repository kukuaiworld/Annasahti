import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DocumentType } from '../entities/organisation-document.entity';

export class SubmitDocumentDto {
  @ApiProperty({
    description: 'Type of verification credential being submitted',
    enum: DocumentType,
    example: DocumentType.FOOD_SAFETY_CERTIFICATE,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Private storage object key/path inside the secure document bucket',
    example: 'organisations/org-123/docs/fssai-2026.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\.\/]+$/, {
    message: 'storagePath must contain only safe path characters',
  })
  storagePath: string;

  @ApiProperty({
    description: 'Original name of the uploaded document',
    example: 'fssai_license_2026.pdf',
  })
  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @ApiProperty({
    description: 'MIME content type of the uploaded file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg|image\/webp)$/, {
    message: 'mimeType must be one of: application/pdf, image/png, image/jpeg, image/webp',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes (maximum 25 MB)',
    example: 204800,
  })
  @IsNumber()
  @Min(1)
  @Max(26214400) // 25 MB
  fileSizeBytes: number;
}
