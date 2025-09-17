// utils/phone.js
// الفكرة: نخزن الرقم في DB كأرقام فقط مع كود الدولة (بدون +).
// مثال: "+963944123456" -> "963944123456"
// مثال: "00963944123456" -> "963944123456"
// مثال: "905551112233" -> "905551112233"

function normalizePhoneToDigits(raw) {
  if (!raw) return raw;

  // نحذف كل الرموز غير الأرقام
  let digits = String(raw).replace(/\D/g, "");

  // إذا بلش بـ 00 (مثال 00963...) نشيل أول صفرين
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  return digits; // مثال: "963944123456" أو "905551112233"
}

// لإضافة + عند الحاجة لإرسال الرقم لخدمات خارجية
function toE164(digitsOnly) {
  if (!digitsOnly) return digitsOnly;
  const clean = String(digitsOnly).replace(/\D/g, "");
  return `+${clean}`;
}

module.exports = { normalizePhoneToDigits, toE164 };
