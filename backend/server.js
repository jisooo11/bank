import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), '.env');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');

  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    acc[key] = value;
    return acc;
  }, {});
}

const env = { ...loadEnvFile(envPath), ...process.env };
const PORT = Number(env.PORT || 8787);
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function buildPrompt(body) {
  const { profile, financialSummary, transactions } = body;

  return `
역할: 월가에서 30년 경력의 전문 투자 상담사
반드시 한국어로 답해라.
사용자의 재정 상태를 바탕으로 매우 간단하고 실용적인 투자 조언을 제시해라.
과장된 표현, 확정 수익 표현은 금지한다.
추천 이유와 함께 핵심 리스크도 짧게 설명해라.
답변은 반드시 5줄 이내로 작성하고, 각 줄은 짧고 가독성 좋게 정리해라.
답변은 반드시 아래 형식과 번호를 그대로 지켜라.

1. 현재 수입·지출·저축 비율을 분석해 안정적인 투자 가능 금액을 계산해줘
- 이 항목은 1줄로 끝내라.

2. 내 재정 상황에 맞는 안전형/중립형/공격형 투자 비중을 추천해줘
- 이 항목은 1줄로 끝내라.

3. 단기·중기·장기 목표에 맞는 투자 전략을 간단히 제안해줘
- 이 항목은 1줄로 끝내라.

4. 리스크를 줄이기 위한 분산 투자 방법을 알려줘
- 이 항목은 1줄로 끝내라.

5. 지금 재정 상태에서 피해야 할 투자 유형도 함께 알려줘
- 이 항목은 1줄로 끝내라.

사용자 재정 정보:
${JSON.stringify(profile, null, 2)}

가계부 요약:
${JSON.stringify(financialSummary, null, 2)}

최근 거래 내역:
${JSON.stringify(transactions, null, 2)}

중요:
- 의료, 법률처럼 단정적으로 말하지 말 것
- 확정 수익 표현 금지
- 각 줄은 번호로 시작하고 문장 하나로 짧게 작성할 것
  `.trim();
}

async function requestGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data.error?.message || 'Gemini API 호출에 실패했습니다.';
    throw new Error(message);
  }

  const advice =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim() || '';

  if (!advice) {
    throw new Error('Gemini 응답에서 조언 내용을 찾지 못했습니다.');
  }

  return advice;
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  response.setHeader('Access-Control-Allow-Origin', '*');

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/investment-advice') {
    if (!GEMINI_API_KEY) {
      sendJson(response, 500, {
        error: 'backend/.env 파일에 GEMINI_API_KEY를 설정해주세요.',
      });
      return;
    }

    let rawBody = '';
    request.on('data', (chunk) => {
      rawBody += chunk;
    });

    request.on('end', async () => {
      try {
        const body = JSON.parse(rawBody || '{}');
        const prompt = buildPrompt(body);
        const advice = await requestGemini(prompt);

        sendJson(response, 200, { advice });
      } catch (error) {
        sendJson(response, 500, {
          error: error instanceof Error ? error.message : '서버 처리 중 오류가 발생했습니다.',
        });
      }
    });

    return;
  }

  sendJson(response, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
