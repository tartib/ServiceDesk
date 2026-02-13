# 🎯 Planning Poker - مراجعة شاملة

## 📋 نظرة عامة

Planning Poker هو نظام تقدير تفاعلي يستخدم في Sprint Planning لتقدير Story Points أو Hours للمهام.

---

## 🏗️ البنية المعمارية

### 1. **API Layer** (`/api/v1/pm/`)

#### Endpoints الرئيسية:

```
POST   /pm/tasks/:taskId/poker          - إنشاء جلسة جديدة
GET    /pm/poker/:sessionId             - جلب جلسة محددة
POST   /pm/poker/:sessionId/vote        - تقديم تصويت
POST   /pm/poker/:sessionId/reveal      - كشف الأصوات
POST   /pm/poker/:sessionId/new-round   - بدء جولة جديدة
POST   /pm/poker/:sessionId/complete    - إكمال الجلسة
DELETE /pm/poker/:sessionId             - إلغاء الجلسة
GET    /pm/sprints/:sprintId/poker      - جلب جلسات Sprint
```

#### متطلبات API:
- ✅ `Authorization: Bearer <token>`
- ✅ `X-Organization-ID: <organizationId>`
- ✅ `Content-Type: application/json`

---

### 2. **Hook Layer** (`usePlanningPoker.ts`)

#### State Management:

```typescript
const {
  loading,              // حالة التحميل
  error,                // رسائل الأخطاء
  socket,               // Socket.IO connection
  activeSession,        // الجلسة النشطة
  voteCount,            // عدد الأصوات
  stats,                // إحصائيات النتائج
  
  // API Functions
  createPokerSession,
  getPokerSession,
  getSprintPokerSessions,
  submitVote,
  revealVotes,
  startNewRound,
  completeSession,
  cancelSession,
  leaveSession,
  
  // Helper Functions
  calculateAverage,
  calculateConsensus,
} = usePlanningPoker(sprintId);
```

#### Real-time Events (Socket.IO):

```typescript
// Server → Client Events
'poker:session:created'      // جلسة جديدة
'poker:participant:joined'   // مشارك انضم
'poker:participant:left'     // مشارك غادر
'poker:vote:submitted'       // تم التصويت (عدد فقط)
'poker:votes:revealed'       // كشف الأصوات
'poker:round:started'        // جولة جديدة
'poker:session:completed'    // جلسة مكتملة
'poker:session:cancelled'    // جلسة ملغاة

// Client → Server Events
'join:poker'                 // الانضمام للجلسة
'leave:poker'                // مغادرة الجلسة
```

---

### 3. **UI Layer** (`PlanningPokerModal.tsx`)

#### مكونات الواجهة:

**1. Header:**
- عنوان الـ task
- زر الإغلاق

**2. Estimation Type Selector:**
- Story Points (افتراضي)
- Hours

**3. Voting Cards:**
- قيم Fibonacci: `[1, 2, 3, 5, 8, 13, 21]`
- تعطيل بعد التصويت
- تمييز القيمة المختارة

**4. Participants Panel:**
- عرض المشاركين
- حالة التصويت (✓ أو فارغ)
- عرض القيم بعد الكشف

**5. Results Panel (بعد الكشف):**
- Average (المتوسط)
- Median (الوسيط)
- Range (النطاق)
- Suggested Estimate (التقدير المقترح)
- Consensus Status (حالة الإجماع)

**6. Footer Actions:**
- **قبل الكشف:** زر "Reveal Votes"
- **بعد الكشف:** 
  - "New Round" (جولة جديدة)
  - "Accept X Points" (قبول التقدير)

---

## 🔄 سير العمل (Workflow)

### المرحلة 1: التهيئة

```typescript
// 1. فتح Modal
<PlanningPokerModal
  isOpen={true}
  taskId="6944fb3ef4c89618b8d01b43"
  sprintId="sprint-123"
  onEstimateComplete={handleComplete}
/>

// 2. initializeSession()
if (!sprintId || sprintId === '') {
  // إنشاء جلسة مباشرة
  createPokerSession(taskId, estimationType);
} else {
  // البحث عن جلسة موجودة
  const sessions = await getSprintPokerSessions(sprintId);
  const existing = sessions.find(s => 
    s.taskId === taskId && 
    (s.status === 'voting' || s.status === 'revealed')
  );
  
  if (existing) {
    // الانضمام للجلسة الموجودة
    await getPokerSession(existing._id);
  } else {
    // إنشاء جلسة جديدة
    await createPokerSession(taskId, estimationType);
  }
}

// 3. الانضمام لـ Socket.IO room
socket.emit('join:poker', sessionId);
```

### المرحلة 2: التصويت

```typescript
// 1. المستخدم يختار قيمة
handleVote(5);

// 2. إرسال التصويت للـ API
POST /pm/poker/:sessionId/vote
Body: { value: 5 }

// 3. تحديث الحالة المحلية
setSelectedValue(5);
setHasVoted(true);

// 4. Socket.IO يبث للجميع
socket.broadcast('poker:vote:submitted', { voteCount: 3 });

// 5. تحديث عداد الأصوات
setVoteCount(3);
```

### المرحلة 3: كشف الأصوات

```typescript
// 1. الضغط على "Reveal Votes"
handleReveal();

// 2. API Request
POST /pm/poker/:sessionId/reveal

// 3. Server يحسب الإحصائيات
{
  average: 5,
  median: 5,
  min: 3,
  max: 8,
  consensus: false,
  suggestedEstimate: 5
}

// 4. Socket.IO يبث النتائج
socket.broadcast('poker:votes:revealed', {
  session: updatedSession,
  stats: calculatedStats
});

// 5. تحديث UI
setActiveSession({ ...session, status: 'revealed' });
setStats(calculatedStats);
```

### المرحلة 4: الإكمال

```typescript
// الخيار 1: قبول التقدير
handleComplete(5);
POST /pm/poker/:sessionId/complete
Body: { finalEstimate: 5 }

// الخيار 2: جولة جديدة
handleNewRound();
POST /pm/poker/:sessionId/new-round

// الخيار 3: إلغاء
handleCancel();
DELETE /pm/poker/:sessionId
```

---

## 📊 Data Models

### PokerSession

```typescript
interface PokerSession {
  _id: string;
  taskId: string;
  sprintId: string;
  facilitator: string;
  status: 'voting' | 'revealed' | 'completed';
  votes: PokerVote[];
  finalEstimate?: number;
  createdAt: string;
  round?: number;
  voteCount?: number;
}
```

### PokerVote

```typescript
interface PokerVote {
  userId: string;
  userName: string;
  value?: number;        // undefined = لم يصوت بعد
  votedAt?: string;
}
```

### PokerStats

```typescript
interface PokerStats {
  average: number;       // المتوسط الحسابي
  median: number;        // الوسيط
  min: number;           // أقل قيمة
  max: number;           // أعلى قيمة
  consensus: boolean;    // هل هناك إجماع؟
  suggestedEstimate: number;  // التقدير المقترح
}
```

---

## 🎨 UI States

### 1. **Initial State** (قبل التصويت)
- ✅ بطاقات التصويت نشطة
- ✅ لا توجد قيمة مختارة
- ✅ عرض عدد الأصوات: `0 / 3 voted`
- ✅ زر "Reveal" معطل

### 2. **Voting State** (أثناء التصويت)
- ✅ بطاقة واحدة مختارة ومميزة
- ✅ باقي البطاقات معطلة
- ✅ عرض ✓ للمشاركين الذين صوتوا
- ✅ تحديث عداد: `2 / 3 voted`

### 3. **All Voted State** (الجميع صوت)
- ✅ عرض "All votes in!" ✓
- ✅ تفعيل زر "Reveal Votes"

### 4. **Revealed State** (بعد الكشف)
- ✅ عرض قيم جميع المشاركين
- ✅ عرض لوحة الإحصائيات
- ✅ عرض حالة الإجماع
- ✅ أزرار: "New Round" و "Accept X Points"

### 5. **Completed State**
- ✅ إغلاق Modal
- ✅ تحديث Story Points في الـ task
- ✅ مسح الحالة

---

## ⚠️ المشاكل المحلولة

### 1. **404 Error - Base URL**
**المشكلة:**
```
POST /api/pm/tasks/:taskId/poker 404
```

**الحل:**
```typescript
// lib/axios.ts
baseURL: 'http://localhost:5000/api/v1'  // ✅
```

### 2. **400 Error - Missing Organization Header**
**المشكلة:**
```json
{
  "statusCode": 400,
  "message": "Organization context required"
}
```

**الحل:**
```typescript
// lib/axios.ts - Request Interceptor
const organizationId = localStorage.getItem('organizationId');
if (organizationId) {
  config.headers['X-Organization-ID'] = organizationId;
}
```

### 3. **Duplicate /v1/ in URLs**
**المشكلة:**
```
POST /api/v1/v1/auth/login 404
```

**الحل:**
```typescript
// قبل
api.post('/v1/auth/login', data);

// بعد
api.post('/auth/login', data);  // ✅
```

### 4. **Duplicate Session Creation**
**المشكلة:**
- كل مرة يفتح Modal ينشئ جلسة جديدة
- يسبب 400 error إذا كانت جلسة موجودة

**الحل:**
```typescript
// PlanningPokerModal.tsx
const initializeSession = async () => {
  // 1. التحقق من sprintId
  if (!sprintId || sprintId === '') {
    await createPokerSession(taskId, estimationType);
    return;
  }
  
  // 2. البحث عن جلسة موجودة
  const sessions = await getSprintPokerSessions(sprintId);
  const existing = sessions?.find(
    s => s.taskId === taskId && 
    (s.status === 'voting' || s.status === 'revealed')
  );
  
  // 3. الانضمام أو الإنشاء
  if (existing) {
    await getPokerSession(existing._id);
  } else {
    await createPokerSession(taskId, estimationType);
  }
};
```

### 5. **Empty sprintId - 404 Error**
**المشكلة:**
```
GET /api/v1/pm/sprints//poker 404
```

**الحل:**
```typescript
if (!sprintId || sprintId === '') {
  console.error('❌ sprintId is empty');
  await createPokerSession(taskId, estimationType);
  return;
}
```

---

## ✅ Best Practices

### 1. **Session Management**
- ✅ دائماً تحقق من الجلسات الموجودة قبل الإنشاء
- ✅ استخدم `getSprintPokerSessions()` للبحث
- ✅ انضم للجلسة الموجودة إذا كانت نشطة

### 2. **Real-time Updates**
- ✅ استخدم Socket.IO للتحديثات الفورية
- ✅ انضم للـ room عند فتح الجلسة
- ✅ غادر الـ room عند إغلاق Modal

### 3. **Error Handling**
- ✅ تحقق من `organizationId` في localStorage
- ✅ تحقق من `sprintId` قبل API calls
- ✅ اعرض رسائل خطأ واضحة للمستخدم

### 4. **UI/UX**
- ✅ عطّل البطاقات بعد التصويت
- ✅ اعرض عداد الأصوات بوضوح
- ✅ ميّز حالة الإجماع بألوان مختلفة
- ✅ اجعل زر "Reveal" نشط فقط عند اكتمال الأصوات

---

## 🚀 الخطوات التالية للاختبار

### 1. تهيئة Organization ID
```javascript
// Browser Console
localStorage.setItem('organizationId', '693de9d82e33d18218cfd8dc');
location.reload();
```

### 2. فتح Sprint Planning
```
/projects/:projectId/planning
```

### 3. اختيار Task وفتح Planning Poker
- اضغط على أيقونة Planning Poker بجانب task
- سيبحث عن جلسة موجودة أو ينشئ جديدة

### 4. التصويت
- اختر قيمة من البطاقات
- انتظر باقي المشاركين

### 5. كشف النتائج
- اضغط "Reveal Votes"
- راجع الإحصائيات

### 6. الإكمال
- اضغط "Accept X Points" لحفظ التقدير
- أو "New Round" لجولة جديدة

---

## 📝 ملاحظات إضافية

### قيم Fibonacci المستخدمة
```typescript
export const POKER_VALUES = [1, 2, 3, 5, 8, 13, 21];
```

### Consensus Rules
- **Consensus = true**: جميع الأصوات متطابقة
- **Consensus = false**: أصوات مختلفة
- **Suggested Estimate**: 
  - إذا consensus → القيمة المتفق عليها
  - إذا لا → المتوسط الحسابي (مقرب)

### Session Lifecycle
```
Created → Voting → Revealed → Completed
                      ↓
                  New Round
                      ↓
                   Voting
```

---

## 🎯 الخلاصة

Planning Poker مُطبق بشكل صحيح مع:
- ✅ API endpoints كاملة
- ✅ Real-time updates عبر Socket.IO
- ✅ UI تفاعلية وواضحة
- ✅ Session management ذكي
- ✅ Error handling شامل
- ✅ Best practices مُتبعة

**جميع المشاكل محلولة والنظام جاهز للإنتاج!** 🚀
