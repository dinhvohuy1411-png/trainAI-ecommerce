import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // States cho bộ lọc
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchInput, setSearchInput] = useState(""); 
  const [activeSearch, setActiveSearch] = useState(""); 
  
  // States điều khiển hiệu ứng Mở/Đóng của 2 nút Custom Dropdown
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get("/products").then((res) => setProducts(res.data)).catch(console.log);
    axiosClient.get("/categories").then((res) => setCategories(res.data)).catch(console.log);
  }, []);

  // === THÊM ĐOẠN NÀY: Xử lý Bấm ra ngoài để tắt Dropdown ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Nếu click chuột vào vùng không chứa class 'custom-dropdown' thì đóng menu lại
      if (!e.target.closest('.custom-dropdown')) {
        setIsCatOpen(false);
        setIsPriceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // ==========================================================

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  // LOGIC LỌC TỔNG HỢP
  const filteredProducts = products.filter((p) => {
    const currentPrice = p.skus?.[0]?.price ?? p.base_price ?? 0;
    const matchSearch = p.name.toLowerCase().includes(activeSearch.toLowerCase());
    const matchCategory = selectedCategory ? p.category_id === parseInt(selectedCategory) : true;

    let matchPrice = true;
    if (selectedPriceRange === "under-2m") matchPrice = currentPrice < 2000000;
    else if (selectedPriceRange === "2m-10m") matchPrice = currentPrice >= 2000000 && currentPrice <= 10000000;
    else if (selectedPriceRange === "10m-20m") matchPrice = currentPrice > 10000000 && currentPrice <= 20000000;
    else if (selectedPriceRange === "above-20m") matchPrice = currentPrice > 20000000;

    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div style={{ padding: "40px 20px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* ===================== KHU VỰC 1: TIÊU ĐỀ ===================== */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '800', position: 'relative', display: 'inline-block' }}>
              Gợi Ý Hôm Nay
            <div style={{ position: 'absolute', bottom: '-10px', left: 0, width: '100%', height: '4px', background: '#5a5df0', borderRadius: '4px' }}></div>
          </h2>
        </div>

        {/* ===================== KHU VỰC 2: THANH TÌM KIẾM & BỘ LỌC ===================== */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px',
          marginBottom: '40px',
          paddingBottom: '25px',
          borderBottom: '2px solid #e2e8f0',
          position: 'relative',
          zIndex: 20 
        }}>
          
          {/* --- CỤM TÌM KIẾM --- */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px', 
            flex: '1', 
            minWidth: '350px', 
            maxWidth: '500px' 
          }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', flex: 1, 
              height: '48px', boxSizing: 'border-box', 
              background: 'white', borderRadius: '10px', padding: '0 5px',
              transition: 'all 0.3s ease',
              border: '1px solid #cbd5e1', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#a5a7f5'}
            onMouseLeave={(e) => {
                if(document.activeElement !== e.currentTarget.querySelector('input')) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#5a5df0';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 93, 240, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
            }}
            >
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sản phẩm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1, height: '100%', padding: '0 15px', border: 'none', outline: 'none',
                  fontSize: '15px', background: 'transparent', color: '#1e293b'
                }}
              />
            </div>

            <button
              onClick={handleSearch}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                height: '48px', boxSizing: 'border-box', 
                padding: '0 25px', background: '#5a5df0',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(90, 93, 240, 0.3)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.background = '#4346de';
                e.target.style.boxShadow = '0 6px 16px rgba(90, 93, 240, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = '#5a5df0';
                e.target.style.boxShadow = '0 4px 12px rgba(90, 93, 240, 0.3)';
              }}
            >
              Tìm kiếm
            </button>
          </div>

          {/* --- CỤM BỘ LỌC (CUSTOM DROPDOWN) --- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            {/* 1. Nút Danh Mục */}
            <div className="custom-dropdown" style={{ position: 'relative', minWidth: '180px' }}>
              <div 
                onClick={() => { setIsCatOpen(!isCatOpen); setIsPriceOpen(false); }}
                style={{
                  height: "48px", boxSizing: 'border-box', padding: "0 20px", 
                  borderRadius: "10px", 
                  border: "1.5px solid #c7d2fe",
                  background: "#f5f3ff", 
                  color: "#4338ca", 
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s ease", fontWeight: '600', fontSize: '14px',
                  boxShadow: isCatOpen ? '0 0 0 3px rgba(199, 210, 254, 0.4)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span>{selectedCategory ? categories.find(c => c.id == selectedCategory)?.name : "Danh Mục"}</span>
                <span style={{ fontSize: '12px', transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
              </div>

              {/* Menu Danh mục xổ xuống mượt mà */}
              <div style={{
                position: 'absolute', top: '55px', left: 0, width: '100%',
                background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid #e0e7ff', borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(90, 93, 240, 0.2)',
                opacity: isCatOpen ? 1 : 0,
                visibility: isCatOpen ? 'visible' : 'hidden',
                transform: isCatOpen ? 'translateY(0) scale(1)' : 'translateY(-15px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                zIndex: 30, overflow: 'hidden'
              }}>
                <div 
                  onClick={() => { setSelectedCategory(""); setIsCatOpen(false); }}
                  style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}
                  onMouseEnter={(e) => e.target.style.background = '#eef2ff'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Tất cả Category
                </div>
                {categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    onClick={() => { setSelectedCategory(cat.id); setIsCatOpen(false); }}
                    style={{ 
                      padding: '12px 15px', cursor: 'pointer', fontSize: '14px',
                      color: selectedCategory == cat.id ? '#4338ca' : '#334155',
                      fontWeight: selectedCategory == cat.id ? 'bold' : 'normal',
                      background: selectedCategory == cat.id ? '#e0e7ff' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                    onMouseLeave={(e) => e.target.style.background = selectedCategory == cat.id ? '#e0e7ff' : 'transparent'}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Nút Mức Giá */}
            <div className="custom-dropdown" style={{ position: 'relative', minWidth: '180px' }}>
              <div 
                onClick={() => { setIsPriceOpen(!isPriceOpen); setIsCatOpen(false); }}
                style={{
                  height: "48px", boxSizing: 'border-box', padding: "0 20px", 
                  borderRadius: "10px", 
                  border: "1.5px solid #c7d2fe", 
                  background: "#f5f3ff", 
                  color: "#4338ca", 
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s ease", fontWeight: '600', fontSize: '14px',
                  boxShadow: isPriceOpen ? '0 0 0 3px rgba(199, 210, 254, 0.4)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span>
                  {selectedPriceRange === "under-2m" ? "Dưới 2 Triệu" :
                   selectedPriceRange === "2m-10m" ? "2 - 10 Triệu" :
                   selectedPriceRange === "10m-20m" ? "10 - 20 Triệu" :
                   selectedPriceRange === "above-20m" ? "Trên 20 Triệu" : "Mức Giá"}
                </span>
                <span style={{ fontSize: '12px', transform: isPriceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
              </div>

              {/* Menu Mức giá xổ xuống mượt mà */}
              <div style={{
                position: 'absolute', top: '55px', left: 0, width: '100%',
                background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid #e0e7ff', borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(90, 93, 240, 0.2)',
                opacity: isPriceOpen ? 1 : 0,
                visibility: isPriceOpen ? 'visible' : 'hidden',
                transform: isPriceOpen ? 'translateY(0) scale(1)' : 'translateY(-15px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                zIndex: 30, overflow: 'hidden'
              }}>
                {[
                  { val: "", label: "Tất cả mức giá" },
                  { val: "under-2m", label: "Dưới 2.000.000đ" },
                  { val: "2m-10m", label: "Từ 2 - 10 triệu" },
                  { val: "10m-20m", label: "Từ 10 - 20 triệu" },
                  { val: "above-20m", label: "Trên 20 triệu" }
                ].map(item => (
                  <div 
                    key={item.val}
                    onClick={() => { setSelectedPriceRange(item.val); setIsPriceOpen(false); }}
                    style={{ 
                      padding: '12px 15px', cursor: 'pointer', fontSize: '14px',
                      color: selectedPriceRange === item.val ? '#4338ca' : '#334155',
                      fontWeight: selectedPriceRange === item.val ? 'bold' : 'normal',
                      background: selectedPriceRange === item.val ? '#e0e7ff' : 'transparent',
                      borderBottom: item.val === "" ? '1px solid #f1f5f9' : 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                    onMouseLeave={(e) => e.target.style.background = selectedPriceRange === item.val ? '#e0e7ff' : 'transparent'}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ===================== KHU VỰC 3: LƯỚI SẢN PHẨM ===================== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "25px", position: 'relative', zIndex: 10 }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              
              let image = "https://placehold.co/200x200?text=No+Image"; 
              const imageObj = product.product_images?.[0];
              if (imageObj) {
                const imgUrl = imageObj.image_url || imageObj.image_path; 
                if (imgUrl) {
                  image = imgUrl.startsWith("http") ? imgUrl : `http://localhost:8000/storage/${imgUrl}`;
                }
              }

              let totalStock = 0;
              if (product.skus && product.skus.length > 0) {
                totalStock = product.skus.reduce((sum, sku) => sum + Number(sku.stock), 0);
              } else {
                totalStock = Number(product.stock || 0); 
              }
              const isOutOfStock = totalStock <= 0;

              let priceDisplay = `${Number(product.base_price || 0).toLocaleString()}đ`;
              
              if (!isOutOfStock && product.skus && product.skus.length > 0) {
                const prices = product.skus.map(sku => Number(sku.price));
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                priceDisplay = minPrice !== maxPrice 
                    ? `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ` 
                    : `${minPrice.toLocaleString()}đ`;
              }

              if (isOutOfStock) {
                priceDisplay = "Hết hàng";
              }

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    background: "white", borderRadius: "12px", cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.04)", transition: "all 0.3s ease",
                    overflow: 'hidden', position: 'relative', border: '1px solid #f1f5f9', 
                    display: 'flex', flexDirection: 'column',
                    opacity: isOutOfStock ? 0.75 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)"; 
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(90, 93, 240, 0.1), 0 10px 10px -5px rgba(90, 93, 240, 0.04)"; 
                    e.currentTarget.querySelector('.product-img').style.transform = 'scale(1.05)'; 
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.04)";
                    e.currentTarget.querySelector('.product-img').style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ overflow: 'hidden', height: '220px', backgroundColor: '#f8fafc' }}>
                    <img 
                      className="product-img"
                      src={image} 
                      alt={product.name} 
                      style={{ 
                        width: "100%", height: "100%", objectFit: "cover", 
                        transition: 'transform 0.5s ease',
                        filter: isOutOfStock ? 'grayscale(80%)' : 'none' 
                      }} 
                    />
                  </div>
                  
                  <div style={{ padding: "15px", flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ 
                      fontSize: "15px", marginBottom: "8px", color: '#1e293b', 
                      fontWeight: '500', lineHeight: '1.4', flex: 1,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {product.name}
                    </h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <p style={{ 
                        color: isOutOfStock ? "#64748b" : "#5a5df0", 
                        fontWeight: "700", fontSize: "16px", margin: 0 
                      }}>
                        {priceDisplay}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {isOutOfStock ? "Tạm ngưng" : `Đã bán ${product.sold_count || 0}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
              <h3 style={{ color: '#475569', margin: 0 }}>Không tìm thấy sản phẩm nào!</h3>
              <p style={{ color: '#94a3b8', marginTop: '10px' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm xem sao nhé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}