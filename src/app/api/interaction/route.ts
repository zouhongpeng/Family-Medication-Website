import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils, APIError } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const TEXT_MODEL = 'doubao-seed-2-0-pro-260215';

interface MedInput {
  name: string;
  route?: string;
  dose?: string;
  unit?: string;
  frequency?: string;
}

const SYSTEM_PROMPT = `你是一位沉稳、谨慎的中文家庭用药整理助手。用户会提供一份家人正在口服的药品清单，请你用通俗语言整理"同时服用这些药时需要注意的事项"。

规则（严格遵守）：
1. 只做"信息整理与提醒"，绝不诊断、绝不替代医嘱、绝不吓唬用户。语气平和、专业、不制造恐慌。
2. 输出结构：返回一个 JSON 数组，每个元素是一个注意事项，形如 {"title":"与阿司匹林同服","content":"可能增加胃肠道不适的风险，建议观察..."}。
3. 数量控制在 1~3 条，挑与当前组合最相关的、最常见的同服注意点即可；如果确实是常见的口服药组合、无明确需要注意之处，就返回空数组 []，不要硬编一条无关内容。
4. 语言通俗，写给普通家庭成员看，不用冷僻医学术语堆砌；如用到"相互作用""胃肠道"等，用略带解释的口语。
5. 不要给出具体剂量调整建议，只说"请遵医嘱 / 咨询医生"。
只输出 JSON 数组，不要任何多余文字，不要 Markdown。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meds: MedInput[] = Array.isArray(body?.meds) ? body.meds : [];

    const oral = meds.filter((m) => (m.route || '口服') === '口服');
    if (oral.length < 2) {
      return Response.json({ ok: true, data: [] });
    }

    const listText = oral
      .map(
        (m) =>
          `- ${m.name || '未知药'}${m.dose ? ` ${m.dose}${m.unit || ''}` : ''}${
            m.frequency ? `，${m.frequency}` : ''
          }`,
      )
      .join('\n');

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(new Config(), customHeaders);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `一位家人目前正在口服以下药物：\n${listText}\n\n请整理同时服用这些药需要注意的事项，按规则输出 JSON 数组。`,
      },
    ];

    const response = await client.invoke(messages, {
      model: TEXT_MODEL,
      temperature: 0.4,
      thinking: 'disabled',
    });

    const parsed = parseArray(response.content);

    return Response.json({ ok: true, data: parsed });
  } catch (error) {
    console.error('interaction error:', error);
    if (error instanceof APIError) {
      return Response.json({ error: `分析服务异常：${error.message}` }, { status: 502 });
    }
    return Response.json({ error: '分析服务异常，请稍后重试。' }, { status: 500 });
  }
}

function parseArray(text: string): Array<{ title: string; content: string }> {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (x): x is { title: string; content: string } =>
          x && typeof x.title === 'string' && typeof x.content === 'string',
      )
      .map((x) => ({ title: x.title, content: x.content }));
  } catch {
    return [];
  }
}