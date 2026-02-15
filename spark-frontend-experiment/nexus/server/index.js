import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

/**
 * POST /api/chat
 * Proxies chat messages to Claude API with Workbook context injection.
 */
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key.'
    });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = `You are Workbook AI, an intelligent business assistant. You help users understand their business data, prepare for meetings, track actions, and make better decisions.

Current context:
- Industry: ${context?.industry || 'consulting'}
- Company: ${context?.companyName || 'Meridian Consulting Group'}
- Current page: ${context?.currentPage || 'dashboard'}
- Persona: ${context?.persona || 'CEO'}

Respond naturally and helpfully. Reference specific data from the company context when relevant. Keep responses concise but insightful. Use markdown formatting for structured responses.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `API error: ${error}` });
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || 'No response generated.';

    res.json({ response: aiResponse });
  } catch (err) {
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

/**
 * GET /api/health
 * Health check endpoint.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Workbook Demo Server running on http://localhost:${PORT}`);
  console.log(`API Key: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET - copy .env.example to .env'}`);
});
