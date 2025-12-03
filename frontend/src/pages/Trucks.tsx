import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { truckService } from '../services/truckService';
import { TruckStatus } from '../types';
import MainLayout from '../components/layout/MainLayout';

const Trucks: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trucks', page, rowsPerPage],
    queryFn: () =>
      truckService.getAll({
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const getStatusColor = (status: TruckStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case TruckStatus.ACTIVE:
        return 'success';
      case TruckStatus.UNDER_SERVICE:
        return 'warning';
      case TruckStatus.BROKEN_DOWN:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TruckStatus): string => {
    const labels: Record<TruckStatus, string> = {
      [TruckStatus.ACTIVE]: 'فعال',
      [TruckStatus.UNDER_SERVICE]: 'در سرویس',
      [TruckStatus.BROKEN_DOWN]: 'خراب',
      [TruckStatus.INACTIVE]: 'غیرفعال',
    };
    return labels[status];
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            مدیریت کامیون‌ها
          </Typography>
          <Typography variant="body2" color="text.secondary">
            لیست تمام کامیون‌های ناوگان
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          افزودن کامیون جدید
        </Button>
      </Box>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            خطا در بارگذاری اطلاعات. لطفاً دوباره تلاش کنید.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>شماره پلاک</TableCell>
                    <TableCell>مدل</TableCell>
                    <TableCell>سال ساخت</TableCell>
                    <TableCell>کیلومتر فعلی</TableCell>
                    <TableCell>نوع سوخت</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.data.map((truck) => (
                    <TableRow key={truck.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {truck.plateNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{truck.model}</TableCell>
                      <TableCell>{truck.year}</TableCell>
                      <TableCell>
                        {truck.currentKilometer.toLocaleString('fa-IR')} کیلومتر
                      </TableCell>
                      <TableCell>{truck.fuelType}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(truck.status)}
                          color={getStatusColor(truck.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="info">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data?.pagination.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="تعداد در صفحه:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} از ${count !== -1 ? count : `بیشتر از ${to}`}`
              }
            />
          </>
        )}
      </Card>
    </MainLayout>
  );
};

export default Trucks;
