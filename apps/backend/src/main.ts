import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
    credentials: true,
  })

  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalInterceptors(new ResponseInterceptor(), new LoggingInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  app.setGlobalPrefix('api/v1')

  await app.listen(process.env.PORT ?? 3001)
  console.log(`PILA Backend running on port ${process.env.PORT ?? 3001}`)
}
bootstrap()
