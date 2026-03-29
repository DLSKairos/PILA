import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common'
import { ClientsService } from './clients.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('TRAINER')
@Controller('trainer/clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  createClient(@CurrentUser() user: any, @Body() dto: any) {
    return this.clientsService.createClient(user.id, dto)
  }

  @Get()
  listClients(@CurrentUser() user: any) {
    return this.clientsService.listClients(user.id)
  }

  @Get(':id')
  getClient(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.getClient(user.id, id)
  }

  @Patch(':id')
  updateClient(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.clientsService.updateClient(user.id, id, dto)
  }

  @Delete(':id')
  deactivateClient(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.deactivateClient(user.id, id)
  }

  @Post(':id/profile')
  createProfile(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.clientsService.createOrUpdateProfile(user.id, id, dto)
  }

  @Get(':id/profile')
  getProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.getClient(user.id, id)
  }

  @Post(':id/gyms')
  addGym(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.clientsService.addGym(user.id, id, dto)
  }

  @Get(':id/gyms')
  getGyms(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.getGyms(user.id, id)
  }

  @Post(':id/restrictions')
  addRestriction(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.clientsService.addRestriction(user.id, id, dto)
  }

  @Post(':id/injuries')
  addInjury(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.clientsService.addInjury(user.id, id, dto)
  }
}
