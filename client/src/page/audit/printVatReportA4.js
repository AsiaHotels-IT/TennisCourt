export function printVatReportA4({
  saleDate,
  reportRows = [],
}) {
  // คำนวณรวมยอด
  const sumBeforeVat = reportRows.reduce((sum, r) => sum + Number(r.beforeVat || 0), 0);
  const sumVat = reportRows.reduce((sum, r) => sum + Number(r.vat || 0), 0);
  const sumTotal = reportRows.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const printWindow = window.open('', '', 'width=900,height=1200');
  printWindow.document.write(`
    <html>
      <head>
        <title>รายงานภาษีขาย</title>
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
          <div style="text-align:center;margin-bottom:12px;">
            <div style="font-weight:700;font-size:20px;">บริษัท เอเชียโฮเต็ล จำกัด (มหาชน)</div>
            <div style="font-weight:700;font-size:18px;">รายงานภาษีขาย</div>
            <div style="font-weight:400;font-size:16px;">เดือนภาษี ${(() => {
              const thMonths = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
              ];
              return thMonths[new Date().getMonth()];
            })()} ปี ${new Date().getFullYear() + 543}</div>
            
          </div>
          <div style="margin-top: 30px; text-align: left;">
            <div style="margin-top:8px;font-size:15px;">ชื่อผู้ประกอบการ บริษัท เอเชียโฮเต็ล จำกัด (มหาชน)</div>
            <div style="margin-top:8px;font-size:15px;">ที่อยู่สถานประกอบการ 296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพฯ 10400</div>
            <div style="margin-top:8px;margin-bottom:10px;font-size:15px;">เลขประจำตัวผู้เสียภาษี 0107535000346</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>วันที่</th>
                <th>เลขที่ใบกำกับภาษี</th>
                <th>ชื่อลูกค้า</th>
                <th>เลขประจำตัวผู้เสีย</th>
                <th>สาขา</th>
                <th>มูลค่าก่อนภาษี</th>
                <th>ภาษีมูลค่าเพิ่ม</th>
                <th>รวมทั้งสิ้น</th>
              </tr>
            </thead>
            <tbody>
              ${
                reportRows.map(row => `
                  <tr>
                    <td style="text-align: right;">${row.idx}</td>
                    <td style="text-align: right;">${row.reservDate || ''}</td>
                    <td style="text-align: left;">${row.receiptNumber || ''}</td>
                    <td>${row.cusName || ''}</td>
                    <td style="text-align: right;">${''}</td>
                    <td style="text-align: right;">${row.branch || ''}</td>
                    <td style="text-align: right;">${row.beforeVat || ''}</td>
                    <td style="text-align: right;">${row.vat || ''}</td>
                    <td style="text-align: right;">${row.total || ''}</td>
                  </tr>
                `).join('')
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="text-align: right; font-weight: bold; padding-right: 8px; border: 1px solid #bbb;">รวมทั้งสิ้น</td>
                <td class="amount-cell">${sumBeforeVat.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="amount-cell">${sumVat.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="amount-cell">${sumTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              </tr>
            </tfoot>
          </table>
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