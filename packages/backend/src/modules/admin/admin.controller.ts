import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  AdminDashboardResponse,
  AdminUsersResponse,
  AdminUserDetailResponse,
  AdminUpdateStatusResponse,
  AdminDeleteResponse,
  AdminReferralStatsResponse,
  AdminReferralTreeResponse,
} from '../../common/dto/api-response.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved', type: AdminDashboardResponse })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination and search' })
  @ApiResponse({ status: 200, description: 'Users list retrieved', type: AdminUsersResponse })
  async getUsers(@Query() query: PaginationDto) {
    const result = await this.adminService.getUsers(
      query.page,
      query.limit,
      query.search,
      query.status,
    );
    return { success: true, data: result };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  @ApiResponse({ status: 200, description: 'User detail retrieved', type: AdminUserDetailResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return { success: true, data: user };
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user member status' })
  @ApiResponse({ status: 200, description: 'User status updated', type: AdminUpdateStatusResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    const result = await this.adminService.updateUserStatus(id, body.memberStatus);
    return { success: true, data: result };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted', type: AdminDeleteResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.adminService.deleteUser(id);
    return { success: true, data: result };
  }

  @Get('referrals/stats')
  @ApiOperation({ summary: 'Get referral system statistics' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved', type: AdminReferralStatsResponse })
  async getReferralStats() {
    const stats = await this.adminService.getReferralStats();
    return { success: true, data: stats };
  }

  @Get('referrals/tree')
  @ApiOperation({ summary: 'Get full referral tree' })
  @ApiResponse({ status: 200, description: 'Referral tree retrieved', type: AdminReferralTreeResponse })
  async getReferralTree() {
    const tree = await this.adminService.getReferralTree();
    return { success: true, data: tree };
  }
}
