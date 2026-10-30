import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { RecognitionService } from './recognition.service';
import {
  UpdateProfileDto,
  RedeemRewardDto,
  ReviewRewardDto,
  LeaderboardQueryDto,
  VolunteerOfTheMonthDto,
  GenerateCertificateDto,
} from './dto';

@Controller('recognition')
@UseGuards(AuthGuard)
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthUser) {
    return this.recognitionService.getVolunteerProfile(user.id, user);
  }

  @Patch('me')
  async updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.updateVolunteerProfile(dto, user);
  }

  @Get('volunteers/:id')
  async getVolunteerProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.getVolunteerProfile(id, user);
  }

  @Get('volunteers/:id/badges')
  async getVolunteerBadges(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.getBadges(id, user);
  }

  @Post('volunteers/:id/evaluate')
  async evaluateAchievements(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.recognitionService.evaluateAndAwardAchievements(id);
    return { message: 'Achievements evaluated and synchronized.' };
  }

  @Get('certificates')
  async getMyCertificates(@CurrentUser() user: AuthUser) {
    return this.recognitionService.getCertificates(user.id, user);
  }

  @Get('certificates/user/:volunteerId')
  async getUserCertificates(
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.getCertificates(volunteerId, user);
  }

  @Post('certificates/issue')
  async issueCertificate(
    @Body() dto: GenerateCertificateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.issueCertificate(dto, user);
  }

  @Public()
  @Get('certificates/verify/:certificateCode')
  async verifyCertificate(@Param('certificateCode') certificateCode: string) {
    return this.recognitionService.verifyCertificatePublic(certificateCode);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.recognitionService.getLeaderboard(query);
  }

  @Get('volunteer-of-the-month')
  async getVolunteerOfTheMonthHistory() {
    return this.recognitionService.getVolunteerOfTheMonthHistory();
  }

  @Post('volunteer-of-the-month')
  async nominateVolunteerOfTheMonth(
    @Body() dto: VolunteerOfTheMonthDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.nominateVolunteerOfTheMonth(dto, user);
  }

  @Get('rewards')
  async getRewards(@CurrentUser() user: AuthUser) {
    return this.recognitionService.getRewardsCatalog(user);
  }

  @Post('rewards/redeem')
  async redeemReward(
    @Body() dto: RedeemRewardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.requestRewardRedemption(dto, user);
  }

  @Get('rewards/requests')
  async getRewardRequests() {
    return this.recognitionService.getRewardRequests();
  }

  @Patch('rewards/requests/:id')
  async reviewRewardRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewRewardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recognitionService.reviewRewardRedemption(id, dto, user);
  }
}
