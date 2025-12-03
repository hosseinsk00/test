import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalShipping,
  Person,
  Build,
  Settings,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import MainLayout from '../components/layout/MainLayout';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactElement;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}) => {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 2,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.14)',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
        </Box>
        <Box sx={{ textAlign: 'left', mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {trend.isPositive ? (
                <TrendingUp fontSize="small" color="success" />
              ) : (
                <TrendingDown fontSize="small" color="error" />
              )}
              <Typography
                variant="caption"
                color={trend.isPositive ? 'success.main' : 'error.main'}
              >
                {trend.value}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => dashboardService.getOverview(),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error">
          خطا در بارگذاری اطلاعات داشبورد. لطفاً دوباره تلاش کنید.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          داشبورد
        </Typography>
        <Typography variant="body2" color="text.secondary">
          نمای کلی سیستم مدیریت ناوگان
        </Typography>
      </Box>

      {/* Fleet Stats */}
      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
        وضعیت ناوگان
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="کل کامیون‌ها"
            value={stats?.fleet.total || 0}
            subtitle={`${stats?.fleet.operationalRate || 0}% عملیاتی`}
            icon={<LocalShipping />}
            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="کامیون‌های فعال"
            value={stats?.fleet.active || 0}
            subtitle={`از ${stats?.fleet.total || 0} کامیون`}
            icon={<CheckCircle />}
            color="linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="در تعمیرگاه"
            value={stats?.fleet.underService || 0}
            icon={<Settings />}
            color="linear-gradient(135deg, #f39c12 0%, #e67e22 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="خراب شده"
            value={stats?.fleet.brokenDown || 0}
            icon={<ErrorIcon />}
            color="linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
          />
        </Grid>
      </Grid>

      {/* Drivers Stats */}
      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
        رانندگان
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="کل رانندگان"
            value={stats?.drivers.total || 0}
            icon={<Person />}
            color="linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="رانندگان فعال"
            value={stats?.drivers.active || 0}
            subtitle={`${stats?.drivers.assignmentRate || 0}% اختصاص یافته`}
            icon={<Person />}
            color="linear-gradient(135deg, #1abc9c 0%, #16a085 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="اختصاص یافته"
            value={stats?.drivers.assigned || 0}
            icon={<Person />}
            color="linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="بدون اختصاص"
            value={stats?.drivers.unassigned || 0}
            icon={<Person />}
            color="linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)"
          />
        </Grid>
      </Grid>

      {/* Operations Stats */}
      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
        عملیات
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                خرابی‌ها
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats?.breakdowns.total || 0}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">
                  فعال: {stats?.breakdowns.active || 0}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  بحرانی: {stats?.breakdowns.critical || 0}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  رفع شده: {stats?.breakdowns.fixed || 0} ({stats?.breakdowns.fixRate || 0}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                سرویس‌ها
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats?.services.total || 0}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">
                  زمان‌بندی شده: {stats?.services.scheduled || 0}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  تکمیل شده: {stats?.services.completed || 0}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                  سررسید گذشته: {stats?.services.overdue || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                بازدیدها
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats?.inspections.total || 0}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'success.main' }}>
                  قبول: {stats?.inspections.passed || 0} ({stats?.inspections.passRate || 0}%)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                  رد: {stats?.inspections.failed || 0}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  میانگین نمره: {stats?.inspections.averageScore || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fuel Stats */}
      <Typography variant="h6" fontWeight="600" sx={{ mt: 4, mb: 2 }}>
        مصرف سوخت
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                کل مصرف
              </Typography>
              <Typography variant="h6">
                {stats?.fuel.totalConsumption.toFixed(0) || 0} لیتر
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                مسافت طی شده
              </Typography>
              <Typography variant="h6">
                {stats?.fuel.totalDistance.toFixed(0) || 0} کیلومتر
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                میانگین مصرف
              </Typography>
              <Typography variant="h6">
                {stats?.fuel.averageConsumptionPerKm || 0} لیتر/کیلومتر
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                هزینه کل
              </Typography>
              <Typography variant="h6">
                {stats?.fuel.totalCost.toLocaleString('fa-IR') || 0} تومان
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default Dashboard;
