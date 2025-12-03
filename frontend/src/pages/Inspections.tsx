import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';

const Inspections: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          مدیریت بازدیدها
        </Typography>
        <Typography variant="body2" color="text.secondary">
          بازدیدهای دوره‌ای و چک‌لیست‌ها
        </Typography>
      </Box>
      <Card sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          صفحه بازدیدها - در حال توسعه
        </Typography>
      </Card>
    </MainLayout>
  );
};

export default Inspections;
