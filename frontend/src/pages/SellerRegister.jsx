import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
function SellerRegister() {
  const [step, setStep] = useState(1)
  const Navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState(null)
  const [preview, setPreview] = useState(null)

  const [addressDetail, setAddressDetail] = useState('')
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')

  const [provinceName, setProvinceName] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [wardName, setWardName] = useState('')

  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)

  const [receiver, setReceiver] = useState('')
  const [phone, setPhone] = useState('')
  const phoneRegex = /^(0|\+84)[0-9]{9}$/
  // =============================
  // LOAD USER
  // =============================
  useEffect(() => {
    const fetchUser = async () => {
      const res = await axiosClient.get('/user')
      setName(res.data.name)
    }
    fetchUser()
  }, [])

  // =============================
  // LOAD ADDRESS
  // =============================
  useEffect(() => {
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
  // =============================
  // VALIDATE
  // =============================
  const handleNext = () => {
    if (!name.trim()) return alert('Nhập tên shop')
    if (addresses.length === 0) return alert('Thêm địa chỉ')
    const phone = addresses[0].phone
    if (!phoneRegex.test(phone)) return alert('SĐT không hợp lệ')
    setStep(2)
  }

  const handleSubmit = async () => {
    try {
      const formData = new FormData()

      formData.append('name', name)
      formData.append('description', description)

      const sellerAddr = addresses.map((addr) => ({
        receiver: addr.receiver,
        phone: addr.phone,
        detail: addr.detail,
        province: addr.provinceName,
        district: addr.districtName || '',
        ward: addr.wardName || '',
      }))

      formData.append('addresses', JSON.stringify(sellerAddr))
      if (logo) formData.append('logo', logo)

      const res = await axiosClient.post('/shops', formData)
      alert(res.data.message)
      Navigate('/')
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Có lỗi không xác định xảy ra'
      alert(errorMessage)
      console.error('Lỗi chi tiết:', err)
      return
    }
  }

  return (
    <div className="seller-wrapper">
      <div className="seller-box big">
        <div style={{ textAlign: 'center' }}>
          <h2>Đăng ký trở thành người bán</h2>
        </div>
        {/* STEP BAR */}
        <div className="progress">
          <div className={step === 1 ? 'dot active' : 'dot'}>1</div>
          <div className="bar"></div>
          <div className={step === 2 ? 'dot active' : 'dot'}>2</div>
        </div>

        {/* ================= FORM ================= */}
        {step === 1 && (
          <div className="form">
            <div>
              <span style={{ color: 'red' }}>*</span> Tên shop
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} />

            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label>Logo</label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setLogo(file)
                  setPreview(URL.createObjectURL(file))
                }
              }}
            />

            <div>
              <span style={{ color: 'red' }}>*</span> Địa chỉ
            </div>

            <div className="address-box">
              {addresses.length > 0 ? (
                <div className="address-display">
                  <p>
                    <b> {addresses[0].receiver}</b> | {addresses[0].phone}
                  </p>

                  <p>
                    <p>
                      {addresses[0].detail}
                      {addresses[0].wardName
                        ? `, ${addresses[0].wardName}`
                        : ''}
                      {addresses[0].districtName
                        ? `, ${addresses[0].districtName}`
                        : ''}
                      {addresses[0].provinceName
                        ? `, ${addresses[0].provinceName}`
                        : ''}
                      , Việt Nam
                    </p>
                  </p>

                  <p className="sub">{addresses[0].wardName}</p>
                  <p className="sub">{addresses[0].districtName}</p>
                  <p className="sub">{addresses[0].provinceName}</p>

                  <span
                    className="edit"
                    onClick={async () => {
                      const addr = addresses[0]

                      setReceiver(addr.receiver)
                      setPhone(addr.phone)
                      setAddressDetail(addr.detail)

                      setProvince(addr.province)
                      setDistrict(addr.district)
                      setWard(addr.ward)

                      setProvinceName(addr.provinceName)
                      setDistrictName(addr.districtName)
                      setWardName(addr.wardName)
                      const res1 = await axios.get(
                        `https://provinces.open-api.vn/api/p/${addr.province}?depth=2`
                      )
                      setDistricts(res1.data.districts || [])

                      const res2 = await axios.get(
                        `https://provinces.open-api.vn/api/d/${addr.district}?depth=2`
                      )
                      setWards(res2.data.wards || [])
                      setWards(res2.data.wards || [])
                      setShowAddressForm(true)
                    }}
                  >
                    Chỉnh sửa
                  </span>
                </div>
              ) : (
                <button onClick={() => setShowAddressForm(true)}>
                  + Thêm địa chỉ
                </button>
              )}
            </div>
            {showAddressForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  {addresses.length > 0 ? (
                    <h3>Chỉnh sửa địa chỉ lấy hàng</h3>
                  ) : (
                    <h3>Thêm địa chỉ lấy hàng</h3>
                  )}

                  <input
                    placeholder="Tên người nhận"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                  />

                  <input
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <input
                    placeholder="Số nhà, tên đường"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />

                  <div className="grid-3">
                    <select
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

                  <div className="btn-group">
                    <button onClick={() => setShowAddressForm(false)}>
                      Hủy
                    </button>

                    <button
                      onClick={() => {
                        if (!receiver || !phone || !addressDetail || !province)
                          return alert('Vui lòng nhập đầy đủ thông tin!')
                        if (!phoneRegex.test(phone)) {
                          return alert(
                            'SĐT không hợp lệ (Phải bắt đầu bằng 0 hoặc +84 và đủ 10 số)'
                          )
                        }
                        const newAddress = {
                          receiver,
                          phone,
                          detail: addressDetail,
                          province: province,
                          district: district || '',
                          ward: ward || '',
                          provinceName: provinceName,
                          districtName: districtName || '',
                          wardName: wardName || '',
                        }

                        setAddresses([newAddress])
                        setShowAddressForm(false)

                        setReceiver('')
                        setPhone('')
                        setAddressDetail('')
                        setProvince('')
                        setDistrict('')
                        setWard('')
                        setProvinceName('')
                        setDistrictName('')
                        setWardName('')
                      }}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button className="full-btn" onClick={handleNext}>
              Tiếp tục
            </button>
          </div>
        )}

        {/* ================= CONFIRM ================= */}
        {step === 2 && (
          <div className="form confirm">
            <h3>Xác nhận thông tin</h3>

            <p>
              <b>Tên shop:</b> {name}
            </p>
            <p>
              <p>
                <div>
                  <b>Địa chỉ:</b>
                  {addresses.length > 0 && (
                    <div>
                      <p>
                        <b>{addresses[0].receiver}</b> | {addresses[0].phone}
                      </p>
                      <p>
                        <p>
                          {addresses[0].detail}
                          {addresses[0].wardName
                            ? `, ${addresses[0].wardName}`
                            : ''}
                          {addresses[0].districtName
                            ? `, ${addresses[0].districtName}`
                            : ''}
                          {addresses[0].provinceName
                            ? `, ${addresses[0].provinceName}`
                            : ''}
                          , Việt Nam
                        </p>
                      </p>
                    </div>
                  )}
                </div>
              </p>
            </p>

            {preview && <img src={preview} className="preview" />}

            <div className="btn-group">
              <button onClick={() => setStep(1)}>Quay lại</button>
              <button className="submit" onClick={handleSubmit}>
                Tạo shop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerRegister
