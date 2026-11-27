import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  //  This line is only for testing, delete it when it is no longer needed
  @Get('test')
  test() {
    return { id: '1', type: 'payment', data: { amount: 5000 } };
  }
}
