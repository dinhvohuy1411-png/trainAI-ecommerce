import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import productApi from '../api/productApi'
import './ShopPage.css'
import SellerCouponManagementPage from './SellerCouponManagementPage'
import SellerOrderManagementPage from './SellerOrderManagementPage'

export default function ShopPage() {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingProductId, setEditingProductId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    base_price: '',
    stock: '',
    description: '',
    image_url: '',
  })

  const [hasVariations, setHasVariations] = useState(false)
  const [skus, setSkus] = useState([{ sku_code: '', price: '', stock: '' }])

  const fetchShop = async () => {
    try {
      const res = await productApi.getCate()
      setShop(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const res = await axiosClient.get('/my-shop')

        if (res.data) {
          setShop(res.data)
        } else {
          setShop(false)
        }
      } catch (error) {
        setShop(false)
      } finally {
        setLoading(false)
      }
    }
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/categories')
        setCategories(res.data || [])
      } catch (err) {
        console.error('Lỗi tải danh mục:', err)
      }
    }
    checkShopStatus()
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        Đang tải thông tin...
      </div>
    )
  }

  if (!shop) {
    return (
      <div
        style={{
          maxWidth: '600px',
          margin: '50px auto',
          textAlign: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>
          Chào mừng bạn đến với Kênh Người Bán
        </h2>
        <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
          Bạn hiện chưa có cửa hàng nào. Vui lòng cung cấp một số thông tin cơ
          bản để đăng ký trở thành Người Bán và bắt đầu kinh doanh ngay hôm nay!
        </p>
        <button
          onClick={() => navigate('/seller/register')}
          style={{
            padding: '12px 30px',
            background: '#0e2ece',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Đăng ký ngay
        </button>
      </div>
    )
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSkuChange = (index, field, value) => {
    const newSkus = [...skus]
    newSkus[index][field] = value
    setSkus(newSkus)
  }

  const addSkuRow = () =>
    setSkus([...skus, { sku_code: '', price: formData.base_price, stock: 0 }])

  const removeSkuRow = (index) => setSkus(skus.filter((_, i) => i !== index))

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProductId(null)
    setFormData({
      name: '',
      category_id: '',
      base_price: '',
      stock: '',
      description: '',
      image_url: '',
    })
    setHasVariations(false)
    setSkus([{ sku_code: '', price: '', stock: '' }])
  }

  const openEditModal = (product) => {
    setEditingProductId(product.id)

    let imageUrl = ''
    if (product.product_images && product.product_images.length > 0) {
      imageUrl =
        product.product_images[0].image_url ||
        product.product_images[0].image_path ||
        ''
    }

    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      base_price: product.base_price || '',
      stock: product.stock || '',
      description: product.description || '',
      image_url: imageUrl,
    })

    const hasRealSkus =
      product.skus &&
      product.skus.length > 0 &&
      product.skus[0].sku !== 'Mặc định' &&
      !product.skus[0].sku.startsWith('SKU-')

    if (hasRealSkus) {
      setHasVariations(true)
      const loadedSkus = product.skus.map((s) => ({
        id: s.id,
        sku_code: s.sku || '',
        price: s.price || '',
        stock: s.stock || 0,
      }))
      setSkus(loadedSkus)
    } else {
      setHasVariations(false)
      setSkus([{ sku_code: '', price: '', stock: '' }])
      setFormData((prev) => ({
        ...prev,
        stock: product.skus?.[0]?.stock || product.stock || 0,
      }))
    }

    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const dataToSend = {
      ...formData,
      skus: hasVariations ? skus : [],
    }

    try {
      if (editingProductId) {
        const res = await axiosClient.put(
          `/products/${editingProductId}`,
          dataToSend
        )
        alert(res.data.message || 'Cập nhật sản phẩm thành công!')
      } else {
        const res = await axiosClient.post('/products', dataToSend)
        alert(res.data.message || 'Thêm sản phẩm thành công!')
      }

      closeModal()
      fetchShop()
    } catch (err) {
      alert(
        'Lỗi: ' +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            'Có lỗi xảy ra')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA VĨNH VIỄN sản phẩm "${formData.name}" không?`
      )
    )
      return

    setIsSubmitting(true)
    try {
      await axiosClient.delete(`/products/${editingProductId}`)
      alert('Xóa sản phẩm thành công!')
      closeModal()
      fetchShop()
    } catch (err) {
      alert(
        'Lỗi: ' +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            'Không thể xóa sản phẩm')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="seller-layout">
      {/* SIDEBAR - Giữ nguyên */}
      <div className="seller-sidebar">
        <h2>Kênh Người Bán</h2>
        <ul>
          <li
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Quản lý Sản phẩm
          </li>
          <li
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Quản lý Đơn hàng
          </li>
          <li
            className={activeTab === 'coupons' ? 'active' : ''}
            onClick={() => setActiveTab('coupons')}
          >
            Mã giảm giá
          </li>
        </ul>
      </div>

      <div className="seller-content">
        {activeTab === 'products' && (
          <>
            <div className="shop-header">
              <h2>{shop.name}</h2>
              <button
                className="add-product-btn"
                disabled={!shop.is_verified}
                onClick={() => {
                  closeModal()
                  setIsModalOpen(true)
                }}
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div className="product-grid">
              {shop.products?.map((product) => {
                let image = 'https://placehold.co/200x200?text=No+Image'
                const imageObj = product.product_images?.[0]
                if (imageObj) {
                  const imgUrl = imageObj.image_url || imageObj.image_path
                  if (imgUrl)
                    image = imgUrl.startsWith('http')
                      ? imgUrl
                      : `http://localhost:8000/storage/${imgUrl}`
                }
                const price =
                  product.skus?.[0]?.price ?? product.base_price ?? 0
                const stock = product.skus?.[0]?.stock ?? 0

                return (
                  /* CARD TỔNG: Click vào đây vẫn chạy openEditModal (đúng ý bạn bạn) */
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => openEditModal(product)}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    {/* NÚT AI CỦA BẠN: Nằm đè lên góc, không làm hỏng layout cũ */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation() // Ngăn không cho mở Modal Sửa
                        navigate(`/seller/products/${product.id}`)
                      }}
                      title="Xem dự báo AI"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: '#6366f1',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        zIndex: 2,
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
                        border: '1.5px solid white',
                      }}
                    >
                      📈 AI Forecast
                    </div>

                    <img src={image} alt={product.name} />
                    <h4>{product.name}</h4>
                    <p className="price">{price.toLocaleString()} VNĐ</p>
                    <p className="stock">Tồn kho: {stock}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
        {activeTab === 'orders' && <SellerOrderManagementPage />}
        {activeTab === 'coupons' && <SellerCouponManagementPage />}

        {/* MODAL CỦA BẠN BẠN - Giữ nguyên không sửa style cũ */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '600px',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ margin: 0 }}>
                  {editingProductId
                    ? 'Chỉnh sửa sản phẩm'
                    : 'Thêm sản phẩm mới'}
                </h2>
                {editingProductId && (
                  <button
                    onClick={handleDeleteProduct}
                    disabled={isSubmitting}
                    style={{
                      background: 'none',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                }}
              >
                <div className="input-box">
                  <label>Tên sản phẩm *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-box">
                  <label>Danh mục *</label>
                  <select
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-box">
                  <label>Giá cơ bản (VNĐ) *</label>
                  <input
                    type="number"
                    name="base_price"
                    required
                    value={formData.base_price}
                    onChange={handleInputChange}
                  />
                </div>

                <div
                  style={{
                    background: '#f9fafb',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: '#4f46e5',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => setHasVariations(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Sản phẩm có nhiều phân loại
                  </label>
                  {!hasVariations && (
                    <div className="input-box" style={{ marginTop: '10px' }}>
                      <label>Tồn kho *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                  {hasVariations && (
                    <div style={{ marginTop: '12px' }}>
                      {skus.map((sku, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Tên (VD: Đen)"
                            value={sku.sku_code}
                            onChange={(e) =>
                              handleSkuChange(index, 'sku_code', e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Giá"
                            value={sku.price}
                            onChange={(e) =>
                              handleSkuChange(index, 'price', e.target.value)
                            }
                            style={{
                              width: '90px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Kho"
                            value={sku.stock}
                            onChange={(e) =>
                              handleSkuChange(index, 'stock', e.target.value)
                            }
                            style={{
                              width: '70px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                            }}
                          />
                          {skus.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSkuRow(index)}
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '0 10px',
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSkuRow}
                        style={{
                          marginTop: '5px',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        + Thêm dòng
                      </button>
                    </div>
                  )}
                </div>

                <div className="input-box">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      minHeight: '80px',
                    }}
                  ></textarea>
                </div>
                <div className="input-box">
                  <label>Link ảnh (URL)</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                </div>

                <div
                  style={{ display: 'flex', gap: '12px', marginTop: '10px' }}
                >
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#6366f1',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmitting
                      ? 'Đang xử lý...'
                      : editingProductId
                        ? 'Cập nhật ngay'
                        : 'Đăng bán ngay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
