import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import './HomePage.css'; // Gọi file CSS ở đây là đủ rồi

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchInput, setSearchInput] = useState(""); 
  const [activeSearch, setActiveSearch] = useState(""); 
  
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  const navigate = useNavigate();

// ==========================================================
  // HÀM XÁO TRỘN MẢNG (Thuật toán Fisher-Yates)
  // ==========================================================
  const shuffleArray = (array) => {
    const newArray = [...array]; // Tạo một bản sao để không làm hỏng mảng gốc
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Chọn một vị trí ngẫu nhiên
      // Hoán đổi vị trí
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    // 1. Gọi API lấy Sản phẩm và Xáo trộn ngẫu nhiên
    axiosClient.get("/products")
      .then((res) => {
        const randomProducts = shuffleArray(res.data); // Tráo bài!
        setProducts(randomProducts); // Cập nhật state bằng mảng đã tráo
      })
      .catch(console.log);

    // 2. Gọi API lấy Danh mục (Giữ nguyên không xáo trộn)
    axiosClient.get("/categories")
      .then((res) => setCategories(res.data))
      .catch(console.log);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        setIsCatOpen(false);
        setIsPriceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

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
    <div className="home-container" style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "30px" }}>
          <h2 className="home-title" style={{ margin: 0, color: '#0f172a', fontWeight: '800', position: 'relative', display: 'inline-block' }}>
             Gợi Ý Hôm Nay
            <div style={{ position: 'absolute', bottom: '-10px', left: 0, width: '100%', height: '4px', background: '#5a5df0', borderRadius: '4px' }}></div>
          </h2>
        </div>

        <div className="filter-section">
          <div className="search-wrapper">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sản phẩm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1, height: '100%', padding: '0 15px', border: 'none', outline: 'none',
                  fontSize: '15px', background: 'transparent', color: '#1e293b', width: '100%'
                }}
              />
            </div>
            <button className="search-btn" onClick={handleSearch}>
              Tìm kiếm
            </button>
          </div>

          <div className="dropdown-group">
            <div className="custom-dropdown" style={{ position: 'relative' }}>
              <div 
                onClick={() => { setIsCatOpen(!isCatOpen); setIsPriceOpen(false); }}
                style={{
                  height: "48px", boxSizing: 'border-box', padding: "0 15px", 
                  borderRadius: "10px", border: "1.5px solid #c7d2fe", background: "#f5f3ff", 
                  color: "#4338ca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s ease", fontWeight: '600', fontSize: '14px',
                  boxShadow: isCatOpen ? '0 0 0 3px rgba(199, 210, 254, 0.4)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                  {selectedCategory ? categories.find(c => c.id == selectedCategory)?.name : "Danh Mục"}
                </span>
                <span style={{ fontSize: '12px', transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
              </div>

              <div style={{
                position: 'absolute', top: '55px', left: 0, width: '100%', minWidth: '180px',
                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
                border: '1px solid #e0e7ff', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(90, 93, 240, 0.2)',
                opacity: isCatOpen ? 1 : 0, visibility: isCatOpen ? 'visible' : 'hidden',
                transform: isCatOpen ? 'translateY(0) scale(1)' : 'translateY(-15px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 30, overflow: 'hidden'
              }}>
                <div onClick={() => { setSelectedCategory(""); setIsCatOpen(false); }} style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>Tất cả</div>
                {categories.map((cat) => (
                  <div key={cat.id} onClick={() => { setSelectedCategory(cat.id); setIsCatOpen(false); }}
                    style={{ padding: '12px 15px', cursor: 'pointer', fontSize: '14px', color: selectedCategory == cat.id ? '#4338ca' : '#334155', fontWeight: selectedCategory == cat.id ? 'bold' : 'normal', background: selectedCategory == cat.id ? '#e0e7ff' : 'transparent' }}>
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-dropdown" style={{ position: 'relative' }}>
              <div 
                onClick={() => { setIsPriceOpen(!isPriceOpen); setIsCatOpen(false); }}
                style={{
                  height: "48px", boxSizing: 'border-box', padding: "0 15px", 
                  borderRadius: "10px", border: "1.5px solid #c7d2fe", background: "#f5f3ff", 
                  color: "#4338ca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s ease", fontWeight: '600', fontSize: '14px',
                  boxShadow: isPriceOpen ? '0 0 0 3px rgba(199, 210, 254, 0.4)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                  {selectedPriceRange === "under-2m" ? "Dưới 2Tr" :
                   selectedPriceRange === "2m-10m" ? "2 - 10Tr" :
                   selectedPriceRange === "10m-20m" ? "10 - 20Tr" :
                   selectedPriceRange === "above-20m" ? "Trên 20Tr" : "Mức Giá"}
                </span>
                <span style={{ fontSize: '12px', transform: isPriceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
              </div>

              <div style={{
                position: 'absolute', top: '55px', right: 0, width: '100%', minWidth: '180px',
                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
                border: '1px solid #e0e7ff', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(90, 93, 240, 0.2)',
                opacity: isPriceOpen ? 1 : 0, visibility: isPriceOpen ? 'visible' : 'hidden',
                transform: isPriceOpen ? 'translateY(0) scale(1)' : 'translateY(-15px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 30, overflow: 'hidden'
              }}>
                {[
                  { val: "", label: "Tất cả mức giá" },
                  { val: "under-2m", label: "Dưới 2.000.000đ" },
                  { val: "2m-10m", label: "Từ 2 - 10 triệu" },
                  { val: "10m-20m", label: "Từ 10 - 20 triệu" },
                  { val: "above-20m", label: "Trên 20 triệu" }
                ].map(item => (
                  <div key={item.val} onClick={() => { setSelectedPriceRange(item.val); setIsPriceOpen(false); }}
                    style={{ padding: '12px 15px', cursor: 'pointer', fontSize: '14px', color: selectedPriceRange === item.val ? '#4338ca' : '#334155', fontWeight: selectedPriceRange === item.val ? 'bold' : 'normal', background: selectedPriceRange === item.val ? '#e0e7ff' : 'transparent', borderBottom: item.val === "" ? '1px solid #f1f5f9' : 'none', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              let image = "https://placehold.co/200x200?text=No+Image"; 
              const imageObj = product.product_images?.[0];
              if (imageObj) {
                const imgUrl = imageObj.image_url || imageObj.image_path; 
                if (imgUrl) image = imgUrl.startsWith("http") ? imgUrl : `http://localhost:8000/storage/${imgUrl}`;
              }

              let totalStock = product.skus?.length > 0 ? product.skus.reduce((sum, sku) => sum + Number(sku.stock), 0) : Number(product.stock || 0);
              const isOutOfStock = totalStock <= 0;

              let priceDisplay = `${Number(product.base_price || 0).toLocaleString()}đ`;
              if (!isOutOfStock && product.skus?.length > 0) {
                const prices = product.skus.map(sku => Number(sku.price));
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                priceDisplay = minPrice !== maxPrice ? `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ` : `${minPrice.toLocaleString()}đ`;
              }
              if (isOutOfStock) priceDisplay = "Hết hàng";

              return (
                <div key={product.id} onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    background: "white", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.04)", transition: "all 0.3s ease",
                    overflow: 'hidden', position: 'relative', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', opacity: isOutOfStock ? 0.75 : 1
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
                  <div className="product-img-wrapper" style={{ overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                    <img className="product-img" src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: 'transform 0.5s ease', filter: isOutOfStock ? 'grayscale(80%)' : 'none' }} />
                  </div>
                  <div style={{ padding: "12px", flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: "14px", marginBottom: "8px", color: '#1e293b', fontWeight: '500', lineHeight: '1.4', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap', gap: '5px' }}>
                      <p style={{ color: isOutOfStock ? "#64748b" : "#ee4d2d", fontWeight: "700", fontSize: "15px", margin: 0 }}>{priceDisplay}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{isOutOfStock ? "Tạm ngưng" : `Đã bán ${product.sold_count || 0}`}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
              <h3 style={{ color: '#475569', margin: 0 }}>Không tìm thấy sản phẩm nào!</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}