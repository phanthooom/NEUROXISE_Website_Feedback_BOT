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
  const { formType, email, name, topic, message } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram credentials missing in .env");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  let text = '';
  
  if (formType === 'waitlist') {
    text = `🔥 <b>Новая запись в лист ожидания!</b>\n\n📧 <b>Email:</b> ${email}`;
  } else if (formType === 'newsletter') {
    text = `📰 <b>Новая подписка на блог!</b>\n\n📧 <b>Email:</b> ${email}`;
  } else {
    // Default to main contact form
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required for contact form.' });
    }
    text = `
📩 <b>Новая заявка с сайта NEUROXISE</b>

👤 <b>Имя:</b> ${name}
📧 <b>Email:</b> ${email}
📋 <b>Тема:</b> ${topic || 'Не указана'}

💬 <b>Сообщение:</b>
${message}
    `;
  }

  try {
    const chatIds = TELEGRAM_CHAT_ID.split(',').map(id => id.trim());
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const sendPromises = chatIds.map(chatId => 
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      }).then(res => res.json())
    );

    const results = await Promise.all(sendPromises);
    
    const hasError = results.some(data => !data.ok);
    if (hasError) {
      console.error('Telegram API error for one or more IDs:', results);
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
