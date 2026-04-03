import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import cartApi from '../api/cartApi'
import CartShopGroup from '../components/Cart/CartShopGroup'
import CartFooter from '../components/Cart/CartFooter'
import QuantitySelector from '../components/Button/QuantitySelector'
const CartPage = () => {
  const [cartGroups, setCartGroups] = useState({})
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const navigate = useNavigate()
  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await cartApi.getCart()
      const data = response.data || {}
      setCartGroups(data)
      const flatCart = Object.values(data)
        .flat()
        .map((item) => ({
          id: item.id,
          name: item.product_name || item.name,
          price: item.price,
          image: item.image || '',
          quantity: item.quantity,
        }))

      localStorage.setItem('CART', JSON.stringify(flatCart))

      // trigger header update
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Lỗi tải giỏ hàng:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('ACCESS_TOKEN')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])
  useEffect(() => {
    fetchCartData()
  }, [fetchCartData])

  // Logic lấy toàn bộ ID sản phẩm có trong giỏ
  const allItemIds = Object.values(cartGroups)
    .flat()
    .filter(Boolean)
    .map((item) => item.id)
  const isAllSelected =
    allItemIds.length > 0 &&
    allItemIds.every((id) => selectedItems.includes(id))

  const handleCheck = (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids]
    setSelectedItems((prev) => {
      const isAllSelectedInTarget = targetIds.every((id) => prev.includes(id))
      if (isAllSelectedInTarget) {
        return prev.filter((id) => !targetIds.includes(id))
      } else {
        const newItems = targetIds.filter((id) => !prev.includes(id))
        return [...prev, ...newItems]
      }
    })
  }

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1 || isUpdating) return

    //Cập nhật giao diện trước để người dùng thấy mượt
    const originalGroups = { ...cartGroups }
    setCartGroups((prevGroups) => {
      const newGroups = { ...prevGroups }
      Object.keys(newGroups).forEach((shop) => {
        newGroups[shop] = newGroups[shop].map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      })
      return newGroups
    })

    try {
      setIsUpdating(true)
      // Sử dụng PUT method và đúng cart_item_id để ghi đè số lượng
      await cartApi.update({
        cart_item_id: item.id,
        quantity: newQuantity,
      })
    } catch (error) {
      console.error('Lỗi cập nhật:', error.response?.data)
      alert('Sản phẩm có thể đã hết hàng hoặc lỗi kết nối!')
      setCartGroups(originalGroups) // Rollback nếu lỗi
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
    try {
      await cartApi.remove(id)
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id))
      fetchCartData()
    } catch (error) {
      console.log(error)
      alert('Xóa thất bại!')
    }
  }

  // Hàm xóa hàng loạt sản phẩm đã chọn
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return
    if (!window.confirm(`Xóa ${selectedItems.length} sản phẩm đã chọn?`)) return

    try {
      await Promise.all(selectedItems.map((id) => cartApi.remove(id)))
      setSelectedItems([])
      fetchCartData()
    } catch (error) {
      console.log(error)
      alert('Có lỗi khi xóa hàng loạt!')
    }
  }

  const totalAmount = Object.values(cartGroups)
    .flat()
    .reduce((sum, item) => {
      if (item && selectedItems.includes(item.id)) {
        return sum + Number(item.price || 0) * (item.quantity || 0)
      }
      return sum
    }, 0)

  if (loading)
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>Đang chuẩn bị giỏ hàng của bạn...</p>
      </div>
    )

  return (
    <div className="cart-page-container">
      <div className="cart-content-wrapper">
        <div className="cart-header-row">
          <div className="col-checkbox">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => handleCheck(allItemIds)}
            />
          </div>
          <div className="col-product">Sản Phẩm</div>
          <div className="col-price">Đơn Giá</div>
          <div className="col-qty">Số Lượng</div>
          <div className="col-total">Số Tiền</div>
          <div className="col-action">
            <button
              className="text-red"
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0}
            >
              Xóa mục đã chọn
            </button>
          </div>
        </div>

        {!cartGroups || Object.keys(cartGroups).length === 0 ? (
          <div className="empty-cart">
            <img src="/empty-cart.png" />
            <p>Giỏ hàng của bạn còn trống</p>
            <button onClick={() => navigate('/')}>Mua sắm ngay</button>
          </div>
        ) : (
          Object.entries(cartGroups).map(
            ([shopName, items]) =>
              Array.isArray(items) && (
                <CartShopGroup
                  key={shopName}
                  shopName={shopName}
                  items={items}
                  selectedItems={selectedItems}
                  onCheckShop={() => handleCheck(items.map((i) => i.id))}
                  onCheckItem={(id) => handleCheck(id)}
                  onUpdateQty={handleUpdateQuantity}
                  onDelete={handleDelete}
                />
              )
          )
        )}
      </div>

      <CartFooter
        totalItems={selectedItems.length}
        totalPrice={totalAmount}
        isAllSelected={isAllSelected}
        onCheckAll={() => handleCheck(allItemIds)}
        onBuy={() =>
          navigate('/checkout', { state: { selectedItems: selectedItems } })
        }
      />
    </div>
  )
}

export default CartPage
