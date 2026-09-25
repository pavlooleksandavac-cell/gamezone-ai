server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static('public'));

const SYSTEM_PROMPT = `Ти Chat NN — розумний асистент сайту GameZone.

Допомагай користувачам користуватися GameZone: пояснюй магазин, квести, профіль, чат, навігацію та функції сайту.

Відповідай українською, якщо користувач пише українською.
Будь дружнім, коротким і зрозумілим.
Не вигадуй функції, яких немає.
Якщо питання не стосується GameZone, можеш відповісти як звичайний AI-помічник.

Ти не можеш самостійно змінювати акаунти, ролі, монети або налаштування сайту.`;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(openai),
    model
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: 'AI сервер не налаштований'
      });
    }

    const input = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const messages = input
      .filter(
        m =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 4000)
      }));

    if (!messages.length) {
      return res.status(400).json({
        error: 'Немає повідомлення'
      });
    }

    const response = await openai.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: messages
    });

    res.json({
      reply: response.output_text || 'Не вдалося отримати відповідь від NN.'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Помилка AI-сервера'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`GameZone AI server запущено на порту ${port}`);
});
