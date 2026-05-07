import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const generateReceiptImages = (transactions) => {
  const withReceipts = transactions.filter((t) => t.receipt_uri);
  if (withReceipts.length === 0) return '';

  const receiptCards = withReceipts
    .map(
      (t) => `
      <div class="receipt-card">
        <img src="${t.receipt_uri}" alt="Fiş" />
        <div class="receipt-info">
          <strong>${formatDate(t.date)}</strong>
          <span>${t.description || t.category_name || ''}</span>
          <span class="receipt-amount">${formatCurrency(t.amount)} ₺</span>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="section">
      <h2>📎 Fiş / Makbuz Ekleri</h2>
      <div class="receipt-grid">
        ${receiptCards}
      </div>
    </div>
  `;
};

export const generateReportHTML = (transactions, options = {}) => {
  const {
    userName = 'Kullanıcı',
    startDate,
    endDate,
    projectName = 'Tüm Projeler',
    netBalance = 0,
  } = options;

  // Filter transactions based on user rules
  // Rule: Exclude Personal categories IF paid from Personal wallets
  const filteredTransactions = transactions.filter(t => {
    if (t.is_offset_transaction) return true; // Keep offsets
    if (t.is_income) return true; // Keep income (advances) for balance consistency
    
    // Rule: If it was paid from a COMPANY wallet, it MUST be in the report
    // even if it's a personal category (because it creates debt)
    if (t.wallet_owner === 'Company') return true;

    // Rule: Exclude Personal categories IF paid from Personal wallets (private)
    if (t.category_type === 'Personal' && t.wallet_owner === 'Personal') return false;
    
    return true;
  });

  // Calculate summaries
  const companyExpenses = filteredTransactions
    .filter((t) => t.category_type === 'Company' && !t.is_offset_transaction && !t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExpenses = filteredTransactions
    .filter((t) => t.category_type === 'Personal' && !t.is_offset_transaction && !t.is_income)
    .reduce((sum, t) => sum + t.amount, 0);

  const receivedAdvances = filteredTransactions
    .filter((t) => t.is_income && t.wallet_owner === 'Personal')
    .reduce((sum, t) => sum + t.amount, 0);

  const offsetTotal = filteredTransactions
    .filter((t) => t.is_offset_transaction)
    .reduce((sum, t) => {
      // In report, show net offset effect
      if (t.is_virtual) return sum - t.amount; // Salary cut reduces debt (shown as negative deduction)
      return sum + t.amount; // Physical payment reduces credit (shown as positive payment)
    }, 0);

  const balanceLabel =
    netBalance >= 0
      ? `Şirket size borçlu: ${formatCurrency(netBalance)} ₺`
      : `Siz şirkete borçlusunuz: ${formatCurrency(Math.abs(netBalance))} ₺`;

  const balanceColor = netBalance >= 0 ? '#10B981' : '#EF4444';

  const dateRangeText =
    startDate && endDate
      ? `${formatDate(startDate)} — ${formatDate(endDate)}`
      : 'Tüm Zamanlar';

  // Transaction rows
  const transactionRows = filteredTransactions
    .filter((t) => !t.is_offset_transaction)
    .map(
      (t) => {
        let badgeClass = t.category_type === 'Company' ? 'badge-company' : 'badge-personal';
        let categoryName = t.category_name || '-';
        let amountStyle = '';

        if (t.is_income) {
          badgeClass = 'badge-income';
          categoryName = 'Para Girişi / Avans';
          amountStyle = 'color: #10B981';
        }

        return `
          <tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="badge ${badgeClass}">${categoryName}</span></td>
            <td>${t.project_name || t.city || '-'}</td>
            <td>${t.description || '-'}</td>
            <td>${t.wallet_name || '-'}</td>
            <td class="amount" style="${amountStyle}">${t.is_income ? '+' : ''}${formatCurrency(t.amount)} ₺</td>
          </tr>
        `;
      }
    )
    .join('');

  const offsetRows = filteredTransactions
    .filter((t) => t.is_offset_transaction)
    .map(
      (t) => `
      <tr class="offset-row">
        <td>${formatDate(t.date)}</td>
        <td><span class="badge badge-offset">${t.is_virtual ? 'Maaş Kesintisi' : 'Nakit Ödeme'}</span></td>
        <td>${t.project_name || t.city || '-'}</td>
        <td>${t.description || 'Hesap Kapatma'}</td>
        <td>${t.wallet_name || '-'}</td>
        <td class="amount offset-amount">${t.is_virtual ? '-' : ''}${formatCurrency(t.amount)} ₺</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Harcama Raporu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1E293B;
          background: #fff;
          padding: 40px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 3px solid #8B5CF6;
        }
        .header h1 {
          font-size: 24px;
          color: #0F172A;
          margin-bottom: 8px;
        }
        .header-meta {
          color: #64748B;
          font-size: 13px;
        }
        .header-meta span {
          margin: 0 12px;
        }
        .summary-grid {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }
        .summary-card {
          flex: 1;
          background: #F8FAFC;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid #E2E8F0;
        }
        .summary-card.net {
          background: ${balanceColor}15;
          border-color: ${balanceColor};
        }
        .summary-card .label {
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .summary-card .value {
          font-size: 22px;
          font-weight: bold;
          color: #0F172A;
        }
        .summary-card.net .value {
          color: ${balanceColor};
        }
        .section { margin-bottom: 28px; }
        .section h2 {
          font-size: 16px;
          color: #0F172A;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #E2E8F0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th {
          background: #0F172A;
          color: #fff;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid #E2E8F0;
        }
        tr:nth-child(even) { background: #F8FAFC; }
        .amount { text-align: right; font-weight: 600; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge-company { background: #3B82F620; color: #3B82F6; }
        .badge-personal { background: #EC489920; color: #EC4899; }
        .badge-income { background: #10B98120; color: #10B981; }
        .badge-offset { background: #F59E0B20; color: #F59E0B; }
        .offset-row { background: #FFFBEB !important; }
        .offset-amount { color: #F59E0B; font-weight: bold; }
        .receipt-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .receipt-card {
          width: 200px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
        }
        .receipt-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .receipt-info {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 10px;
        }
        .receipt-amount { color: #8B5CF6; font-weight: bold; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #94A3B8;
          font-size: 10px;
          border-top: 1px solid #E2E8F0;
          padding-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Harcama Raporu</h1>
        <div class="header-meta">
          <span>👤 ${userName}</span>
          <span>📅 ${dateRangeText}</span>
          <span>🏗️ ${projectName}</span>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Şantiye Harcamaları</div>
          <div class="value">${formatCurrency(companyExpenses)} ₺</div>
        </div>
        <div class="summary-card">
          <div class="label">Şirket Kaynaklı Şahsi</div>
          <div class="value">${formatCurrency(personalExpenses)} ₺</div>
        </div>
        <div class="summary-card">
          <div class="label">Mahsuplaşmalar</div>
          <div class="value">${formatCurrency(offsetTotal)} ₺</div>
        </div>
        <div class="summary-card net">
          <div class="label">Net Bakiye</div>
          <div class="value">${balanceLabel}</div>
        </div>
      </div>

      <div class="section">
        <h2>📋 İşlem Detayları</h2>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Kategori</th>
              <th>Proje / Şehir</th>
              <th>Açıklama</th>
              <th>Cüzdan</th>
              <th style="text-align:right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
            ${offsetRows}
          </tbody>
        </table>
      </div>

      ${generateReceiptImages(filteredTransactions)}

      <div class="footer">
        Harcama Takip Uygulaması — Rapor oluşturma tarihi: ${new Date().toLocaleDateString('tr-TR')}
      </div>
    </body>
    </html>
  `;
};

export const generateAndSharePDF = async (transactions, options = {}) => {
  try {
    const html = generateReportHTML(transactions, options);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Move file to a permanent location
    const reportsDir = FileSystem.documentDirectory + 'reports/';
    const dirInfo = await FileSystem.getInfoAsync(reportsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
    }

    const timestamp = new Date().getTime();
    const fileName = `rapor_${timestamp}.pdf`;
    const permanentUri = reportsDir + fileName;

    await FileSystem.moveAsync({
      from: uri,
      to: permanentUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(permanentUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Harcama Raporu',
        UTI: 'com.adobe.pdf',
      });
    }

    return permanentUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
