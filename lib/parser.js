export function parsePersianInvoice(text) {
  // تبدیل اعداد فارسی به انگلیسی
  const persianNumbers = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const englishNumbers = ['0','1','2','3','4','5','6','7','8','9'];
  let normalized = text;
  for(let i=0;i<10;i++){
    normalized = normalized.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
  }

  // regex های ساده برای شماره فاکتور، تاریخ، مبلغ و مالیات
  const invoice_number = (normalized.match(/شماره\s*فاکتور\s*[:\-]?\s*(\d+)/i)||[null,null])[1];
  const issue_date = (normalized.match(/تاریخ\s*[:\-]?\s*([\d/]+)/i)||[null,null])[1];
  const total_amount = (normalized.match(/جمع\s*[:\-]?\s*(\d+)/i)||[null,null])[1];
  const tax_amount = (normalized.match(/مالیات\s*[:\-]?\s*(\d+)/i)||[null,null])[1];

  return {invoice_number, issue_date, total_amount, tax_amount};
}
export default parsePersianInvoice;