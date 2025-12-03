import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Send as SendIcon, SmartToy, Person } from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'سلام! من دستیار هوشمند شما هستم. چطور می‌تونم کمکتون کنم؟',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    'وضعیت کلی ناوگان چطور است؟',
    'کدام کامیون بیشترین خرابی را داشته؟',
    'میانگین مصرف سوخت چقدر است؟',
    'چند سرویس سررسید گذشته داریم؟',
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: 'این یک پاسخ نمونه است. برای اتصال به GPT-4، باید API key را در backend تنظیم کنید.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          چت‌بات هوشمند
        </Typography>
        <Typography variant="body2" color="text.secondary">
          پرسش و پاسخ درباره ناوگان با هوش مصنوعی GPT-4
        </Typography>
      </Box>

      <Card sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
        {/* Quick Questions */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            سوالات پیشنهادی:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickQuestions.map((q, index) => (
              <Chip
                key={index}
                label={q}
                onClick={() => handleQuickQuestion(q)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  maxWidth: '70%',
                  flexDirection: message.isBot ? 'row' : 'row-reverse',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.isBot ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  {message.isBot ? <SmartToy fontSize="small" /> : <Person fontSize="small" />}
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: message.isBot ? 'white' : 'primary.main',
                    color: message.isBot ? 'text.primary' : 'white',
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      fontSize: '0.7rem',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 1.5 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="سوال خود را بپرسید..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
    </MainLayout>
  );
};

export default Chatbot;
