import { Injectable } from '@nestjs/common'

@Injectable()
export class SearchService {
  async onModuleInit() {}
  async syncProduct(_product: any) {}
  async deleteProduct(_id: string) {}
  async reindexAll(_products: any[]) {}
}