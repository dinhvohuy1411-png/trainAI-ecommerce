import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AiForecastWidget = ({ productId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        // Gọi API sang Laravel (Laravel sẽ tự gọi sang Python)
        const res = await axiosClient.get(`/seller/products/${productId}/forecast`);
        setData(res.data);
      } catch (error) {
        console.log("Sản phẩm chưa đủ dữ liệu để AI học");
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchForecast();
    }
  }, [productId]);

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>⏳ Đang tải mô hình AI dự báo...</div>;
  if (!data) return null; // Nếu lỗi hoặc chưa đủ 7 ngày data thì ẩn đi, không hiện gì cả

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
        🤖 AI Dự báo nhu cầu (7 ngày tới)
      </h3>
      
      {/* KHU VỰC CẢNH BÁO THÔNG MINH */}
      <div style={{ 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        background: data.is_stock_warning ? '#fff0f0' : '#f0fdf4',
        border: `1px solid ${data.is_stock_warning ? '#fecaca' : '#bbf7d0'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span><strong>Tồn kho hiện tại:</strong> {data.current_stock} chiếc</span>
          <span><strong>AI dự báo bán được:</strong> {data.total_predicted_7_days} chiếc</span>
        </div>
        
        {data.is_stock_warning ? (
          <p style={{ color: '#dc2626', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
            ⚠️ CẢNH BÁO: Kho của bạn sẽ hết hàng trước 7 ngày. Vui lòng nhập thêm hàng!
          </p>
        ) : (
          <p style={{ color: '#166534', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
            ✅ An toàn: Lượng hàng trong kho đủ đáp ứng nhu cầu dự kiến.
          </p>
        )}
      </div>

      {/* BIỂU ĐỒ TRỰC QUAN */}
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.forecast_details}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="predicted_quantity" 
              stroke="#ee4d2d" 
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Dự báo bán ra" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AiForecastWidget;