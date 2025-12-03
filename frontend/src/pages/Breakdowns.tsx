import React from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';

const Breakdowns: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            مدیریت خرابی‌ها
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ثبت و پیگیری خرابی‌های کامیون‌ها
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" color="error">
          ثبت خرابی جدید
        </Button>
      </Box>

      <Card sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          صفحه خرابی‌ها - در حال توسعه
        </Typography>
      </Card>
    </MainLayout>
  );
};

export default Breakdowns;
