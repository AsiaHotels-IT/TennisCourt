export function printSaleReportA4({
  saleDate,
  periodMorning = "7.00-18.00  &nbsp;&nbsp;&nbsp;&nbsp; 450/ชม.",
  periodEvening = "18.00-22.00 &nbsp;&nbsp; 600/ชม.",
  reportRows = [],
  totalBookingAmount = 0,
  totalCash = 0,
  totalTransfer = 0,
  totalCard = 0,
  cashSummaryRows = [
    { denom: '1,000', qty: '', total: '' },
    { denom: '500', qty: '', total: '' },
    { denom: '100', qty: '', total: '' },
    { denom: '50', qty: '', total: '' },
    { denom: '20', qty: '', total: '' },
    { denom: '10', qty: '', total: '' },
  ],
  cashTotalSum = 0   // <--- เพิ่มตรงนี้
}) {
  const printWindow = window.open('', '', 'width=900,height=1200');
  printWindow.document.write(`
    <html>
      <head>
        <title>รายงานการขาย เทนนิส</title>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
          }
          body {
            font-family: 'Tahoma', 'Sarabun', 'Prompt', sans-serif;
            font-size: 16px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .a4-report {
            width: 210mm;
            min-height: 297mm;
            margin: auto;
            background: #fff;
            color: #000;
            box-sizing: border-box;
            padding: 32px 24px;
          }
          h2 {
            margin: 0;
            font-size: 15pt;
            font-weight: 700;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4mm;
          }
          .header-info {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin-bottom: 8px;
            gap: 0;
            font-size: 14px;
          }
          .header-info span {
            font-size: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 10px; /* ลดขนาดฟ้อนตาราง */
          }
          th, td {
            border: 1px solid #bbb;
            padding: 5px 3px;
            font-size: 10px; /* ลดขนาดฟ้อนใน cell */
          }
          th {
            background: #f3f3f3;
            font-weight: bold;
          }
          tfoot td {
            background: #f7f5ee;
            font-weight: bold;
          }
          .amount-cell {
            text-align: right;
            padding-right: 8px;
          }
          .highlight {
            background: #f7f0cd;
          }
          /* summary cash section */
          .summary-flex {
            display: flex;
            gap: 40px;
            margin-top: 30px;
          }
          .summary-cash {
            flex: 1;
          }
          .summary-cash-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 50%;
          }
          .summary-cash-title {
            font-weight: bold;
            margin-bottom: 6px;
          }
          .summary-cash-total {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
            border-top: 1px solid #000;
            border-bottom: 2px double #000;
          }
          .summary-cash-amount {
            font-weight: bold;
            background: #f7f0cd;
            padding: 2px 14px;
            border-radius: 2px;
          }
          .summary-cash-table {
            width: 50%;
            border-collapse: collapse;
          }
          .summary-cash-table th,
          .summary-cash-table td {
            border: 1px solid #bbb;
            font-size: 12px;
            padding: 5px 3px;
          }
          .summary-cash-table-total-label {
            text-align: center;
            font-weight: bold;
            border: 1px solid #bbb;
          }
          .summary-cash-table-total-cell {
            border: 1px solid #bbb;
            background: #f7f0cd;
            text-align: center;
            font-weight: bold;
          }
          .summary-sign {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          .sign-inner {
            margin-top: 30px;
            margin-bottom: 18px;
          }
          .sign-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 50%;
          }
          .sign-bottom {
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="a4-report">
          <div class="header-row">
            <h2>รายงานการขายเทนนิส ประจำวันที่</h2>
            <span style="font-size: 14px;">${saleDate || '-'}</span>
            <div class="header-info">
              <span>${periodMorning}</span>
              <span style="background: #dcedc8;">${periodEvening}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>วันที่ใบเสร็จ</th>
                <th>เลขที่ใบเสร็จ</th>
                <th>ชื่อลูกค้า</th>
                <th>เบอร์โทร</th>
                <th>เลขใบจอง</th>
                <th>วันที่จอง</th>
                <th>เวลาจอง</th>
                <th>ชั่วโมงจอง</th>
                <th>จำนวนเงิน</th>
                <th>เงินสด</th>
                <th>เงินโอน</th>
                <th>เครดิตการ์ด</th>
              </tr>
            </thead>
            <tbody>
              ${
                reportRows.map(row => {
                  // ไฮไลท์ช่วงเย็น
                  let highlight = '';
                  if (row.time && row.time.includes('-')) {
                    const [start] = row.time.split('-');
                    if (start && start.includes(':')) {
                      const [h, m] = start.split(':').map(Number);
                      if (h > 18 || (h === 18 && m > 0)) highlight = ' style="background:#dcedc8;"';
                    } else if (start) {
                      const h = Number(start);
                      if (h > 18) highlight = ' style="background:#dcedc8;"';
                    }
                  }
                
                  // คำนวณชั่วโมง
                  let hourText = '-';
                  if (row.hour) {
                    hourText = row.hour % 1 === 0 ? row.hour : Number(row.hour).toFixed(2);
                  } else if (row.time && row.time.includes('-')) {
                    const [start, end] = row.time.split('-');
                    if (start && end) {
                      let startH = 0, startM = 0, endH = 0, endM = 0;
                      if (start.includes(':')) {
                        [startH, startM] = start.split(':').map(Number);
                      } else {
                        startH = Number(start); startM = 0;
                      }
                      if (end.includes(':')) {
                        [endH, endM] = end.split(':').map(Number);
                      } else {
                        endH = Number(end); endM = 0;
                      }
                      let hours = (endH + endM/60) - (startH + startM/60);
                      if (hours < 0) hours = 0;
                      hourText = hours % 1 === 0 ? hours : hours.toFixed(2);
                    }
                  }
                
                  return `
                    <tr>
                      <td style="text-align: right;">${row.idx}</td>
                      <td style="text-align: right;">${row.reservDate || ''}</td>
                      <td style="text-align: right;">${row.receiptNumber || ''}</td>
                      <td>${row.cusName || ''}</td>
                      <td style="text-align: right;">${row.cusTel || ''}</td>
                      <td style="text-align: right;">${row.reservID || ''}</td>
                      <td style="text-align: right;">${row.reservDate || ''}</td>
                      <td style="text-align: right;"${highlight}>${row.time && row.time !== '-' ? row.time : '-'}</td>
                      <td style="text-align: right;">${hourText}</td>
                      <td class="amount-cell">${row.price ? Number(row.price).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                      <td class="amount-cell">${row.cash ? Number(row.cash).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                      <td class="amount-cell">${row.transfer ? Number(row.transfer).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                      <td class="amount-cell">${row.card ? Number(row.card).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="9" style="text-align: right; font-weight: bold; padding-right: 8px; border: 1px solid #bbb;">รวมทั้งสิ้น</td>
                <td class="amount-cell">${Number(totalBookingAmount).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="amount-cell">${totalCash ? Number(totalCash).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                <td class="amount-cell">${totalTransfer ? Number(totalTransfer).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
                <td class="amount-cell">${totalCard ? Number(totalCard).toLocaleString(undefined,{minimumFractionDigits:2}) : ""}</td>
              </tr>
            </tfoot>
          </table>
          <div class="summary-flex">
            <div class="summary-cash">
              <div class="summary-cash-row">
                <div class="summary-cash-title">สรุปการนำส่งเงินสด</div>
                <div class="summary-cash-total">
                  <span class="summary-cash-amount">
                    ${Number(totalCash).toLocaleString(undefined, {minimumFractionDigits:2})}
                  </span>
                </div>
              </div>
              <table class="summary-cash-table">
                <thead>
                  <tr>
                    <th>แบงค์/เหรียญ</th>
                    <th>จำนวน</th>
                    <th>รวมเป็นเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    cashSummaryRows.map((row, i) => `
                      <tr>
                        <td style="text-align: center;">${row.denom}</td>
                        <td style="text-align: center;">${row.qty}</td>
                        <td style="text-align: center;">${row.total}</td>
                      </tr>
                    `).join('')
                  }
                  <tr>
                    <td colspan="2" class="summary-cash-table-total-label">รวมเงินสดที่นำส่ง</td>
                    <td class="summary-cash-table-total-cell">${Number(cashTotalSum).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="summary-sign">
            <div class="sign-inner">
              <div class="sign-row">
                <span>ลงชื่อผู้นำส่งเงิน</span>
                <span>________________________</span>
              </div>
              <div class="sign-row sign-bottom">
                <span>ลงชื่อผู้รับเงิน</span>
                <span>________________________</span>
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function () {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 100);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}