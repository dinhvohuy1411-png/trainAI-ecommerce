import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

function AdminShopsPage() {
  const [shops, setShops] = useState([]);

  const fetchShops = () => {
    axiosClient.get("/admin/shops").then((res) => setShops(res.data));
  };
  useEffect(() => {
    fetchShops();
  }, []);

  const approveShop = (id) => {
    axiosClient.put(`/admin/shops/${id}/approve`).then(() => {
      fetchShops(); // reload lại danh sách
    });
  };

  return (
    <div>
      <h2>Quản lý Shop (Admin)</h2>

      {shops.length === 0 && <p>Không có shop chờ duyệt</p>}

      {shops.map((shop) => (
        <div
          key={shop.id}
          style={{ border: "1px solid #ccc", padding: 10, margin: 10 }}
        >
          <h3>{shop.name}</h3>
          <button onClick={() => approveShop(shop.id)}>Duyệt</button>
        </div>
      ))}
    </div>
  );
}

export default AdminShopsPage;
