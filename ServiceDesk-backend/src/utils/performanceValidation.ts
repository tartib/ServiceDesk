export const validatePerformanceData = (data: any) => {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  if (!data.employeeId) errors.push('employeeId is required');
  if (typeof data.employeeId !== 'string') errors.push('employeeId must be a string');
  if (!data.month || data.month < 1 || data.month > 12) errors.push('month must be between 1 and 12');
  if (typeof data.month !== 'number') errors.push('month must be a number');
  if (!data.year || data.year < 2020 || data.year > currentYear) {
    errors.push(`year must be between 2020 and ${currentYear}`);
  }
  if (typeof data.year !== 'number') errors.push('year must be a number');
  if (!Array.isArray(data.kpiScores) || data.kpiScores.length === 0) {
    errors.push('kpiScores must be a non-empty array');
  }

  return { valid: errors.length === 0, errors };
};

export const validateKPIScores = (kpiScores: any[]) => {
  const errors: string[] = [];

  if (!Array.isArray(kpiScores)) {
    errors.push('kpiScores must be an array');
    return { valid: false, errors };
  }

  kpiScores.forEach((score, index) => {
    if (!score.kpiId) errors.push(`kpiScores[${index}]: kpiId is required`);
    if (typeof score.value !== 'number') errors.push(`kpiScores[${index}]: value must be a number`);
    if (typeof score.weight !== 'number') errors.push(`kpiScores[${index}]: weight must be a number`);
    if (typeof score.value === 'number' && !isFinite(score.value)) {
      errors.push(`kpiScores[${index}]: value must be a finite number`);
    }
    if (typeof score.weight === 'number' && (score.weight < 0 || score.weight > 100)) {
      errors.push(`kpiScores[${index}]: weight must be between 0 and 100`);
    }
  });

  return { valid: errors.length === 0, errors };
};

export const validateKPIData = (data: any) => {
  const errors: string[] = [];

  if (!data.name) errors.push('name is required');
  if (!data.description) errors.push('description is required');
  if (!data.unit) errors.push('unit is required');
  if (data.weight === undefined || data.weight < 0 || data.weight > 100) {
    errors.push('weight must be between 0 and 100');
  }
  if (data.targetValue === undefined) errors.push('targetValue is required');
  if (data.minValue === undefined) errors.push('minValue is required');
  if (data.maxValue === undefined) errors.push('maxValue is required');
  if (data.minValue >= data.maxValue) errors.push('minValue must be less than maxValue');

  return { valid: errors.length === 0, errors };
};

export const validateEmployeeData = (data: any) => {
  const errors: string[] = [];

  if (!data.userId) errors.push('userId is required');
  if (!data.firstName) errors.push('firstName is required');
  if (!data.lastName) errors.push('lastName is required');
  if (!data.department) errors.push('department is required');
  if (!data.position) errors.push('position is required');
  if (!data.hireDate) errors.push('hireDate is required');

  return { valid: errors.length === 0, errors };
};

export const validateMonthYear = (month: string, year: string) => {
  const errors: string[] = [];
  const m = parseInt(month);
  const y = parseInt(year);

  if (isNaN(m) || m < 1 || m > 12) errors.push('month must be between 1 and 12');
  if (isNaN(y) || y < 2020) errors.push('year must be valid');

  return { valid: errors.length === 0, errors };
};
