import { NextRequest } from 'next/server';
import {
  LLMClient,
  Config,
  HeaderUtils,
  APIError,
  type Message,
} from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const VISION_MODEL = 'doubao-seed-2-0-pro-260215';

interface RecognizeResult {
  name: string;
  route: string;
  dose: string;
  unit: string;
  frequency: string;
  times: string[];
  note: string;
  error?: string;
}

function extractJson(text: string): RecognizeResult | null {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as RecognizeResult;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `你是一位细心、负责任的中文家庭用药整理助手。用户会上传一张药盒 / 药品包装的照片，请你仔细识别包装上的文字与说明，提取用药信息。

规则（严格遵守）：
1. 只做"整理与识别"，不做医疗诊断，不推测包装上没有的信息。
2. 分别识别：
   - name：药品名称（商品名或通用名均可，尽量准确、完整）
   - route：给药途径，只允许三选一："口服" / "外用" / "其他"（如贴剂、眼药水等外用归"外用"，无法判断归"其他"）
   - dose：单次用量数字（不含单位），如 "1"、"2"、"5"
   - unit：单次用量单位，中文，如 "片"、"粒"、"胶囊"、"毫升"、"袋"、"包"、"喷"、"滴"
   - frequency：用药频次中文描述，如 "每日3次"、"早晚各一次"、"每日1次"（看不到就填 "按说明书"）
   - times：服药时刻列表，24小时制 "HH:MM" 数组。若包装上有明确时刻就填，否则按频次推断合理的通用时刻（如每日3次 → ["08:00","12:00","20:00"]）；推断的也照常填入，用户在确认表单里可改。没有则给空数组。
   - note：包装上的其他重要说明或备注（如"饭后服"、"一天最多4粒"等），没有则空字符串。
3. 识别信息以包装上确实可见的内容为准，看不清就如实给通用值，不要编造药品疗效。

只输出一个 JSON 对象，不要任何多余文字。示例：
{"name":"阿司匹林肠溶片","route":"口服","dose":"1","unit":"片","frequency":"每日1次","times":["08:00"],"note":"饭后服"}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = (body?.image as string) || '';

    if (!image || !/^data:image\//.test(image)) {
      return Response.json(
        { error: '缺少有效的图片数据（data URI 格式）' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(new Config(), customHeaders);

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请识别这张药盒照片上的用药信息，并按要求输出 JSON。' },
          { type: 'image_url', image_url: { url: image, detail: 'high' } },
        ],
      },
    ];

    const response = await client.invoke(messages, {
      model: VISION_MODEL,
      temperature: 0.2,
      thinking: 'disabled',
    });

    const parsed = extractJson(response.content);
    if (!parsed) {
      return Response.json(
        { error: '未能从药盒照片中解析出用药信息，请重试或手动填写。' },
        { status: 422 },
      );
    }

    const result: RecognizeResult = {
      name: parsed.name || '',
      route: ['口服', '外用', '其他'].includes(parsed.route as string)
        ? (parsed.route as string)
        : '口服',
      dose: parsed.dose != null ? String(parsed.dose) : '1',
      unit: parsed.unit || '片',
      frequency: parsed.frequency || '按说明书',
      times: Array.isArray(parsed.times) ? parsed.times.filter(Boolean) : [],
      note: typeof parsed.note === 'string' ? parsed.note : '',
    };

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error('recognize error:', error);
    if (error instanceof APIError) {
      return Response.json({ error: `识别服务异常：${error.message}` }, { status: 502 });
    }
    return Response.json({ error: '识别服务异常，请稍后重试。' }, { status: 500 });
  }
}