import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../../store/hooks';

const TopSellingChart = ({ data }) => {
  const { isDarkMode } = useAppSelector((state) => state.theme);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Selling Products</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }}
            stroke={isDarkMode ? '#475569' : '#94A3B8'}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={130}
            tick={{ fontSize: 10, fill: isDarkMode ? '#F8FAFC' : '#1E293B', fontWeight: 700 }}
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
          <Bar dataKey="sales" fill="#2563EB" radius={[0, 8, 8, 0]} name="Sales (₹)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopSellingChart;
