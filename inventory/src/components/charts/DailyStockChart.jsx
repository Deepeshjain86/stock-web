import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../../store/hooks';

const DailyStockChart = ({ data }) => {
  const { isDarkMode } = useAppSelector((state) => state.theme);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Daily Sales & Orders</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }}
            stroke={isDarkMode ? '#475569' : '#94A3B8'}
          />
          <YAxis
            tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }}
            stroke={isDarkMode ? '#475569' : '#94A3B8'}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              borderRadius: '0.5rem',
              fontSize: '11px',
              fontWeight: '600'
            }}
          />
          <Legend wrapperStyle={{ color: isDarkMode ? '#CBD5E1' : '#334155' }} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Sales (₹)"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyStockChart;
