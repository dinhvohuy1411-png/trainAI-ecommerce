import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import Review from './Review'
import orderApi from '../api/orderApi'
import cartApi from '../api/cartApi'
import './ProductDetailPage.css'

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [orderId, setOrderId] = useState(null)
  const [product, setProduct] = useState(null)
  const [mainImage, setMainImage] = useState('')
  
  const [availableAttributes, setAvailableAttributes] = useState({}) 
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedSku, setSelectedSku] = useState(null)

  useEffect(() => {
    fetchOrderId()
    fetchProduct()
  }, [id])

  const fetchOrderId = async () => {
    try {
      const res = await orderApi.getMyOrders()
      const orders = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : []
      for (const order of orders) {
        const hasProduct = order.items?.some((item) => String(item.sku?.product?.id) === String(id))
        if (hasProduct) {
          setOrderId(order.id)
          return
        }
      }
      setOrderId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchProduct = async () => {
    try {
      const res = await axiosClient.get(`/products/${id}`)
      const data = res.data
      setProduct(data)

      const thumbnail = data.product_images?.find((img) => img.is_thumbnail == 1) || data.product_images?.[0]
      let imgUrl = 'https://placehold.co/400x400?text=No+Image'
      if (thumbnail) {
        const rawUrl = thumbnail.image_url || thumbnail.image_path
        if (rawUrl) imgUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8000/storage/${rawUrl}`
      }
      setMainImage(imgUrl)

      let attrMap = {}
      if (data.skus && data.skus.length > 0) {
        data.skus.forEach(sku => {
          if (sku.attribute_values && sku.attribute_values.length > 0) {
            sku.attribute_values.forEach(av => {
              const attrName = av.attribute.name;
              const attrVal = av.value;
              if (!attrMap[attrName]) attrMap[attrName] = [];
              if (!attrMap[attrName].includes(attrVal)) {
                attrMap[attrName].push(attrVal);
              }
            });
          }
        });
      }
      setAvailableAttributes(attrMap)

    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectAttribute = (attrName, attrValue) => {
    const newSelected = { ...selectedAttributes, [attrName]: attrValue }
    setSelectedAttributes(newSelected)

    const requiredAttrCount = Object.keys(availableAttributes).length;
    if (Object.keys(newSelected).length === requiredAttrCount) {
      const matchingSku = product.skus.find(sku => {
        if (!sku.attribute_values) return false;
        const skuAttrMap = {};
        sku.attribute_values.forEach(av => {
            skuAttrMap[av.attribute.name] = av.value;
        });
        return Object.keys(newSelected).every(key => newSelected[key] === skuAttrMap[key]);
      });

      setSelectedSku(matchingSku || null);
    } else {
      setSelectedSku(null); 
    }
  }

  if (!product) return <p style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu...</p>

  let displayPrice = ''
  let displayStock = 0

  if (selectedSku) {
    displayPrice = `${Number(selectedSku.price).toLocaleString()} VNĐ`
    displayStock = selectedSku.stock
  } else {
    if (product.skus && product.skus.length > 0) {
      const prices = product.skus.map((s) => Number(s.price))
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      displayPrice = minPrice !== maxPrice ? `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} VNĐ` : `${minPrice.toLocaleString()} VNĐ`
      displayStock = product.skus.reduce((sum, sku) => sum + Number(sku.stock), 0)
    } else {
      displayPrice = `${Number(product.base_price || 0).toLocaleString()} VNĐ`
    }
  }

  const handleAddToCart = async () => {
    const hasVariations = Object.keys(availableAttributes).length > 0;

    if (hasVariations && !selectedSku) {
      alert('Vui lòng chọn đầy đủ phân loại sản phẩm (Màu sắc, Kích thước...) trước khi thêm vào giỏ nhé!')
      return
    }

    const targetSkuId = selectedSku ? selectedSku.id : product.skus[0].id

    try {
      await cartApi.add({ product_sku_id: targetSkuId, quantity: 1 })
      
      const response = await cartApi.getCart()
      const data = response.data || {}
      const flatCart = Object.values(data).flat().map((item) => ({
        id: item.id,
        name: item.product_name || item.name,
        price: item.price,
        image: item.image || '',
        quantity: Number(item.quantity),
      }))

      localStorage.setItem('CART', JSON.stringify(flatCart))
      window.dispatchEvent(new Event('cartUpdated'))

      alert('Thêm vào giỏ hàng thành công rồi! ')
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Bạn cần đăng nhập để thêm hàng vào giỏ nhé!')
        navigate('/login')
      } else {
        alert('Lỗi: ' + (err.response?.data?.message || 'Không thể thêm vào giỏ lúc này.'))
      }
    }
  }

  return (
    <div className="product-detail-page">
      <button className="btn-back" onClick={() => navigate(-1)}
        style={{ marginBottom: '20px', padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        ← Quay lại
      </button>

      <div className="product-detail-card">
        <div className="product-detail-grid">
          
          {/* CỘT HÌNH ẢNH */}
          <div className="product-image-col">
            <img src={mainImage} alt={product.name} className="product-image-main" />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
              {product.product_images?.map((img) => {
                let thumbUrl = img.image_url || img.image_path
                thumbUrl = thumbUrl.startsWith('http') ? thumbUrl : `http://localhost:8000/storage/${thumbUrl}`
                return (
                  <img 
                    key={img.id} 
                    src={thumbUrl} 
                    onClick={() => setMainImage(thumbUrl)}
                    className="product-thumb"
                    style={{ border: mainImage === thumbUrl ? '2px solid #ee4d2d' : '1px solid #e2e8f0' }}
                    alt="thumbnail"
                  />
                )
              })}
            </div>
          </div>

          {/* CỘT THÔNG TIN */}
          <div className="product-info-col">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-price-box">
              <div className="product-price-text">{displayPrice}</div>
            </div>

            {Object.keys(availableAttributes).length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                {Object.keys(availableAttributes).map((attrName) => (
                  <div key={attrName} style={{ marginBottom: '15px' }}>
                    <h3 style={{ color: '#475569', fontSize: '14px', marginBottom: '10px' }}>
                      {attrName}:
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {availableAttributes[attrName].map((attrValue) => {
                        const isSelected = selectedAttributes[attrName] === attrValue;
                        return (
                          <button
                            key={attrValue}
                            onClick={() => handleSelectAttribute(attrName, attrValue)}
                            style={{
                              border: isSelected ? '1px solid #ee4d2d' : '1px solid #cbd5e1',
                              padding: '8px 16px', 
                              borderRadius: '4px',
                              background: isSelected ? '#fffafa' : 'white',
                              color: isSelected ? '#ee4d2d' : '#1e293b',
                              cursor: 'pointer', 
                              fontWeight: isSelected ? '500' : 'normal',
                            }}
                          >
                            {attrValue}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#64748b' }}>
              Số lượng còn lại: <b style={{ color: '#1e293b' }}>{displayStock}</b> sản phẩm
            </div>

            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
              <b>Danh mục:</b> {product.category?.name || 'Đang cập nhật'}
            </div>
            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#475569' }}>
              <b>Shop:</b> {product.shop?.name || 'Đang cập nhật'}
            </div>

            <div style={{ lineHeight: '1.6', color: '#475569', marginBottom: '30px', fontSize: '14px' }}>
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </div>

            <button
              disabled={displayStock === 0}
              className="btn-add-cart"
              onClick={handleAddToCart}
              style={{
                background: displayStock > 0 ? '#ee4d2d' : '#cbd5e1',
                color: 'white', 
                cursor: displayStock > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {displayStock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>

            <div style={{ marginTop: '40px' }}>
              <Review productId={id} orderId={orderId} token={localStorage.getItem('token')} />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage