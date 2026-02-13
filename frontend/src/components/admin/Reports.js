import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { FiCalendar, FiTrendingUp, FiDollarSign } from 'react-icons/fi';

const Reports = () => {
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDailyReport = useCallback(async () => {
    try {
      const response = await api.get(`/api/reports/daily?date=${selectedDate}`);
      setDailyReport(response.data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
    }
  }, [selectedDate]);

  const fetchMonthlyReport = useCallback(async () => {
    try {
      const response = await api.get(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      setMonthlyReport(response.data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDailyReport();
  }, [fetchDailyReport]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

  const fetchTopSelling = useCallback(async () => {
    try {
      const response = await api.get('/api/reports/top-selling?limit=10');
      setTopSelling(response.data);
    } catch (error) {
      console.error('Error fetching top selling:', error);
    }
  }, []);

  useEffect(() => {
    fetchTopSelling();
  }, [fetchTopSelling]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Reports & Analytics</h2>

      {/* Daily Report */}
      <div className="bg-black/30 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <FiCalendar /> Daily Sales Report
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchDailyReport();
              }}
              className="bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <button
              onClick={fetchDailyReport}
              className="bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition"
            >
              Refresh
            </button>
          </div>
        </div>
        {dailyReport ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-restaurant-gold">
                ${dailyReport.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-white">{dailyReport.totalOrders}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Average Order Value</p>
              <p className="text-3xl font-bold text-white">
                ${dailyReport.totalOrders > 0 ? (dailyReport.totalRevenue / dailyReport.totalOrders).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No data available</div>
        )}
      </div>

      {/* Monthly Report */}
      <div className="bg-black/30 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <FiTrendingUp /> Monthly Revenue
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value));
                fetchMonthlyReport();
              }}
              className="bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                fetchMonthlyReport();
              }}
              className="bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        {monthlyReport ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-restaurant-gold">
                  ${monthlyReport.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{monthlyReport.totalOrders}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No data available</div>
        )}
      </div>

      {/* Top Selling Dishes */}
      <div className="bg-black/30 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FiDollarSign /> Top Selling Dishes
        </h3>
        {topSelling.length > 0 ? (
          <div className="space-y-2">
            {topSelling.map((item, index) => (
              <div
                key={index}
                className="bg-black/30 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-restaurant-gold/20 flex items-center justify-center font-bold text-restaurant-gold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} sold • ${item.revenue.toFixed(2)} revenue
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No data available</div>
        )}
      </div>
    </div>
  );
};

export default Reports;
