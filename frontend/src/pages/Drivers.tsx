import React from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';

const Drivers: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            مدیریت رانندگان
          </Typography>
          <Typography variant="body2" color="text.secondary">
            لیست تمام رانندگان ناوگان
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          افزودن راننده جدید
        </Button>
      </Box>

      <Card sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          صفحه رانندگان - در حال توسعه
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          این صفحه به زودی آماده می‌شود
        </Typography>
      </Card>
    </MainLayout>
  );
};

export default Drivers;
