import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import OpenAI from 'openai';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { SearchService } from './search.service'; // 新增
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly modelName: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService, // 新增依赖注入
  ) {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const baseURL = this.configService.get<string>('AI_BASE_URL');
    this.modelName =
      this.configService.get<string>('AI_MODEL') || 'deepseek-chat';

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
      baseURL: baseURL || 'https://api.deepseek.com/v1',
    });
  }

  /**
   * 生产级 POST 流式对话（含会话管理、历史记忆上下文与原子落库）
   */
  // async streamChat(userId: number, dto: ChatDto, res: Response) {
  //   let conversationId = dto.conversationId;

  //   // ==================== 阶段 1：会话校验或初始化（发生异常时响应头未发，可正常返回 404 JSON） ====================
  //   if (conversationId) {
  //     // 校验会话是否存在且归属于当前登录用户（防越权！）
  //     const existConv = await this.prisma.conversation.findFirst({
  //       where: { id: conversationId, userId, isDeleted: false },
  //     });
  //     if (!existConv) {
  //       throw new NotFoundException(
  //         `会话 ID ${conversationId} 不存在或无权访问`,
  //       );
  //     }
  //   } else {
  //     // 首次提问：自动创建新会话，截取前 20 个字作为默认标题
  //     const autoTitle =
  //       dto.prompt.trim().slice(0, 20) + (dto.prompt.length > 20 ? '...' : '');
  //     const newConv = await this.prisma.conversation.create({
  //       data: {
  //         title: autoTitle,
  //         userId,
  //       },
  //     });
  //     conversationId = newConv.id;
  //   }

  //   // ==================== 阶段 2：提取最近 6 条历史消息构成记忆上下文 ====================
  //   const recentMessages = await this.prisma.message.findMany({
  //     where: { conversationId },
  //     orderBy: { createdAt: 'desc' },
  //     take: 6, // 滑窗控制：只取最近 6 条，防止超出大模型 Token 上限并节省费用
  //     select: { role: true, content: true },
  //   });

  //   // 关键细节：数据库倒序查出后，必须反转回从旧到新的正常时间顺序！
  //   const historyContext = recentMessages.reverse().map((msg) => ({
  //     role: msg.role as 'system' | 'user' | 'assistant',
  //     content: msg.content,
  //   }));

  //   // 立即将本次用户的提问写入数据库
  //   await this.prisma.message.create({
  //     data: {
  //       conversationId,
  //       role: MessageRole.user,
  //       content: dto.prompt,
  //     },
  //   });

  //   //  ==================== 新增：阶段 2.5 调用搜索引擎获取实时信息 (RAG) ====================
  //   let searchContext = '';
  //   //  新增：获取格式化的当前北京时间 (例如：2026年11月16日)
  //   const now = new Date();
  //   const currentDateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  //   try {
  //     if (this.configService.get<string>('TAVILY_API_KEY')) {
  //       //  修改：把当前日期拼接到搜索词里，强制搜索引擎去搜这个日期的内容
  //       // 提取历史记录中最后一条用户的提问
  //       const lastUserMsg =
  //         historyContext.filter((m) => m.role === 'user').pop()?.content || '';
  //       // 把“当前日期 + 上一句话 + 当前这句话”组合起来去搜，确保搜索引擎能理解上下文
  //       const searchQuery = `${currentDateStr} ${lastUserMsg ? lastUserMsg + ' ' : ''}${dto.prompt}`;
  //       this.logger.log(`正在为问题 "${searchQuery}" 执行联网搜索...`);
  //       const searchResults = await this.searchService.search(searchQuery);

  //       if (searchResults && searchResults.length > 0) {
  //         // 将搜索结果拼接成一段上下文供大模型参考
  //         searchContext = searchResults
  //           .map(
  //             (item, index) =>
  //               // 核心防幻觉逻辑：截取前500个字符，防止长表格搞晕大模型
  //               `[${index + 1}] 标题: ${item.title}\n内容摘要: ${item.content.substring(0, 500)}\n来源链接: ${item.url}`,
  //           )
  //           .join('\n\n');
  //         this.logger.log(
  //           `搜索成功，获取到 ${searchResults.length} 条参考资料。`,
  //         );
  //         //  加这一行，去终端看看搜到的到底是个啥
  //         // console.log('搜到的原始内容：\n', searchContext);
  //       }
  //     }
  //   } catch (error) {
  //     // 容错降级：搜索失败不影响主流程，大模型继续基于自身知识回答
  //     this.logger.error('联网搜索失败，将降级为普通对话:', error);
  //   }
  //   //  ==================== 新增结束 ====================

  //   //  大招：把搜索结果强制缝合进用户的问题里
  //   //  修改：在 Prompt 中明确告知大模型今天的真实日期
  //   const finalUserPrompt = searchContext
  //     ? `【重要提示：当前的准确时间是 ${currentDateStr}】\n\n请仔细阅读以下联网搜索结果，并回答我的问题。\n\n【处理规则】：\n1. 搜索结果可能包含长文本、无关广告或大量重复信息，请务必进行【去重】和【提炼】。\n2. 请原样提取搜索结果中与问题相关的核心事实，绝不要自己编造数据。\n3. 如果搜索结果中找不到答案，请直接回答“未查找到相关信息”。\n\n=== 搜索结果开始 ===\n${searchContext}\n=== 搜索结果结束 ===\n\n我的问题是：${dto.prompt}`
  //     : dto.prompt;

  //   const messagesPayload: OpenAI.Chat.ChatCompletionMessageParam[] = [
  //     {
  //       role: 'system',
  //       content:
  //         '你是一个基于实时信息回答问题的智能助手。请严格按照用户提供的搜索结果来回答。',
  //     },
  //     ...historyContext,
  //     { role: 'user', content: finalUserPrompt }, //  用缝合后的 Prompt
  //   ];

  //   // ==================== 阶段 3：设置 SSE 响应头并开启流式推流 ====================
  //   res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  //   res.setHeader('Cache-Control', 'no-cache, no-transform');
  //   res.setHeader('Connection', 'keep-alive');
  //   res.setHeader('X-Accel-Buffering', 'no'); // 显式告诉 Nginx 等代理不要缓冲流
  //   res.flushHeaders(); // 立刻把响应头刷出去，建立长连接

  //   // 先把当前的 conversationId 推送给前端，方便前端在下次追问时携带
  //   res.write(`data: ${JSON.stringify({ type: 'meta', conversationId })}\n\n`);

  //   let fullAssistantReply = ''; // 在内存中拼接 AI 吐出的完整文本

  //   try {
  //     const apiKey = this.configService.get<string>('AI_API_KEY');
  //     if (!apiKey) {
  //       // 【本地无 Key 模拟流（带上下文感知测试）】
  //       fullAssistantReply = await this.simulateStreamWithContext(
  //         dto.prompt,
  //         historyContext.length,
  //         res,
  //       );
  //     } else {
  //       // 调用真实大模型流式接口
  //       const stream = await this.openai.chat.completions.create({
  //         model: this.modelName,
  //         messages: messagesPayload,
  //         stream: true,
  //       });

  //       for await (const chunk of stream) {
  //         const deltaContent = chunk.choices[0]?.delta?.content || '';
  //         if (deltaContent) {
  //           fullAssistantReply += deltaContent;
  //           res.write(
  //             `data: ${JSON.stringify({ type: 'content', content: deltaContent })}\n\n`,
  //           );
  //         }
  //       }
  //     }

  //     // ==================== 阶段 4：流正常结束，将 AI 完整回答持久化落库 ====================
  //     if (fullAssistantReply.trim()) {
  //       await this.prisma.message.create({
  //         data: {
  //           conversationId,
  //           role: MessageRole.assistant,
  //           content: fullAssistantReply,
  //         },
  //       });
  //     }

  //     // 推送结束标志，并关闭 HTTP 长连接
  //     res.write(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`);
  //     res.end();
  //   } catch (error) {
  //     this.logger.error('SSE 流式推送发生异常:', error);
  //     // 关键防崩溃处理：头已发出，绝对不能再 throw 给全局异常过滤器，而是走流内报错通知
  //     res.write(
  //       `data: ${JSON.stringify({ type: 'error', message: '大模型服务响应异常，请稍后重试' })}\n\n`,
  //     );
  //     res.end();
  //   }
  // }

  /**
   * 生产级 POST 流式对话（含：智能意图路由 + 上下文搜索改写 + RAG + 记忆上下文 + 事务落库）
   */
  async streamChat(userId: number, dto: ChatDto, res: Response) {
    let conversationId = dto.conversationId;
    let customSystemPrompt = ''; // 新增变量：用来保存当前会话绑定的专属角色提示词

    // ==================== 阶段 1：会话校验或初始化 ====================
    if (conversationId) {
      const existConv = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId, isDeleted: false },
        // 连带查出该会话绑定的模版提示词
        include: {
          template: {
            select: { systemPrompt: true, isDeleted: true },
          },
        },
      });
      if (!existConv) {
        throw new NotFoundException(
          `会话 ID ${conversationId} 不存在或无权访问`,
        );
      }
    } else {
      // 新建会话时，如果前端传了 templateId，必须去数据库查出它的 systemPrompt！
      if (dto.templateId) {
        const tpl = await this.prisma.promptTemplate.findFirst({
          where: {
            id: dto.templateId,
            isDeleted: false,
            OR: [{ isPublic: true }, { userId }],
          },
        });
        if (!tpl) {
          throw new NotFoundException(
            `指定的角色模版 ID ${dto.templateId} 不存在或无权使用`,
          );
        }
        customSystemPrompt = tpl.systemPrompt;
      }
      const autoTitle =
        dto.prompt.trim().slice(0, 20) + (dto.prompt.length > 20 ? '...' : '');
      const newConv = await this.prisma.conversation.create({
        data: {
          title: autoTitle,
          userId,
          templateId: dto.templateId ?? null, // 绑定进会话表
        },
      });
      conversationId = newConv.id;
    }

    // ==================== 阶段 2：提取最近 6 条历史消息构成记忆上下文 ====================
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { role: true, content: true },
    });

    const historyContext = recentMessages.reverse().map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // 保存本次用户输入（存干净的原始提问）
    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.user,
        content: dto.prompt,
      },
    });

    // ==================== 阶段 2.5：智能意图路由与搜索词改写 (核心升级！) ====================
    // 严格获取北京时间，防止服务器在 UTC 时区导致日期差一天
    // const beijingDate = new Date(
    //   new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }),
    // );
    // const currentDateStr = `${beijingDate.getFullYear()}年${beijingDate.getMonth() + 1}月${beijingDate.getDate()}日`;

    // 1. 严格使用标准 Intl API 获取北京时间年月日与星期，彻底摆脱宿主服务器时区和字符串二次解析 Bug
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const currentDateStr = `${year}年${month}月${day}日`; // 如：2026年11月17日
    const shortDateStr = `${month}月${day}日`; // 如：11月17日

    let searchContext = '';
    const hasTavilyKey = !!this.configService.get<string>('TAVILY_API_KEY');
    const apiKey = this.configService.get<string>('AI_API_KEY');

    // 先开启 SSE 响应头（让前端能立刻收到状态反馈，消除等待卡顿感）
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'meta', conversationId })}\n\n`);

    try {
      if (hasTavilyKey && apiKey) {
        // 1. 让 AI 先判断：到底需不需要联网？如果需要，提纯出干净的搜索词！
        const intent = await this.analyzeIntentAndRewriteQuery(
          historyContext,
          dto.prompt,
          currentDateStr,
        );
        this.logger.log(`意图分析结果: ${JSON.stringify(intent)}`);

        if (intent.needSearch && intent.searchQuery) {
          // 可选：推送一个状态提示给前端（如果前端没处理 status 类型也不影响正常渲染）
          res.write(
            `data: ${JSON.stringify({ type: 'status', message: `正在联网搜索：${intent.searchQuery}` })}\n\n`,
          );

          const searchResults = await this.searchService.search(
            intent.searchQuery,
          );
          if (searchResults && searchResults.length > 0) {
            searchContext = searchResults
              .map(
                (item, index) =>
                  `[${index + 1}] 标题: ${item.title}\n内容摘要: ${item.content.substring(0, 800)}\n来源: ${item.url}`,
              )
              .join('\n\n');
          }
        }
      }
    } catch (error) {
      this.logger.error('意图路由或联网搜索失败，自动降级为纯对话模式:', error);
    }

    // ==================== 阶段 3：动态构建高智商 Prompt 并流式生成 ====================
    let systemPrompt = '';
    let finalUserPrompt = dto.prompt;

    // 构建角色开场设定：如果绑定了模版，优先用模版的提示词；否则用默认提示词
    const roleSetting =
      customSystemPrompt || '你是一个聪明、严谨、善于沟通的智能助手。';
    if (searchContext) {
      // 【模式 A：联网增强模式（加入强力时间对齐防线）】
      systemPrompt = `${roleSetting}
【绝对真实时间锚点】：现在的北京时间是 ${currentDateStr}（${weekday}）。

你会收到联网搜索引擎抓回来的网页参考资料，但请注意一个核心事实：**搜索引擎抓回来的网页往往是 1~3 天前的历史缓存！网页原文里写的“今天”、“明天”、“后天”只是相对于该网页发布那一天的相对时间！**

你必须严格遵守以下【日期对齐铁律】：
1. **无视网页中的相对时间词，只认绝对日期**：既然真实的今天是【${shortDateStr}】，如果搜索资料里写着“明天（${shortDateStr}）信宜小雨 29℃”，那么你必须识别出这就是**真实今天的天气**，绝对不能照抄网页里的“今天（11月16日）”！
2. **严禁拿历史旧数据伪装成今天**：如果用户明确问“今天（${shortDateStr}）”的信息（如今天的NBA赛程），但搜索资料里只有过去日期的数据（如只有 11月15日 的赛程，找不到 ${shortDateStr} 的赛程），**绝对禁止**把 15 号的数据直接说成“以下是今天的赛程”！你必须诚实告知用户：“由于检索到的网页缓存停留在 X月X日，暂未抓取到今天（${shortDateStr}）的最新数据”，然后再附上搜到的历史数据供参考。
3. **只提取客观事实**：切勿编造搜索结果里没有的温度或比赛比分。
4. **排版克制**：直接给出清晰简洁的中文结论；遇到英文球队或专业名词请准确翻译，无法确认的宁可不写也不要乱编；不要在末尾堆砌超长的编码 URL 链接。
`;

      finalUserPrompt = `【真实当前日期：${currentDateStr} ${weekday}】\n\n【实时联网搜索参考资料】：\n${searchContext}\n\n【用户当前提问】：${dto.prompt}`;
    } else {
      // 【模式 B：纯对话 / 总结模式】
      systemPrompt = `${roleSetting}当前北京时间是 ${currentDateStr}（${weekday}）。
请严格保持你上述的角色设定，请充分理解并承接上面的历史对话上下文，清晰、有条理地回答用户的问题、进行对话总结或解释原因。`;
    }

    const messagesPayload: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historyContext,
      { role: 'user', content: finalUserPrompt },
    ];

    let fullAssistantReply = '';

    try {
      if (!apiKey) {
        fullAssistantReply = await this.simulateStreamWithContext(
          dto.prompt,
          historyContext.length,
          res,
        );
      } else {
        const stream = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: messagesPayload,
          stream: true,
        });

        for await (const chunk of stream) {
          const deltaContent = chunk.choices[0]?.delta?.content || '';
          if (deltaContent) {
            fullAssistantReply += deltaContent;
            res.write(
              `data: ${JSON.stringify({ type: 'content', content: deltaContent })}\n\n`,
            );
          }
        }
      }

      // ==================== 阶段 4：事务落库（写入 AI 回复 + 置顶活跃会话） ====================
      if (fullAssistantReply.trim()) {
        await this.prisma.$transaction([
          this.prisma.message.create({
            data: {
              conversationId,
              role: MessageRole.assistant,
              content: fullAssistantReply,
            },
          }),
          this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          }),
        ]);
      }

      res.write(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('SSE 流式推送发生异常:', error);
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: '大模型服务响应异常，请稍后重试' })}\n\n`,
      );
      res.end();
    }
  }

  /**
   * 【核心新增】意图路由与搜索词改写器
   * 解决两个痛点：1. 总结/闲聊不乱搜；2. 追问时能结合上下文自动补全主语（如“那深圳呢？”->“2026年11月17日 深圳 天气预报”）
   */
  private async analyzeIntentAndRewriteQuery(
    historyContext: Array<{ role: string; content: string }>,
    currentPrompt: string,
    currentDateStr: string,
  ): Promise<{ needSearch: boolean; searchQuery: string }> {
    // 只取最近 4 条简短历史用于指代消解，避免路由阶段浪费 Token
    const recentBrief = historyContext
      .slice(-4)
      .map((m) => `${m.role}: ${m.content.slice(0, 120)}`)
      .join('\n');

    // 打印给路由器看的历史上下文，方便一眼核实 HTML 是否真的传对了会话！
    this.logger.log(`=== 路由参考的历史 ===\n${recentBrief || '（空）'}`);

    const routerPrompt = `你是一个精准的搜索关键词调度器。当前真实日期是：${currentDateStr}。
你的任务是判断【用户最新提问】是否需要联网搜索，如果需要，必须结合【最近对话】补全被省略的主题！

【什么时候不需要联网（needSearch: false）】：
- 回顾或总结刚才聊的内容（如：“总结一下”、“我刚才问了啥”、“我叫什么”）。
- 日常闲聊、写代码、解释概念、问你为什么查不到。

【什么时候需要联网（needSearch: true）】：
- 查天气、查比赛赛程、查新闻、查实时价格、问某个客观事物。
- **核心铁律**：如果用户最新提问是个简短的追问（如“那信宜呢？”、“北京呢？”），**必须从【最近对话】里提取出刚才在聊的主题（如“天气预报”、“赛程”）拼接到搜索词里！**
- **时间铁律**：搜索词里禁止出现“今天”二字，必须替换成“${currentDateStr}”。

【参考示例】：
示例1（追问省略）：
最近对话：user: 今天的广州天气怎么样 | assistant: 今天广州多云...
最新提问：那信宜呢
输出：{"needSearch": true, "searchQuery": "${currentDateStr} 广东信宜 天气预报"}

示例2（总结回顾）：
最近对话：user: 查一下广州天气 | assistant: ...
最新提问：总结一下我们聊了什么
输出：{"needSearch": false, "searchQuery": ""}

示例3（赛事查询）：
最近对话：无
最新提问：查一下今天的NBA赛程
输出：{"needSearch": true, "searchQuery": "${currentDateStr} NBA今日赛程 虎扑"}

现在请严格只输出一行纯 JSON，不要任何多余文字：
【最近对话】：
${recentBrief || '无'}
【用户最新提问】：
${currentPrompt}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: routerPrompt }],
        temperature: 0.1,
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          needSearch: Boolean(parsed.needSearch),
          searchQuery: String(parsed.searchQuery || ''),
        };
      }
    } catch (err) {
      this.logger.warn('意图路由 JSON 解析失败，降级为不搜索:', err);
    }

    return { needSearch: false, searchQuery: '' };
  }

  /**
   * 模拟带记忆上下文的打字机流
   */
  private async simulateStreamWithContext(
    prompt: string,
    historyCount: number,
    res: Response,
  ): Promise<string> {
    const mockReply = `【模拟 AI 回复】（当前已携带 ${historyCount} 条历史上下文记忆）针对你的提问“${prompt}”，系统已完成 Token 校验与 MySQL 会话绑定，流式推送正常！`;
    const chars = mockReply.split('');

    for (const char of chars) {
      res.write(
        `data: ${JSON.stringify({ type: 'content', content: char })}\n\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    return mockReply;
  }

  /**
   * 2. 获取当前用户的左侧历史会话列表（按最后活跃时间倒序）
   */
  async getConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        template: {
          select: { id: true, title: true }, //  顺带返回绑定的角色名
        },
        // 顺带查出该会话一共有多少条消息
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  /**
   * 3. 获取指定会话下的所有历史消息（按时间正序，方便前端从上到下渲染）
   */
  async getConversationMessages(userId: number, conversationId: number) {
    // 严格校验归属权，防止越权窥探他人隐私
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, isDeleted: false },
      select: { id: true, title: true },
    });

    if (!conversation) {
      throw new NotFoundException(`会话 ID ${conversationId} 不存在或无权访问`);
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }, // 前端气泡是从上到下排列，必须按时间正序 asc！
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      conversation,
      messages,
    };
  }

  /**
   * 4. 重命名会话标题
   */
  async updateConversationTitle(
    userId: number,
    conversationId: number,
    dto: UpdateConversationDto,
  ) {
    // 校验归属权
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, isDeleted: false },
    });

    if (!conversation) {
      throw new NotFoundException(`会话 ID ${conversationId} 不存在或无权修改`);
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: dto.title },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 5. 操作会话（严禁物理 DELETE）
   */
  async handlerConversation(
    userId: number,
    conversationId: number,
    type: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, isDeleted: type !== 'delete' },
    });

    if (!conversation) {
      throw new NotFoundException(`会话 ID ${conversationId} 不存在或无权操作`);
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isDeleted: type === 'delete' },
    });

    return {
      success: true,
      message: `会话 ${conversationId} 已操作成功`,
    };
  }
}
