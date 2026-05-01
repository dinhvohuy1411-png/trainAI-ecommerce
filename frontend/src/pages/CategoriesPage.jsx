import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Thêm import này để không bị lỗi Link
import axiosClient from '../api/axiosClient';
import statisticsApi from '../api/statisticsApi';
import './CategoriesPage.css';
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_id: '',
    image: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const res = await statisticsApi.getAdminDashboard();
      setStatistics(res.data);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleReportClick = () => {
    if (!showReport) {
      fetchStatistics();
    }
    setShowReport(!showReport);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: form.name,
        slug: form.slug || null,
        image: form.image || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      };

      if (editingId) {
        await axiosClient.put(`/categories/${editingId}`, data);
        setEditingId(null);
      } else {
        await axiosClient.post('/categories', data);
      }

      setForm({ name: '', slug: '', parent_id: '', image: '' });
      fetchCategories();
      alert('Thao tác thành công!');
    } catch (error) {
      console.error(error.response?.data || error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      parent_id: cat.parent_id || '',
      image: cat.image || '',
    });
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    await axiosClient.delete(`/categories/${id}`);
    fetchCategories();
  };

  return (
    <div>
      {/* ===== MAIN CONTENT ===== */}
      <div>
        <h2 className="title" style={{ marginTop: 0, marginBottom: '20px', fontSize: '22px', color: '#1e293b' }}>Quản lý Category</h2>

        {/* ===== BÁO CÁO THỐNG KÊ ===== */}
        {showReport && (
          <div style={{ background: '#f9fafb', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📊 Báo Cáo Thống Kê Sàn</h3>
            {loadingStats ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu...</p>
            ) : statistics ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', ...statCardStyle }}>
                    <p style={statLabelStyle}>👑 SELLER NHIỀU ĐƠN NHẤT</p>
                    {statistics.top_seller ? (
                      <>
                        <h2 style={{ fontSize: '20px', margin: '5px 0' }}>{statistics.top_seller.name}</h2>
                        <h3 style={{ color: '#ffd700', fontSize: '28px' }}>{statistics.top_seller.total_orders} đơn</h3>
                      </>
                    ) : <p>N/A</p>}
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', ...statCardStyle }}>
                    <p style={statLabelStyle}>🔥 SẢN PHẨM BÁN CHẠY</p>
                    {statistics.best_sellers?.[0] ? (
                      <>
                        <h2 style={{ fontSize: '18px', margin: '5px 0' }}>{statistics.best_sellers[0].name}</h2>
                        <h3 style={{ fontSize: '28px' }}>{statistics.best_sellers[0].total_sold} cái</h3>
                      </>
                    ) : <p>N/A</p>}
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', ...statCardStyle }}>
                    <p style={statLabelStyle}>💰 TỔNG DOANH THU</p>
                    <h2 style={{ fontSize: '22px' }}>{(statistics.total_revenue || 0).toLocaleString()} VNĐ</h2>
                    <p>{statistics.total_orders || 0} đơn hàng</p>
                  </div>
                </div>

                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Sàn', DoanhThu: (statistics.total_revenue || 0) / 1000000, DonHang: statistics.total_orders || 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="DoanhThu" name="Doanh thu (Triệu)" fill="#059669" />
                      <Bar dataKey="DonHang" name="Số đơn hàng" fill="#0891b2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : <p>Không có dữ liệu</p>}
          </div>
        )}

        {/* ===== FORM THÊM / SỬA ===== */}
        <div className="form" style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="name" placeholder="Tên Category" value={form.name} onChange={handleChange} style={inputStyle} />
          <input name="slug" placeholder="Slug (Đường dẫn)" value={form.slug} onChange={handleChange} style={inputStyle} />
          <input name="parent_id" placeholder="Parent ID" value={form.parent_id} onChange={handleChange} style={inputStyle} />
          <input name="image" placeholder="Link ảnh URL" value={form.image} onChange={handleChange} style={inputStyle} />
          <button onClick={handleSubmit} className="submit-btn" style={{ gridColumn: 'span 2', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {editingId ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}
          </button>
        </div>

        {/* ===== BẢNG DANH SÁCH ===== */}
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Tên</th>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Parent</th>
                <th style={thStyle}>Ảnh</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{cat.id}</td>
                  <td style={tdStyle}><strong>{cat.name}</strong></td>
                  <td style={tdStyle}>{cat.slug}</td>
                  <td style={tdStyle}>{cat.parent_id || '-'}</td>
                  <td style={tdStyle}>
                    {cat.image && <img src={cat.image} width="40" height="40" style={{ borderRadius: '4px' }} alt="" />}
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleEdit(cat)} style={{ marginRight: '10px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDelete(cat.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Styles hỗ trợ
const sidebarLinkStyle = {
  display: 'block',
  padding: '12px 15px',
  background: '#3b82f6',
  color: 'white',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  textAlign: 'center',
};

const statCardStyle = {
  padding: '20px',
  borderRadius: '12px',
  textAlign: 'center',
  color: 'white',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

const statLabelStyle = {
  margin: '0 0 10px 0',
  fontSize: '12px',
  fontWeight: 'bold',
  opacity: 0.9,
};

const inputStyle = { padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' };
const thStyle = { padding: '12px', borderBottom: '2px solid #e5e7eb' };
const tdStyle = { padding: '12px' };