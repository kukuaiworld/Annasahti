import { ForpRecordType, ForpVersion } from '../enums/forp-version.enum';

export class ForpProtocolSpecification {
  protocol: 'Food Open Rescue Protocol (FORP)';
  version: ForpVersion;
  status: 'PROPOSED_STANDARD';
  specificationUrl: string;
  schemas: Record<ForpRecordType, Record<string, unknown>>;
  eventDefinitions: string[];
  interoperabilityGuidelines: string[];
}
