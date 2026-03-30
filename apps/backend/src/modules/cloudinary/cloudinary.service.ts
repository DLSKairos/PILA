import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    })
  }

  async uploadImage(
    fileBuffer: Buffer,
    folder: string,
    filename?: string,
  ): Promise<{ publicId: string; secureUrl: string; width: number; height: number; bytes: number; format: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
          })
        },
      )
      uploadStream.end(fileBuffer)
    })
  }

  async saveAsset(
    fileBuffer: Buffer,
    folder: string,
    filename?: string,
  ) {
    const uploaded = await this.uploadImage(fileBuffer, folder, filename)

    return this.prisma.cloudinaryAsset.create({
      data: {
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        resourceType: 'image',
        folder,
      },
    })
  }

  async deleteAsset(publicId: string) {
    await cloudinary.uploader.destroy(publicId)
    await this.prisma.cloudinaryAsset.deleteMany({ where: { publicId } })
  }

  getOptimizedUrl(publicId: string, width = 800): string {
    return cloudinary.url(publicId, {
      width,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto',
    })
  }
}
