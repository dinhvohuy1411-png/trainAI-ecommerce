import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import statisticsApi from "../api/statisticsApi";
import "./CategoriesPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent_id: "",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axiosClient.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const res = await statisticsApi.getAdminDashboard();
      setStatistics(res.data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải dữ liệu thống kê");
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

  const fetchCategories = async () => {
    const res = await axiosClient.get("/categories");
    setCategories(res.data);
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
        await axiosClient.post("/categories", data);
      }

      setForm({ name: "", slug: "", parent_id: "", image: "" });
      fetchCategories();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      parent_id: cat.parent_id || "",
      image: cat.image || "",
    });
    setEditingId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    await axiosClient.delete(`/categories/${id}`);
    fetchCategories();
  };

  return (
   <div className="page">
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f8fc' }}>
    
    {/* ===== SIDEBAR MENU (TRÁI) ===== */}
    <div style={{ 
      width: '250px', 
      background: '#1e293b', 
      color: 'white', 
      padding: '20px',
      height: '100vh',              // ✅ FIX CHÍNH
      position: 'sticky',           // ✅ đứng yên khi scroll nhẹ
      top: 0
    }}>
      <h2 style={{ color: 'white', marginBottom: '30px', fontSize: '22px' }}>
        🏢 Admin Panel
      </h2>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <Link 
            to="/admin/shops" 
            style={{ 
              display: 'block',
              padding: '12px 15px', 
              background: '#3b82f6', 
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'center',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
                🏪 Duyệt Gian Hàng
              </Link>
            </li>
            <li>
              <button 
                onClick={handleReportClick}
                style={{ 
                  width: '100%',
                  padding: '12px 15px', 
                  background: showReport ? '#10b981' : '#6b7280', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = showReport ? '#059669' : '#4b5563'}
                onMouseLeave={(e) => e.target.style.background = showReport ? '#10b981' : '#6b7280'}
              >
                📊 {showReport ? 'Ẩn Báo Cáo' : 'Xem Báo Cáo'}
              </button>
            </li>
          </ul>
        </div>

        {/* ===== MAIN CONTENT (PHẢI) ===== */}
        <div style={{ flex: 1, padding: '40px' }}>
          <h2 className="title" style={{ marginTop: 0, marginBottom: '20px' }}>Quản lý Category</h2>

        {/* ===== BÁNG CÁO ===== */}
        {showReport && (
          <div style={{ background: '#f9fafb', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📊 Báo Cáo Thống Kê Sàn</h3>
            
            {loadingStats ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu...</p>
            ) : statistics ? (
              <div>
                {/* Dữ liệu chữ số */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                    <p style={{ color: '#6b7280', margin: '0 0 10px 0', fontSize: '14px' }}>Tổng Doanh Thu</p>
                    <h2 style={{ margin: 0, color: '#059669', fontSize: '28px' }}>
                      {(statistics.total_revenue || 0).toLocaleString()} VNĐ
                    </h2>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                    <p style={{ color: '#6b7280', margin: '0 0 10px 0', fontSize: '14px' }}>Tổng Số Đơn Hàng</p>
                    <h2 style={{ margin: 0, color: '#0891b2', fontSize: '28px' }}>
                      {statistics.total_orders || 0} đơn
                    </h2>
                  </div>
                </div>

                {/* Biểu đồ cột */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ marginTop: 0, color: '#1f2937' }}>Biểu Đồ Thống Kê</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      {
                        name: 'Thống Kê',
                        'Doanh thu (Triệu)': Math.round((statistics.total_revenue || 0) / 1000000),
                        'Số đơn hàng': statistics.total_orders || 0,
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="Doanh thu (Triệu)" fill="#059669" />
                      <Bar dataKey="Số đơn hàng" fill="#0891b2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sản phẩm bán chạy */}
                {statistics.best_sellers && statistics.best_sellers.length > 0 && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px' }}>
                    <h4 style={{ marginTop: 0, color: '#1f2937' }}>🔥 Sản Phẩm Bán Chạy</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Số Lượng Bán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.best_sellers.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '10px' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                              {item.total_sold} cái
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#ef4444' }}>Không thể tải dữ liệu thống kê</p>
            )}
          </div>
        )}

        <div className="form">
          <input
            name="name"
            placeholder="Tên"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={handleChange}
          />
          <input
            name="parent_id"
            placeholder="Parent ID"
            value={form.parent_id}
            onChange={handleChange}
          />
          <input
            name="image"
            placeholder="Image URL"
            value={form.image}
            onChange={handleChange}
          />

          <button onClick={handleSubmit} className="submit-btn">
            {editingId ? "Cập nhật" : "Thêm"}
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Image</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.parent_id || "-"}</td>
                  <td>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        width="40"
                        height="40"
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="btn-edit"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="btn-delete"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
              Không có dữ liệu
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
