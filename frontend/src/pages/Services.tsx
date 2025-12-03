import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';

const Services: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          مدیریت سرویس‌ها
        </Typography>
        <Typography variant="body2" color="text.secondary">
          سرویس‌های دوره‌ای و نگهداری کامیون‌ها
        </Typography>
      </Box>
      <Card sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          صفحه سرویس‌ها - در حال توسعه
        </Typography>
      </Card>
    </MainLayout>
  );
};

export default Services;
