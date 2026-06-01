const VALID_QR_TYPES = new Set([
  'mess-attendance',
  'mess-billing',
  'mess-entrance',
  'mess-gate',
  'mess-snack',
  'mess-breakfast',
  'mess-lunch',
  'mess-dinner',
]);

const MEAL_FROM_TYPE = {
  'mess-breakfast': 'breakfast',
  'mess-lunch': 'lunch',
  'mess-dinner': 'dinner',
  'mess-snack': 'snacks',
  'mess-attendance': 'general',
  'mess-entrance': 'entrance',
  'mess-gate': 'gate',
};

const parsePayload = (raw) => {
  if (!raw) return { valid: false, error: 'Empty QR payload' };
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { valid: false, error: 'Invalid JSON in QR payload' };
    }
  }
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'QR payload must be an object' };
  }
  return { valid: true, data };
};

const extractToken = (data) => {
  if (data.token) return String(data.token);
  if (data.studentId && data.date) return `${data.studentId}:${data.date}:${data.type || 'generic'}`;
  return null;
};

const validateQrPayload = (raw, options = {}) => {
  const parsed = parsePayload(raw);
  if (!parsed.valid) return parsed;

  const { data } = parsed;
  const qrType = data.type;

  if (!qrType || !VALID_QR_TYPES.has(qrType)) {
    return { valid: false, error: `Unsupported QR type: ${qrType || 'missing'}` };
  }

  const token = extractToken(data);
  if (!token && qrType !== 'mess-billing') {
    return { valid: false, error: 'Missing student token in QR' };
  }

  if (qrType === 'mess-billing') {
    if (!data.studentId || !Array.isArray(data.items)) {
      return { valid: false, error: 'Billing QR requires studentId and items[]' };
    }
    return {
      valid: true,
      category: 'billing',
      qrType,
      token: extractToken(data),
      payload: data,
      action: 'process_billing',
    };
  }

  const mealType = data.mealType || MEAL_FROM_TYPE[qrType] || 'general';
  const studentId = data.studentId;
  const date = data.date || new Date().toISOString().slice(0, 10);

  if (!studentId) {
    return { valid: false, error: 'Attendance QR requires studentId' };
  }

  if (options.expectedDate && date !== options.expectedDate) {
    return { valid: false, error: 'QR date does not match expected service date' };
  }

  return {
    valid: true,
    category: 'attendance',
    qrType,
    token,
    mealType: mealType === 'general' ? inferMealFromTime() : mealType,
    payload: data,
    action: 'mark_meal_attendance',
    studentId,
    date,
  };
};

const inferMealFromTime = () => {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snacks';
  return 'dinner';
};

module.exports = { validateQrPayload, VALID_QR_TYPES, MEAL_FROM_TYPE };
