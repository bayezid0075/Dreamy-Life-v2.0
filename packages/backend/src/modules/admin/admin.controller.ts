import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FundPaymentService } from '../wallet/application/services/fund-payment.service';
import { AdminGuard } from './guards/admin.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRefercodeDto } from './dto/update-user-refercode.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly fundPaymentService: FundPaymentService,
  ) {}

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

  @Patch('users/:id/refercode')
  @ApiOperation({ summary: 'Update user referral code and preserve downline chain' })
  @ApiResponse({ status: 200, description: 'Referral code updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Referral code already in use' })
  async updateUserRefercode(
    @Param('id') id: string,
    @Body() body: UpdateUserRefercodeDto,
  ) {
    const result = await this.adminService.updateUserRefercode(id, body.refercode);
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

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset a user password (admin)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    const result = await this.adminService.resetUserPassword(id, body.newPassword);
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

  @Get('fund-payments')
  @ApiOperation({ summary: 'Get all fund payments with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', '7d', '30d', 'all'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Fund payments list' })
  async getFundPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.fundPaymentService.getFundPayments(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      filter,
      search,
    );
    return { success: true, data: result };
  }

  @Get('fund-stats')
  @ApiOperation({ summary: 'Get fund payment statistics' })
  @ApiResponse({ status: 200, description: 'Fund stats retrieved' })
  async getFundStats() {
    const stats = await this.fundPaymentService.getFundStats();
    return { success: true, data: stats };
  }

  // ─── Membership Plan Management ──────────────────────────────────────

  @Get('membership-plans')
  @ApiOperation({ summary: 'List all membership plans' })
  @ApiResponse({ status: 200, description: 'Membership plans list' })
  async getMembershipPlans() {
    const plans = await this.adminService.getMembershipPlans();
    return { success: true, data: plans };
  }

  @Get('membership-plans/:id')
  @ApiOperation({ summary: 'Get a membership plan by ID' })
  @ApiResponse({ status: 200, description: 'Membership plan detail' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getMembershipPlanById(@Param('id') id: string) {
    const plan = await this.adminService.getMembershipPlanById(id);
    return { success: true, data: plan };
  }

  @Post('membership-plans')
  @ApiOperation({ summary: 'Create a new membership plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate name or level' })
  async createMembershipPlan(@Body() body: CreateMembershipPlanDto) {
    const plan = await this.adminService.createMembershipPlan(body);
    return { success: true, data: plan };
  }

  @Patch('membership-plans/:id')
  @ApiOperation({ summary: 'Update a membership plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Duplicate name or level' })
  async updateMembershipPlan(
    @Param('id') id: string,
    @Body() body: UpdateMembershipPlanDto,
  ) {
    const plan = await this.adminService.updateMembershipPlan(id, body);
    return { success: true, data: plan };
  }

  @Delete('membership-plans/:id')
  @ApiOperation({ summary: 'Delete a membership plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete plan with active users' })
  async deleteMembershipPlan(@Param('id') id: string) {
    const result = await this.adminService.deleteMembershipPlan(id);
    return { success: true, data: result };
  }

  @Get('membership-stats')
  @ApiOperation({ summary: 'Get membership purchase statistics' })
  @ApiResponse({ status: 200, description: 'Membership stats retrieved' })
  async getMembershipStats() {
    const stats = await this.adminService.getMembershipStats();
    return { success: true, data: stats };
  }

  // ─── Vendor Management ──────────────────────────────────────────────────

  @Get('vendors')
  @ApiOperation({ summary: 'List vendors with pagination, search, and status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'banned'] })
  async getVendors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getVendors(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      status,
    );
    return { success: true, data: result };
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor detail with product count and order count' })
  @ApiResponse({ status: 200, description: 'Vendor detail retrieved' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorById(@Param('id') id: string) {
    const vendor = await this.adminService.getVendorById(id);
    return { success: true, data: vendor };
  }

  @Patch('vendors/:id/status')
  @ApiOperation({ summary: 'Ban or unban a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor status updated' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendorStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'banned' },
  ) {
    const result = await this.adminService.updateVendorStatus(id, body.status);
    return { success: true, data: result };
  }

  // ─── Product Management ─────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'List all products with vendor info, pagination, search, category filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const result = await this.adminService.getProducts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      category,
    );
    return { success: true, data: result };
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product detail' })
  @ApiResponse({ status: 200, description: 'Product detail retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    const product = await this.adminService.getProductById(id);
    return { success: true, data: product };
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Admin soft-delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string) {
    const result = await this.adminService.deleteProduct(id);
    return { success: true, data: result };
  }
}
