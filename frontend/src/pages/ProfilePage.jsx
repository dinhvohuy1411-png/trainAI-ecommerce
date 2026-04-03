import { useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
function ProfilePage() {
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addresses, setAddresses] = useState([])
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [receiver, setReceiver] = useState('')
  const [addressDetail, setAddressDetail] = useState('')

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')

  const [provinceName, setProvinceName] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [wardName, setWardName] = useState('')

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [editingId, setEditingId] = useState(null)

  const handleOpenAddForm = () => {
    setEditingId(null)
    setReceiver('')
    setPhone('')
    setAddressDetail('')
    setProvince('')
    setProvinceName('')
    setDistrict('')
    setDistrictName('')
    setWard('')
    setWardName('')
    setDistricts([])
    setWards([])
    setShowAddressForm(true)
  }

  const handleOpenEditForm = async (addr) => {
    setEditingId(addr.id)
    setReceiver(addr.recipient_name)
    setPhone(addr.recipient_phone)
    setAddressDetail(addr.address_detail)

    const p = provinces.find((x) => x.name === addr.city)
    if (p) {
      setProvince(p.code)
      setProvinceName(p.name)
      const resD = await axios.get(
        `https://provinces.open-api.vn/api/p/${p.code}?depth=2`
      )
      const fetchedDistricts = resD.data.districts || []
      setDistricts(fetchedDistricts)

      const d = fetchedDistricts.find((x) => x.name === addr.district)
      if (d) {
        setDistrict(d.code)
        setDistrictName(d.name)
        const resW = await axios.get(
          `https://provinces.open-api.vn/api/d/${d.code}?depth=2`
        )
        const fetchedWards = resW.data.wards || []
        setWards(fetchedWards)

        const w = fetchedWards.find((x) => x.name === addr.ward)
        if (w) {
          setWard(w.code)
          setWardName(w.name)
        } else {
          setWard('')
          setWardName('')
        }
      } else {
        setDistrict('')
        setDistrictName('')
        setWard('')
        setWardName('')
        setWards([])
      }
    } else {
      setProvince('')
      setProvinceName('')
      setDistrict('')
      setDistrictName('')
      setWard('')
      setWardName('')
      setDistricts([])
      setWards([])
    }

    setShowAddressForm(true)
  }
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      alert('Ảnh phải nhỏ hơn 1MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Chỉ chấp nhận JPG, PNG')
      return
    }

    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }
  const handleUpdateProfile = async () => {
    try {
      await axiosClient.put('/user/update', {
        name,
        email,
        phone,
      })

      if (avatar) {
        const formData = new FormData()
        formData.append('avatar', avatar)

        await axiosClient.post('/user/update-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      alert('Cập nhật thành công')
    } catch (err) {
      console.error(err)
      alert('Lỗi cập nhật')
    }
  }
  const formRow = (label, input) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
      }}
    >
      <label style={{ width: '120px' }}>{label}</label>
      <div style={{ flex: 1 }}>{input}</div>
    </div>
  )
  useEffect(() => {
    const fetchUser = async () => {
      const res = await axiosClient.get('/user')

      setName(res.data.name)
      setEmail(res.data.email)
      if (res.data.avatar) {
        const avatarUrl = res.data.avatar.startsWith('http')
          ? res.data.avatar
          : `http://localhost:8000/storage/${res.data.avatar}`
        setPreview(avatarUrl)
      }
      setPhone(res.data.phone)
    }
    fetchUser()
    fetchAddresses()
    const fetchProvinces = async () => {
      try {
        const res = await axios.get('https://provinces.open-api.vn/api/p/')
        setProvinces(res.data || [])
      } catch (error) {
        console.error('Lỗi khi tải danh sách Tỉnh/Thành:', error)
      }
    }
    fetchProvinces()
  }, [])
  const handleProvince = async (code) => {
    if (!code) {
      setProvince('')
      setProvinceName('')
      setDistrict('')
      setDistrictName('')
      setDistricts([])
      setWard('')
      setWardName('')
      setWards([])
      return
    }

    const selected = provinces.find((p) => String(p.code) === String(code))
    setProvince(code)
    setProvinceName(selected?.name || '')

    setDistrict('')
    setDistrictName('')
    setWards([])
    setWard('')
    setWardName('')

    try {
      const res = await axios.get(
        `https://provinces.open-api.vn/api/p/${code}?depth=2`
      )
      setDistricts(res.data.districts || [])
    } catch (error) {
      console.error('Lỗi tải Quận/Huyện:', error)
    }
  }

  const handleDistrict = async (code) => {
    if (!code) {
      setDistrict('')
      setDistrictName('')
      setWard('')
      setWardName('')
      setWards([])
      return
    }

    const selected = districts.find((d) => String(d.code) === String(code))
    setDistrict(code)
    setDistrictName(selected?.name || '')

    setWard('')
    setWardName('')

    try {
      const res = await axios.get(
        `https://provinces.open-api.vn/api/d/${code}?depth=2`
      )
      setWards(res.data.wards || [])
    } catch (error) {
      console.error('Lỗi tải Phường/Xã:', error)
    }
  }
  const handleWard = (code) => {
    const selected = wards.find((w) => w.code == code)
    setWard(code)
    setWardName(selected?.name || '')
  }
  const fetchAddresses = async () => {
    try {
      const res = await axiosClient.get('/user/addresses')
      setAddresses(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    }
  }
  const addAddress = async (data) => {
    try {
      const res = await axiosClient.post('/user/addresses', data)
      setAddresses([...addresses, res.data.data])
    } catch (err) {
      console.error(err)
    }
  }
  const updateAddress = async (id, data) => {
    try {
      await axiosClient.put(`/user/addresses/${id}`, data)
      setAddresses(
        addresses.map((addr) => (addr.id === id ? { ...addr, ...data } : addr))
      )
      alert('Cập nhật thành công!')
    } catch (err) {
      console.error(err)
      alert('Lỗi cập nhật. Hãy kiểm tra lại Route PUT bên Laravel.')
    }
  }
  const deleteAddress = async (id) => {
    try {
      await axiosClient.delete(`/user/addresses/${id}`)
      setAddresses(addresses.filter((addr) => addr.id !== id))
    } catch (err) {
      console.error(err)
      alert('Lỗi xóa. Hãy kiểm tra lại Route DELETE bên Laravel.')
    }
  }
  const setDefaultAddress = async (id) => {
    try {
      await axiosClient.put(`/user/addresses/${id}/default`)

      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          is_default: addr.id === id,
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      await axiosClient.post('/user/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      })

      alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      navigate('/login')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors
        const errorMessages = Object.values(errors).flat().join('\n')
        alert(errorMessages)
      } else {
        alert('Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.')
      }
    }
  }
  const menuItem = (key, label) => (
    <div
      onClick={() => setTab(key)}
      style={{
        padding: '10px',
        cursor: 'pointer',
        borderRadius: '6px',
        background: tab === key ? '#eef2ff' : 'transparent',
        color: tab === key ? '#5a5df0' : '#333',
        fontWeight: tab === key ? '500' : 'normal',
        marginBottom: '6px',
      }}
    >
      {label}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        maxWidth: '1000px',
        margin: '30px auto',
        gap: '30px',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '220px',
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <h3 style={{ marginBottom: '15px' }}>Tài khoản của tôi</h3>

        {menuItem('profile', 'Hồ sơ')}
        {menuItem('address', 'Địa chỉ')}
        {menuItem('password', 'Đổi mật khẩu')}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* ===== HỒ SƠ ===== */}
        {tab === 'profile' && (
          <>
            <div style={{ display: 'flex', gap: '40px' }}>
              {/* LEFT - FORM */}
              <div style={{ flex: 1 }}>
                <h2>Hồ sơ</h2>
                <h5 style={{ color: '#666' }}>
                  Quản lý thông tin hồ sơ để bảo mật tài khoản
                </h5>
                {formRow(
                  'Tên',
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                  />
                )}

                {formRow(
                  'Email',
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                )}

                {formRow(
                  'SĐT',
                  <input
                    value={phone || ''}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                )}

                <button style={btn} onClick={handleUpdateProfile}>
                  Lưu
                </button>
              </div>

              {/* RIGHT - AVATAR */}
              <input
                type="file"
                id="avatarInput"
                style={{ display: 'none' }}
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleAvatarChange}
              />
              <div>
                <div
                  style={avatarBox}
                  onClick={() => document.getElementById('avatarInput').click()}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="avatar"
                      value={avatar}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                      }}
                    />
                  ) : (
                    name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ color: 'gray' }}>
                  <p>Dung lượng file tối đa 1MB</p>
                  <p>Định dạng: .PNG, .JPG</p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'address' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '20px',
                borderBottom: '1px solid #ebebeb',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                Địa chỉ của tôi
              </h2>
              <button
                style={{
                  background: '#0f47d3',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleOpenAddForm}
              >
                <span style={{ fontSize: '18px', lineHeight: '10px' }}>+</span>{' '}
                Thêm địa chỉ mới
              </button>
            </div>

            <div style={{ paddingTop: '15px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '15px',
                }}
              >
                Địa chỉ
              </h3>

              {addresses.length === 0 ? (
                <p>Chưa có địa chỉ</p>
              ) : (
                addresses.map((addr, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '20px 0',
                      borderBottom: '1px solid #ebebeb',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#333',
                          }}
                        >
                          {addr.recipient_name}
                        </span>
                        <span
                          style={{ margin: '0 8px', color: 'rgba(0,0,0,.26)' }}
                        >
                          |
                        </span>
                        <span style={{ color: 'rgba(0,0,0,.54)' }}>
                          {addr.recipient_phone}
                        </span>
                      </div>

                      <div
                        style={{
                          color: 'rgba(0,0,0,.54)',
                          marginBottom: '5px',
                        }}
                      >
                        {addr.address_detail}
                      </div>

                      <div
                        style={{
                          color: 'rgba(0,0,0,.54)',
                          marginBottom: '10px',
                        }}
                      >
                        {[addr.ward, addr.district, addr.city, 'Việt Nam']
                          .filter(Boolean)
                          .join(', ')}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {addr.is_default == 1 && (
                          <span
                            style={{
                              border: '1px solid #ee4d2d',
                              color: '#ee4d2d',
                              padding: '2px 4px',
                              fontSize: '12px',
                              borderRadius: '1px',
                            }}
                          >
                            Mặc định
                          </span>
                        )}
                        <span
                          style={{
                            border: '1px solid #888',
                            color: '#888',
                            padding: '2px 4px',
                            fontSize: '12px',
                            borderRadius: '1px',
                          }}
                        >
                          Địa chỉ lấy hàng
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        minWidth: '150px',
                      }}
                    >
                      <div
                        style={{
                          gap: '15px',
                          display: 'flex',
                          marginBottom: '10px',
                        }}
                      >
                        <span
                          style={{
                            color: '#05a',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                          onClick={() => handleOpenEditForm(addr)}
                        >
                          Cập nhật
                        </span>
                        {addr.is_default != 1 && (
                          <span
                            style={{
                              color: '#05a',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Bạn có chắc muốn xóa địa chỉ này?'
                                )
                              )
                                deleteAddress(addr.id)
                            }}
                          >
                            Xóa
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (addr.is_default != 1) setDefaultAddress(addr.id)
                        }}
                        disabled={addr.is_default == 1}
                        style={{
                          background: '#fff',
                          border: '1px solid rgba(0,0,0,.09)',
                          color:
                            addr.is_default == 1 ? 'rgba(0,0,0,.26)' : '#333',
                          padding: '5px 10px',
                          borderRadius: '2px',
                          cursor: addr.is_default == 1 ? 'default' : 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Thiết lập mặc định
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showAddressForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>
                    {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ nhận hàng'}
                  </h3>

                  <input
                    placeholder="Tên người nhận"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    placeholder="Số nhà, tên đường"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    style={inputStyle}
                  />

                  <div
                    className="grid-3"
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '15px',
                    }}
                  >
                    <select
                      style={{ flex: 1, padding: '10px' }}
                      value={province}
                      onChange={(e) => handleProvince(e.target.value)}
                    >
                      <option value="">Tỉnh/Thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={String(p.code)}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <select
                      style={{ flex: 1, padding: '10px' }}
                      value={district}
                      onChange={(e) => handleDistrict(e.target.value)}
                    >
                      <option value="">Quận/Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={String(d.code)}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <select
                      style={{ flex: 1, padding: '10px' }}
                      value={ward}
                      onChange={(e) => handleWard(e.target.value)}
                    >
                      <option value="">Phường/Xã</option>
                      {wards.map((w) => (
                        <option key={w.code} value={String(w.code)}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="btn-group"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                    }}
                  >
                    <button
                      style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                      onClick={() => setShowAddressForm(false)}
                    >
                      Hủy
                    </button>

                    <button
                      style={btn}
                      onClick={async () => {
                        if (!receiver || !phone || !addressDetail || !province)
                          return alert(
                            'Vui lòng nhập đầy đủ thông tin bắt buộc!'
                          )

                        const phoneRegex = /^(0|\+84)[0-9]{9}$/
                        if (!phoneRegex.test(phone)) {
                          return alert(
                            'SĐT không hợp lệ (Phải bắt đầu bằng 0 hoặc +84 và đủ 10 số)'
                          )
                        }

                        const dataToSave = {
                          recipient_name: receiver,
                          recipient_phone: phone,
                          address_detail: addressDetail,
                          city: provinceName,
                          district: districtName || '',
                          ward: wardName || '',
                        }

                        if (editingId) {
                          await updateAddress(editingId, dataToSave)
                        } else {
                          await addAddress(dataToSave)
                        }

                        setShowAddressForm(false)
                      }}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== ĐỔI MẬT KHẨU ===== */}
        {tab === 'password' && (
          <>
            <h2>Đổi mật khẩu</h2>

            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />

            <button style={btn} onClick={handleChangePassword}>
              Đổi mật khẩu
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* STYLE */
const inputStyle = {
  width: '95%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '6px',
  border: '1px solid #ddd',
}

const btn = {
  padding: '10px 20px',
  background: '#5a5df0',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}
const avatarBox = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  background: '#ddd',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  margin: '0 auto 15px',
}
export default ProfilePage
