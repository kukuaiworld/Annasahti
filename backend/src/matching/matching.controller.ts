import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { MatchingService } from './matching.service';
import { MatchQueryDto } from './dto/match-query.dto';
import { RecipientSearchDto } from './dto/recipient-search.dto';

@Controller()
@UseGuards(AuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('batches/:batchId/matches')
  async getBatchMatches(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Query() query: MatchQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchingService.findMatchesForBatch(batchId, query, user);
  }

  @Get('recipients/eligible')
  async searchEligibleRecipients(
    @Query() query: RecipientSearchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchingService.searchEligibleRecipients(query, user);
  }
}
