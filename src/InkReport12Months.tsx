<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รายงานรายรับ-รายจ่ายหมึก 12 เดือน</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', 'Sarabun', Tahoma, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .controls {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-back {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
        }

        .btn-back:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
        }

        .btn-export {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }

        .btn-export:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-details {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
        }

        .btn-details:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 3px solid rgba(255, 255, 255, 0.2);
        }

        .tab-btn {
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 14px;
        }

        .tab-btn.active {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid;
            transition: all 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .card.income {
            border-left-color: #10b981;
        }

        .card.expense {
            border-left-color: #ef4444;
        }

        .card.net {
            border-left-color: #3b82f6;
        }

        .card-label {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .card-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .card.income .card-value {
            color: #10b981;
        }

        .card.expense .card-value {
            color: #ef4444;
        }

        .card.net .card-value {
            color: #3b82f6;
        }

        .card-month {
            font-size: 12px;
            color: #9ca3af;
        }

        .table-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
        }

        th {
            padding: 18px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 16px 18px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }

        tbody tr {
            transition: all 0.2s ease;
        }

        tbody tr:hover {
            background-color: #f9fafb;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .amount {
            font-weight: 600;
            text-align: right;
        }

        .income-amount {
            color: #10b981;
        }

        .expense-amount {
            color: #ef4444;
        }

        .net-amount {
            color: #3b82f6;
        }

        .type-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
        }

        .type-income {
            background-color: #dcfce7;
            color: #15803d;
        }

        .type-expense {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .total-row {
            background: linear-gradient(135deg, #f0f9ff 0%, #f3f4f6 100%);
            font-weight: bold;
        }

        .total-row td {
            border-top: 3px solid #3b82f6;
            border-bottom: 3px solid #3b82f6;
            padding-top: 12px;
            padding-bottom: 12px;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-size: 16px;
        }

        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }

        .month-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }

        @media (max-width: 768px) {
            .month-row {
                grid-template-columns: 1fr 1fr;
            }

            .header h1 {
                font-size: 24px;
            }

            .card {
                padding: 20px;
            }

            .card-value {
                font-size: 22px;
            }

            table {
                font-size: 12px;
            }

            th, td {
                padding: 12px;
            }
        }

        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 30px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 รายงานรายรับ-รายจ่ายหมึก 12 เดือน</h1>
            <p>ข้อมูลย้อนหลัง 12 เดือน | Ink Income & Expense Report</p>
        </div>

        <div class="controls">
            <button class="btn btn-back" onclick="window.location.href='./index.html'">⬅️ กลับ Dashboard</button>
            <button class="btn btn-export" onclick="exportToExcel()">📥 Export Excel (.xlsx)</button>
            <button class="btn btn-details" onclick="downloadDetailedExcel()">📋 Export รายละเอียด</button>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('summary')">📈 สรุป 12 เดือน</button>
            <button class="tab-btn" onclick="switchTab('detailed')">📝 รายละเอียด</button>
        </div>

        <!-- Summary Tab -->
        <div id="summary" class="tab-content active">
            <div class="chart-container">
                <h2 style="margin-bottom: 20px; color: #1f2937;">ข้อมูล 12 เดือน</h2>
                <div class="month-row" id="monthsGrid"></div>
            </div>

            <div class="summary-cards">
                <div class="card income">
                    <div class="card-label">รวมรายรับทั้งปี</div>
                    <div class="card-value" id="yearlyIncome">฿0</div>
                    <div class="card-month">ทั้ง 12 เดือน</div>
                </div>
                <div class="card expense">
                    <div class="card-label">รวมรายจ่ายทั้งปี</div>
                    <div class="card-value" id="yearlyExpense">฿0</div>
                    <div class="card-month">ทั้ง 12 เดือน</div>
                </div>
                <div class="card net">
                    <div class="card-label">ยอดสุทธิทั้งปี</div>
                    <div class="card-value" id="yearlyNet">฿0</div>
                    <div class="card-month" id="netStatus">กำไร</div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>เดือน</th>
                            <th style="text-align: right;">รายรับ (฿)</th>
                            <th style="text-align: right;">รายจ่าย (฿)</th>
                            <th style="text-align: right;">ยอดสุทธิ (฿)</th>
                            <th style="text-align: center;">จำนวนรายการ</th>
                        </tr>
                    </thead>
                    <tbody id="summaryTable">
                        <tr><td colspan="5" class="no-data">กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Detailed Tab -->
        <div id="detailed" class="tab-content">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th>ประเภท</th>
                            <th>รายการ</th>
                            <th style="text-align: right;">จำนวนเงิน (฿)</th>
                            <th>หมวดหมู่</th>
                        </tr>
                    </thead>
                    <tbody id="detailedTable">
                        <tr><td colspan="5" class="no-data">กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            <p>© 2026 IT Asset Management System | ระบบบริหารจัดการทรัพย์สิน</p>
        </div>
    </div>

    <script>
        // Data from Supabase
        let transactions = [];

        // Fetch data from Supabase
        async function fetchTransactions() {
            try {
                const response = await fetch('https://your-supabase-url.supabase.co/rest/v1/ink_transactions', {
                    headers: {
                        'apikey': 'your-supabase-anon-key',
                        'Authorization': 'Bearer your-supabase-anon-key',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    transactions = data.map(t => ({
                        transaction_date: t.transaction_date,
                        transaction_type: t.transaction_type,
                        description: t.description,
                        amount: t.amount,
                        category: t.category,
                        month: t.transaction_date.slice(0, 7)
                    }));
                    renderSummary();
                    renderDetailed();
                } else {
                    console.error('Error fetching data:', response.status);
                    loadSampleData();
                }
            } catch (error) {
                console.error('Fetch error:', error);
                loadSampleData();
            }
        }

        function loadSampleData() {
            transactions = [
                { transaction_date: '2025-01-15', transaction_type: 'รายรับ', description: 'ขายหมึกเหลือ', amount: 5000, category: 'หมึกเหลือ', month: '2025-01' },
                { transaction_date: '2025-01-20', transaction_type: 'รายจ่าย', description: 'ซื้อหมึกใหม่', amount: 3500, category: 'ซื้อสต็อก', month: '2025-01' },
            ];
            renderSummary();
            renderDetailed();
        }

        function formatCurrency(num) {
            return new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 0
            }).format(num);
        }

        function getLast12Months() {
            const months = [];
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push(date.toISOString().slice(0, 7));
            }
            return months;
        }

        function calculateMonthlyData() {
            const last12Months = getLast12Months();
            const monthlyData = last12Months.map(month => {
                const monthTransactions = transactions.filter(t => t.month === month);
                const income = monthTransactions
                    .filter(t => t.transaction_type === 'รายรับ')
                    .reduce((sum, t) => sum + t.amount, 0);
                const expense = monthTransactions
                    .filter(t => t.transaction_type === 'รายจ่าย')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    month,
                    monthName: new Date(month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }),
                    income,
                    expense,
                    net: income - expense,
                    count: monthTransactions.length
                };
            });
            return monthlyData;
        }

        function renderSummary() {
            const monthlyData = calculateMonthlyData();
            const summaryTable = document.getElementById('summaryTable');
            
            let html = '';
            let totalIncome = 0;
            let totalExpense = 0;

            monthlyData.forEach(data => {
                totalIncome += data.income;
                totalExpense += data.expense;
                const netColor = data.net >= 0 ? 'net-amount' : 'expense-amount';
                html += `
                    <tr>
                        <td>${data.monthName}</td>
                        <td class="amount income-amount">${formatCurrency(data.income)}</td>
                        <td class="amount expense-amount">${formatCurrency(data.expense)}</td>
                        <td class="amount ${netColor}">${formatCurrency(data.net)}</td>
                        <td style="text-align: center;">${data.count}</td>
                    </tr>
                `;
            });

            const totalNet = totalIncome - totalExpense;
            const netColor = totalNet >= 0 ? 'net-amount' : 'expense-amount';
            html += `
                <tr class="total-row">
                    <td>รวมทั้งปี</td>
                    <td class="amount income-amount">${formatCurrency(totalIncome)}</td>
                    <td class="amount expense-amount">${formatCurrency(totalExpense)}</td>
                    <td class="amount ${netColor}">${formatCurrency(totalNet)}</td>
                    <td style="text-align: center;">${monthlyData.reduce((s, m) => s + m.count, 0)}</td>
                </tr>
            `;

            summaryTable.innerHTML = html;

            // Update summary cards
            document.getElementById('yearlyIncome').textContent = formatCurrency(totalIncome);
            document.getElementById('yearlyExpense').textContent = formatCurrency(totalExpense);
            document.getElementById('yearlyNet').textContent = formatCurrency(totalNet);
            document.getElementById('netStatus').textContent = totalNet >= 0 ? '💰 กำไร' : '⚠️ ขาดทุน';

            // Render months grid
            renderMonthsGrid(monthlyData);
        }

        function renderMonthsGrid(monthlyData) {
            const grid = document.getElementById('monthsGrid');
            let html = '';
            
            monthlyData.forEach(data => {
                const netColor = data.net >= 0 ? '#10b981' : '#ef4444';
                html += `
                    <div style="
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        border-left: 4px solid ${netColor};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    ">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${data.monthName}</div>
                        <div style="font-size: 18px; font-weight: bold; color: ${netColor}; margin-bottom: 8px;">
                            ${formatCurrency(Math.abs(data.net))}
                        </div>
                        <div style="font-size: 11px; color: #9ca3af;">
                            ➕ ${formatCurrency(data.income)} | ➖ ${formatCurrency(data.expense)}
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = html;
        }

        function renderDetailed() {
            const detailedTable = document.getElementById('detailedTable');
            
            const sorted = [...transactions].sort((a, b) => {
                const monthCompare = b.month.localeCompare(a.month);
                if (monthCompare !== 0) return monthCompare;
                const typeOrder = { 'รายรับ': 0, 'รายจ่าย': 1 };
                return (typeOrder[a.transaction_type] || 2) - (typeOrder[b.transaction_type] || 2);
            });

            let html = '';
            if (sorted.length === 0) {
                html = '<tr><td colspan="5" class="no-data">ยังไม่มีข้อมูล</td></tr>';
            } else {
                sorted.forEach(t => {
                    const date = new Date(t.transaction_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    const typeClass = t.transaction_type === 'รายรับ' ? 'type-income' : 'type-expense';
                    const amountClass = t.transaction_type === 'รายรับ' ? 'income-amount' : 'expense-amount';
                    
                    html += `
                        <tr>
                            <td>${date}</td>
                            <td><span class="type-badge ${typeClass}">${t.transaction_type}</span></td>
                            <td>${t.description}</td>
                            <td class="amount ${amountClass}">${formatCurrency(t.amount)}</td>
                            <td>${t.category || '-'}</td>
                        </tr>
                    `;
                });
            }

            detailedTable.innerHTML = html;
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        function exportToExcel() {
            try {
                const monthlyData = calculateMonthlyData();
                const summaryData = [
                    ['รายรับ-รายจ่ายหมึก 12 เดือน (Year Report)'],
                    [],
                    ['เดือน', 'รายรับ (฿)', 'รายจ่าย (฿)', 'ยอดสุทธิ (฿)', 'จำนวนรายการ'],
                    ...monthlyData.map(m => [
                        m.monthName,
                        m.income,
                        m.expense,
                        m.net,
                        m.count
                    ]),
                    [],
                    ['รวมทั้งปี',
                        monthlyData.reduce((s, m) => s + m.income, 0),
                        monthlyData.reduce((s, m) => s + m.expense, 0),
                        monthlyData.reduce((s, m) => s + m.net, 0),
                        monthlyData.reduce((s, m) => s + m.count, 0)
                    ]
                ];

                const ws = XLSX.utils.aoa_to_sheet(summaryData);
                ws['!cols'] = [
                    { wch: 20 },
                    { wch: 15 },
                    { wch: 15 },
                    { wch: 15 },
                    { wch: 12 }
                ];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'สรุป 12 เดือน');
                XLSX.writeFile(wb, `Ink_Transactions_${new Date().getFullYear()}_Summary.xlsx`);
                
                alert('✅ Export สำเร็จ');
            } catch (error) {
                console.error('Error:', error);
                alert('❌ เกิดข้อผิดพลาด');
            }
        }

        function downloadDetailedExcel() {
            try {
                const sorted = [...transactions].sort((a, b) => {
                    const monthCompare = b.month.localeCompare(a.month);
                    if (monthCompare !== 0) return monthCompare;
                    const typeOrder = { 'รายรับ': 0, 'รายจ่าย': 1 };
                    return (typeOrder[a.transaction_type] || 2) - (typeOrder[b.transaction_type] || 2);
                });

                const detailedData = [
                    ['รายละเอียดรายรับ-รายจ่ายหมึก'],
                    [],
                    ['วันที่', 'ประเภท', 'รายการ', 'จำนวนเงิน (฿)', 'หมวดหมู่']
                ];

                sorted.forEach(t => {
                    const date = new Date(t.transaction_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    detailedData.push([
                        date,
                        t.transaction_type,
                        t.description,
                        t.amount,
                        t.category || '-'
                    ]);
                });

                const ws = XLSX.utils.aoa_to_sheet(detailedData);
                ws['!cols'] = [
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 25 },
                    { wch: 15 },
                    { wch: 15 }
                ];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'รายละเอียด');
                XLSX.writeFile(wb, `Ink_Transactions_${new Date().getFullYear()}_Detailed.xlsx`);
                
                alert('✅ Export รายละเอียดสำเร็จ');
            } catch (error) {
                console.error('Error:', error);
                alert('❌ เกิดข้อผิดพลาด');
            }
        }

        // Initialize on load
        window.addEventListener('load', () => {
            fetchTransactions();
        });
    </script>
</body>
</html>
