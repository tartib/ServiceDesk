export const ErrorMessages = {
  // 400 Bad Request
  INVALID_EMAIL: {
    field: 'email',
    message: 'البريد الإلكتروني يجب أن يكون بصيغة صحيحة (example@domain.com)',
  },
  INVALID_PASSWORD: {
    field: 'password',
    message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على أحرف وأرقام',
  },
  REQUIRED_FIELD: (field: string) => ({
    field,
    message: `${field} مطلوب ولا يمكن أن يكون فارغاً`,
  }),
  INVALID_VALUE: (field: string, validValues: string[]) => ({
    field,
    message: `${field} يجب أن يكون: ${validValues.join(', ')}`,
  }),
  INVALID_DATE: {
    field: 'date',
    message: 'التاريخ يجب أن يكون بصيغة صحيحة (YYYY-MM-DD)',
  },
  INVALID_NUMBER: (field: string) => ({
    field,
    message: `${field} يجب أن يكون رقماً صحيحاً`,
  }),
  STRING_TOO_LONG: (field: string, maxLength: number) => ({
    field,
    message: `${field} يجب أن لا يتجاوز ${maxLength} أحرف`,
  }),
  STRING_TOO_SHORT: (field: string, minLength: number) => ({
    field,
    message: `${field} يجب أن يكون ${minLength} أحرف على الأقل`,
  }),

  // 401 Unauthorized
  UNAUTHORIZED: 'يجب تسجيل الدخول أولاً',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  TOKEN_EXPIRED: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً',
  INVALID_TOKEN: 'رمز الجلسة غير صحيح',

  // 403 Forbidden
  FORBIDDEN: 'ليس لديك صلاحية للقيام بهذا الإجراء',
  INSUFFICIENT_PERMISSIONS: 'صلاحياتك غير كافية للقيام بهذا الإجراء',
  ADMIN_ONLY: 'هذا الإجراء متاح للمسؤولين فقط',
  MANAGER_ONLY: 'هذا الإجراء متاح للمديرين فقط',

  // 404 Not Found
  NOT_FOUND: (resource: string) => `${resource} غير موجود`,
  INCIDENT_NOT_FOUND: 'الحادثة غير موجودة',
  PROJECT_NOT_FOUND: 'المشروع غير موجود',
  USER_NOT_FOUND: 'المستخدم غير موجود',
  TASK_NOT_FOUND: 'المهمة غير موجودة',

  // 409 Conflict
  DUPLICATE_EMAIL: 'البريد الإلكتروني مستخدم بالفعل',
  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    `لا يمكن تغيير الحالة من '${from}' إلى '${to}'`,
  RESOURCE_ALREADY_EXISTS: (resource: string) => `${resource} موجود بالفعل`,
  CONFLICT: 'حدث تضارب في البيانات',

  // 500 Server Error
  INTERNAL_SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً',
  DATABASE_ERROR: 'حدث خطأ في قاعدة البيانات',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
};

export const SuccessMessages = {
  CREATED: (resource: string) => `تم إنشاء ${resource} بنجاح`,
  UPDATED: (resource: string) => `تم تحديث ${resource} بنجاح`,
  DELETED: (resource: string) => `تم حذف ${resource} بنجاح`,
  FETCHED: (resource: string) => `تم جلب ${resource} بنجاح`,
  ASSIGNED: (resource: string) => `تم تعيين ${resource} بنجاح`,
  STATUS_CHANGED: 'تم تحديث الحالة بنجاح',
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
  PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
  PROFILE_UPDATED: 'تم تحديث الملف الشخصي بنجاح',
};
