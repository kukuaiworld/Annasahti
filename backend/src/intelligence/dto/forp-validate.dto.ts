import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { ForpRecordType } from '../enums/forp-version.enum';

export class ForpValidateDto {
  @ApiProperty({
    description: 'Protocol record schema type to validate against',
    enum: ForpRecordType,
    example: ForpRecordType.FOOD_DONATION,
  })
  @IsEnum(ForpRecordType)
  recordType: ForpRecordType;

  @ApiProperty({
    description: 'Payload object conforming to FORP specification',
    example: {
      donationId: 'd-12345',
      donorOrganisationId: 'org-1111',
      foodName: 'Cooked Basmati Rice',
      category: 'human_consumption',
      quantity: 25.5,
      unit: 'kg',
      preparedAt: '2026-10-31T12:00:00Z',
      bestBeforeAt: '2026-10-31T20:00:00Z',
    },
  })
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, unknown>;
}
