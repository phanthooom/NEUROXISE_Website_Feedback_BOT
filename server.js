require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all origins for simplicity, or specify the frontend URL
app.use(express.json());

const PORT = process.env.PORT || 3001;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.post('/api/feedback', async (req, res) => {
  const { name, email, topic, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram credentials missing in .env");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const text = `
📩 <b>Новая заявка с сайта NEUROXISE</b>

👤 <b>Имя:</b> ${name}
📧 <b>Email:</b> ${email}
📋 <b>Тема:</b> ${topic || 'Не указана'}

💬 <b>Сообщение:</b>
${message}
  `;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Failed to send message to Telegram.' });
    }

    res.status(200).json({ success: true, message: 'Feedback sent successfully.' });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.get('/', (req, res) => {
  res.send('NEUROXISE Feedback Bot Proxy is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
