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
  })

  // STATE: Nhiều ảnh
  const [imageUrls, setImageUrls] = useState(['']) 

  const [hasVariations, setHasVariations] = useState(false)
  const [variationGroups, setVariationGroups] = useState([{ name: 'Màu sắc', valuesString: '' }])
  const [skus, setSkus] = useState([])

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
        setShop(res.data ? res.data : false)
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải thông tin...</div>

  if (!shop) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Chào mừng bạn đến với Kênh Người Bán</h2>
        <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>Bạn hiện chưa có cửa hàng nào. Vui lòng cung cấp một số thông tin cơ bản để đăng ký trở thành Người Bán và bắt đầu kinh doanh ngay hôm nay!</p>
        <button onClick={() => navigate('/seller/register')} style={{ padding: '12px 30px', background: '#0e2ece', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: '500' }}>Đăng ký ngay</button>
      </div>
    )
  }

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleGenerateSkus = () => {
    const parsedGroups = variationGroups
      .map(g => ({ name: g.name.trim(), values: g.valuesString.split(',').map(v => v.trim()).filter(v => v !== '') }))
      .filter(g => g.name !== '' && g.values.length > 0);

    if (parsedGroups.length === 0) {
      alert('Vui lòng nhập ít nhất 1 nhóm và 1 tùy chọn (Cắt nhau bằng dấu phẩy)!');
      return;
    }

    const getCombinations = (groupsArr, index = 0, current = {}) => {
      if (index === groupsArr.length) return [current];
      let combinations = [];
      const group = groupsArr[index];
      for (let val of group.values) {
        combinations = combinations.concat(getCombinations(groupsArr, index + 1, { ...current, [group.name]: val }));
      }
      return combinations;
    };

    const combos = getCombinations(parsedGroups);

    const newSkus = combos.map(combo => {
      const existing = skus.find(s => {
        if (!s.attributes) return false;
        return Object.keys(combo).every(k => combo[k] === s.attributes[k]);
      });
      return { id: existing?.id || null, attributes: combo, price: existing?.price || formData.base_price || '', stock: existing?.stock || 0 };
    });

    setSkus(newSkus);
  }

  const handleSkuChange = (index, field, value) => {
    const newSkus = [...skus]
    newSkus[index][field] = value
    setSkus(newSkus)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProductId(null)
    setFormData({ name: '', category_id: '', base_price: '', stock: '', description: '' })
    setImageUrls(['']) // Reset ảnh
    setHasVariations(false)
    setVariationGroups([{ name: 'Màu sắc', valuesString: '' }])
    setSkus([])
  }

  const openEditModal = (product) => {
    setEditingProductId(product.id)
    
    // Đổ danh sách URL ảnh ra
    if (product.product_images && product.product_images.length > 0) {
      const urls = product.product_images.map(img => img.image_url || img.image_path)
      setImageUrls(urls.length > 0 ? urls : [''])
    } else {
      setImageUrls([''])
    }

    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      base_price: product.base_price || '',
      stock: product.stock || '',
      description: product.description || '',
    })

    const getAttributes = (sku) => sku.attribute_values || sku.attributeValues || [];
    const hasRealSkus = product.skus && product.skus.length > 0 && getAttributes(product.skus[0]).length > 0;

    if (hasRealSkus) {
      setHasVariations(true)
      let extractedMap = {}
      
      const loadedSkus = product.skus.map((s) => {
        const attrs = {}
        const attrList = getAttributes(s);
        if (attrList.length > 0) {
          attrList.forEach(av => {
            attrs[av.attribute.name] = av.value
            if (!extractedMap[av.attribute.name]) extractedMap[av.attribute.name] = new Set()
            extractedMap[av.attribute.name].add(av.value)
          })
        }
        return { id: s.id, price: s.price || '', stock: s.stock || 0, attributes: attrs }
      })
      
      const loadedGroups = Object.keys(extractedMap).map(name => ({
        name: name, valuesString: Array.from(extractedMap[name]).join(', ')
      }))
      
      setVariationGroups(loadedGroups)
      setSkus(loadedSkus)
    } else {
      setHasVariations(false)
      setVariationGroups([{ name: 'Màu sắc', valuesString: '' }])
      setSkus([])
      setFormData((prev) => ({ ...prev, stock: product.skus?.[0]?.stock || product.stock || 0 }))
    }

    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (hasVariations && skus.length === 0) {
      alert("Bạn chưa tạo danh sách nhập giá! Vui lòng bấm nút '⚡ TẠO DANH SÁCH NHẬP GIÁ' trước khi Lưu.");
      setIsSubmitting(false);
      return;
    }

    // Gói mảng ảnh vào data gửi đi
    const dataToSend = { 
      ...formData, 
      skus: hasVariations ? skus : [],
      image_urls: imageUrls.filter(url => url.trim() !== '') 
    }

    try {
      if (editingProductId) {
        const res = await axiosClient.put(`/products/${editingProductId}`, dataToSend)
        alert(res.data.message || 'Cập nhật sản phẩm thành công!')
      } else {
        const res = await axiosClient.post('/products', dataToSend)
        alert(res.data.message || 'Thêm sản phẩm thành công!')
      }
      closeModal()
      fetchShop()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN sản phẩm "${formData.name}" không?`)) return
    setIsSubmitting(true)
    try {
      await axiosClient.delete(`/products/${editingProductId}`)
      alert('Xóa sản phẩm thành công!')
      closeModal()
      fetchShop()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.response?.data?.message || 'Không thể xóa sản phẩm'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="seller-layout">
      {/* SIDEBAR */}
      <div className="seller-sidebar">
        <h2>Kênh Người Bán</h2>
        <ul>
          <li className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Quản lý Sản phẩm</li>
          <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Quản lý Đơn hàng</li>
          <li className={activeTab === 'coupons' ? 'active' : ''} onClick={() => setActiveTab('coupons')}>Mã giảm giá</li>
        </ul>
      </div>

      <div className="seller-content">
        {activeTab === 'products' && (
          <>
            <div className="shop-header">
              <h2>{shop.name}</h2>
              <button className="add-product-btn" disabled={!shop.is_verified} onClick={() => { closeModal(); setIsModalOpen(true); }}>
                + Thêm sản phẩm
              </button>
            </div>

            <div className="product-grid">
              {shop.products?.map((product) => {
                let image = 'https://placehold.co/200x200?text=No+Image'
                const imageObj = product.product_images?.[0]
                if (imageObj) {
                  const imgUrl = imageObj.image_url || imageObj.image_path
                  if (imgUrl) image = imgUrl.startsWith('http') ? imgUrl : `http://localhost:8000/storage/${imgUrl}`
                }
                const price = product.skus?.[0]?.price ?? product.base_price ?? 0
                const stock = product.skus?.[0]?.stock ?? 0

                return (
                  <div key={product.id} className="product-card" onClick={() => openEditModal(product)} style={{ position: 'relative', cursor: 'pointer' }}>
                    <div onClick={(e) => { e.stopPropagation(); navigate(`/seller/products/${product.id}`) }} title="Xem dự báo AI" style={{ position: 'absolute', top: '10px', left: '10px', background: '#6366f1', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', zIndex: 2, boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)', border: '1.5px solid white' }}>
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

        {/* MODAL THÊM/SỬA SẢN PHẨM */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editingProductId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                {editingProductId && (
                  <button onClick={handleDeleteProduct} disabled={isSubmitting} style={{ background: 'none', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🗑️ Xóa
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="input-box">
                  <label>Tên sản phẩm *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="input-box">
                  <label>Danh mục *</label>
                  <select name="category_id" required value={formData.category_id} onChange={handleInputChange}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-box">
                  <label>Giá cơ bản (VNĐ) *</label>
                  <input type="number" name="base_price" required value={formData.base_price} onChange={handleInputChange} />
                </div>

                {/* KHU VỰC CẤU HÌNH PHÂN LOẠI EAV */}
                <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#4f46e5', fontSize: '15px', marginBottom: hasVariations ? '15px' : '0' }}>
                    <input type="checkbox" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                    Sản phẩm có nhiều phân loại (Màu sắc, Kích thước...)
                  </label>

                  {!hasVariations && (
                    <div className="input-box" style={{ marginTop: '15px' }}>
                      <label>Tồn kho *</label>
                      <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
                    </div>
                  )}

                  {hasVariations && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                          BƯỚC 1: ĐẶT TÊN NHÓM VÀ TÙY CHỌN
                        </label>
                        <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '15px', fontStyle: 'italic'}}>Gợi ý: Các tùy chọn viết cách nhau bằng dấu phẩy (,). Ví dụ: Đỏ, Đen, Trắng</p>
                        
                        {variationGroups.map((group, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input 
                              type="text" placeholder={`Tên nhóm (VD: Size)`} 
                              value={group.name} 
                              onChange={e => { const newG = [...variationGroups]; newG[i].name = e.target.value; setVariationGroups(newG); }}
                              style={{ width: '140px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            <input 
                              type="text" placeholder={`Tùy chọn (VD: S, M, L, XL)`} 
                              value={group.valuesString} 
                              onChange={e => { const newG = [...variationGroups]; newG[i].valuesString = e.target.value; setVariationGroups(newG); }}
                              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            {variationGroups.length > 1 && (
                              <button type="button" onClick={() => setVariationGroups(variationGroups.filter((_, idx) => idx !== i))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                            )}
                          </div>
                        ))}
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          {variationGroups.length < 2 && ( 
                            <button type="button" onClick={() => setVariationGroups([...variationGroups, {name:'', valuesString:''}])} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px dashed #4f46e5', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                              + Thêm nhóm 2
                            </button>
                          )}
                          <button type="button" onClick={handleGenerateSkus} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
                             TẠO DANH SÁCH NHẬP GIÁ
                          </button>
                        </div>
                      </div>

                      {skus.length > 0 && (
                        <div>
                          <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                            BƯỚC 2: NHẬP GIÁ & KHO CHO TỪNG PHÂN LOẠI
                          </label>
                          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                              <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Phân loại</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '140px' }}>Giá (VNĐ)</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '100px' }}>Kho</th>
                                </tr>
                              </thead>
                              <tbody>
                                {skus.map((sku, index) => (
                                  <tr key={index}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>
                                      {Object.values(sku.attributes).join(' - ')}
                                    </td>
                                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                      <input type="number" value={sku.price} onChange={e => handleSkuChange(index, 'price', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </td>
                                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                      <input type="number" value={sku.stock} onChange={e => handleSkuChange(index, 'stock', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="input-box">
                  <label>Mô tả</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', minHeight: '80px' }}></textarea>
                </div>
                
                {/* KHU VỰC THÊM NHIỀU ẢNH */}
                <div className="input-box">
                  <label>Link ảnh sản phẩm (Link đầu tiên sẽ làm ảnh bìa)</label>
                  {imageUrls.map((url, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder={`Link ảnh ${index + 1}`}
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...imageUrls];
                          newUrls[index] = e.target.value;
                          setImageUrls(newUrls);
                        }}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      {imageUrls.length > 1 && (
                        <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setImageUrls([...imageUrls, ''])} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', width: 'fit-content' }}>
                    + Thêm ảnh nữa
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                 <button type="button" onClick={closeModal} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', background: 'white', color: 'black', fontWeight: 'bold' }}>Hủy</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isSubmitting ? 'Đang xử lý...' : editingProductId ? 'Cập nhật ngay' : 'Đăng bán ngay'}
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