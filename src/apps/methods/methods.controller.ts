import { Controller } from '@nestjs/common';
import { MethodsService } from './methods.service';

@Controller('methods')
export class MethodsController {
  constructor(private readonly methodsService: MethodsService) {}
}
