import React, { useEffect, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient'
import couponApi from '../api/couponApi'

const SellerCouponManagementPage = () => {
  const [shop, setShop] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [globalError, setGlobalError] = useState('')

  // State Form
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [maxDiscountValue, setMaxDiscountValue] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [creating, setCreating] = useState(false)

  const canCreate = useMemo(() => {
    return shop && code && discountValue && usageLimit && startDate && endDate
  }, [shop, code, discountValue, usageLimit, startDate, endDate])

  const loadData = async () => {
    setGlobalError('')
    try {
      const shopRes = await axiosClient.get('/my-shop')
      setShop(shopRes.data)
      const couponsRes = await couponApi.getCoupons(shopRes.data.id)
      setCoupons(couponsRes.data || [])
    } catch (err) {
      setGlobalError('Không tải được dữ liệu')
      console.log(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await couponApi.createCoupon({
        shop_id: shop.id,
        code: code.trim().toUpperCase(),
        discount_type: discountType === 'percent' ? 'percent' : 'fixed',
        discount_value: Number(discountValue),
        min_order_value: Number(minOrderValue) || 0,
        max_discount_value: Number(maxDiscountValue) || null,
        usage_limit: Number(usageLimit),
        start_date: startDate,
        end_date: endDate,
      })
      // Reset form
      setCode('')
      setDiscountValue('')
      setMinOrderValue('')
      setMaxDiscountValue('')
      setUsageLimit('')
      setStartDate('')
      setEndDate('')
      await loadData()
      alert('Tạo mã thành công!')
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Lỗi khi tạo mã')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="seller-content">
      <div className="shop-header">
        <h2>Quản lý mã giảm giá</h2>
        {shop && (
          <span className={shop.status === 'active' ? 'verified' : 'pending'}>
            {shop.status === 'active'
              ? '● Cửa hàng đang hoạt động'
              : '● Chờ duyệt'}
          </span>
        )}
      </div>

      {globalError && (
        <div style={{ color: '#ef4444', marginBottom: '20px' }}>
          {globalError}
        </div>
      )}

      
      <div
        className="product-card"
        style={{ marginBottom: '40px', maxWidth: '800px' }}
      >
        <h3 style={{ marginBottom: '20px', color: '#1e1b4b' }}>Tạo mã mới</h3>
        <form onSubmit={handleCreate} className="coupon-form-grid">
          <div className="input-box">
            <label>Mã Coupon</label>
            <input
              placeholder="VD: NHOM10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Loại giảm giá</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <option value="fixed">Số tiền cố định (đ)</option>
              <option value="percent">Phần trăm (%)</option>
            </select>
          </div>
          <div className="input-box">
            <label>Giá trị giảm</label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Giảm tối đa (nếu chọn %)</label>
            <input
              type="number"
              value={maxDiscountValue}
              onChange={(e) => setMaxDiscountValue(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Đơn tối thiểu</label>
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Số lượng phát hành</label>
            <input
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Ngày bắt đầu</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label>Ngày kết thúc</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="add-product-btn"
            disabled={!canCreate}
            style={{ gridColumn: 'span 2', marginTop: '10px' }}
          >
            {creating ? 'Đang xử lý...' : 'Xác nhận tạo mã'}
          </button>
        </form>
      </div>

      
      <h3 style={{ marginBottom: '20px' }}>Mã giảm giá đã tạo</h3>
      <div className="product-grid">
        {coupons.map((c) => (
          <div key={c.id} className="product-card">
            <div
              className="price"
              style={{ fontSize: '20px', marginBottom: '10px' }}
            >
              {c.code}
            </div>
            <h4 style={{ color: '#111827' }}>
              Giảm{' '}
              {c.discount_type === 'percent'
                ? `${c.discount_value}%`
                : `${Number(c.discount_value).toLocaleString()}đ`}
            </h4>
            <div className="stock">
              Đơn tối thiểu: {Number(c.min_order_value).toLocaleString()}đ
            </div>
            <div className="stock">Số lượng còn lại: {c.usage_limit}</div>
            <div
              className="stock"
              style={{ marginTop: '5px', color: '#6366f1' }}
            >
              Hết hạn: {new Date(c.end_date).toLocaleDateString('vi-VN')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SellerCouponManagementPage
