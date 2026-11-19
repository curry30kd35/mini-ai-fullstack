import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. 创建私有知识库文档（普通用户默认私有；管理员专用接口可传 isPublic=true）
   */
  async create(userId: number, dto: CreateKnowledgeDto, isPublic = false) {
    return this.prisma.knowledgeDoc.create({
      data: {
        title: dto.title,
        keywords: dto.keywords,
        content: dto.content,
        isPublic,
        userId,
      },
    });
  }

  /**
   * 2. 查询当前用户可用的知识库文档列表（官方公开 + 个人私有）
   */
  async findAll(userId: number) {
    return this.prisma.knowledgeDoc.findMany({
      where: {
        isDeleted: false,
        OR: [{ isPublic: true }, { userId }],
      },
      orderBy: [{ isPublic: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        keywords: true,
        content: true,
        isPublic: true,
        userId: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 3. 软删除知识库文档（带越权校验）
   */
  async remove(userId: number, userRole: string, id: number) {
    const doc = await this.prisma.knowledgeDoc.findFirst({
      where: { id, isDeleted: false },
    });
    if (!doc) {
      throw new NotFoundException(`知识库文档 ID ${id} 不存在`);
    }
    if (doc.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权删除他人的私有知识库！');
    }

    await this.prisma.knowledgeDoc.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, message: `知识库文档 ${id} 删除成功` };
  }

  /**
   * 4. 【核心本地 RAG 检索引擎】：根据用户提问精准召回相关性最高的前 3 篇内部知识
   */
  async searchRelevant(userId: number, query: string, topK = 3) {
    // 捞出当前用户有权访问的所有有效文档
    const docs = await this.prisma.knowledgeDoc.findMany({
      where: {
        isDeleted: false,
        OR: [{ isPublic: true }, { userId }],
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        content: true,
      },
    });

    if (docs.length === 0) return [];

    // 提纯提问文本：剔除标点与常见中文停用词，并切分出 2 字词组（Bigram）和英文单词
    const tokens = this.tokenizeQuery(query);
    if (tokens.length === 0) return [];

    // 为每篇文档计算加权相关性得分
    const scoredDocs = docs
      .map((doc) => {
        let score = 0;
        const titleLower = doc.title.toLowerCase();
        const contentLower = doc.content.toLowerCase();
        const keywordList = (doc.keywords || '')
          .split(/[,，\s]+/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

        // 维度 A：直接命中预设关键词标签（权重最高：+10 分）
        for (const kw of keywordList) {
          if (query.toLowerCase().includes(kw)) {
            score += 10;
          }
        }

        // 维度 B：双字词组匹配标题与正文
        for (const token of tokens) {
          if (titleLower.includes(token)) score += 4;
          if (contentLower.includes(token)) score += 1;
        }

        return { ...doc, score };
      })
      // 过滤掉得分过低的无关文档（至少命中 2 分才认为相关）
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredDocs;
  }

  /**
   * 轻量中文双字切片 + 英文分词器（零 C++ 原生依赖，100% 跨平台稳定）
   */
  private tokenizeQuery(text: string): string[] {
    const cleaned = text
      .toLowerCase()
      .replace(/[？?！!。，,、：:""''（）()\s的了吗呢吧啊请问怎么什么一下]/g, ' ');

    const tokens = new Set<string>();
    const segments = cleaned.split(' ').filter(Boolean);

    for (const seg of segments) {
      // 英文/数字词直接加入（长度>=2）
      if (/^[a-z0-9]+$/.test(seg)) {
        if (seg.length >= 2) tokens.add(seg);
        continue;
      }
      // 中文连续片段按滑动窗口切分成 2 字词组（Bigram）
      if (seg.length <= 2) {
        if (seg.length === 2) tokens.add(seg);
      } else {
        for (let i = 0; i < seg.length - 1; i++) {
          tokens.add(seg.slice(i, i + 2));
        }
      }
    }

    return Array.from(tokens);
  }
}