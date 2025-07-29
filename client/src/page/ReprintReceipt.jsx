import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listreprintReceipt } from '../function/auth';

const ReprintReceipt = () => {
  const [reprintData, setReprintData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchReprintData();
  }, []);

  const fetchReprintData = async () => {
    try {
      const res = await listreprintReceipt();
      setReprintData(res.data);
    } catch (err) {
      console.error("Error fetching reprint data", err);
    }
  };

  const filteredData = reprintData.filter(item =>
    (item.receiptNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="reprint-receipt-container" style={{ padding: "20px", fontFamily: 'Noto Sans Thai, sans-serif' }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>รายการการรีปริ๊นใบเสร็จ</h1>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="ค้นหาเลขใบเสร็จ..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ padding: "10px", width: "300px", fontSize: "16px" }}
        />
      </div>

      <table border="1" width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>เลขใบเสร็จ</th>
            <th>วันที่รีปริ๊น</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => (
            <tr key={item._id}>
              <td>{indexOfFirstItem + index + 1}</td>
              <td>{item.receiptNumber}</td>
              <td>{new Date(item.reprintAt).toLocaleString('th-TH')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <button onClick={handlePrevPage} disabled={currentPage === 1}>ก่อนหน้า</button>
        <span>หน้า {currentPage} จาก {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>ถัดไป</button>
      </div>
    </div>
  );
};

export default ReprintReceipt;
