import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SearchService } from './search.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';


@Module({
  controllers: [AiController],
  providers: [AiService, SearchService],
    imports: [KnowledgeModule],
})
export class AiModule {}
