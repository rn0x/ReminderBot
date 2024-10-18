# ReminderBot

**ReminderBot** هو بوت تلغرام يُتيح للمستخدمين إدارة التذكيرات داخل المجموعات، حيث يقوم بإرسال إشعارات تلقائية في الأوقات المحددة مع إمكانية الإشارة إلى المشرفين أو جميع الأعضاء.

---

## الميزات
- **إضافة وحذف التذكيرات** مع إمكانية الإشارة للمشرفين أو الأعضاء.
- **إدارة التذكيرات** بحيث يتم إرسال إشعارات قبل الموعد بساعة و15 دقيقة.
- **متابعة المشرفين والأعضاء في المجموعات** لتحديث أدوارهم بشكل دوري.
- **إغلاق آمن** عند إيقاف البوت.
- **قاعدة بيانات SQLite** للتذكيرات والمحادثات والمشرفين والأعضاء.

---

## المتطلبات

- **Node.js** 18 أو أعلى
- حساب بوت على تلغرام (احصل على التوكن من [BotFather](https://core.telegram.org/bots#botfather))
- قاعدة بيانات **SQLite** (يتم إنشاؤها تلقائيًا)

---

## إعداد المشروع

1. **نسخ المستودع وتشغيله:**
   ```bash
   git clone https://github.com/rn0x/ReminderBot.git
   cd ReminderBot
   npm install
   ```

2. **إنشاء ملف البيئة `.env`:**
   ```
   TELEGRAM_TOKEN=<ضع_توكن_البوت_هنا>
   ```

3. **تشغيل قاعدة البيانات وإنشاء الجداول:**
   لا حاجة لإعداد يدوي — الجداول يتم إنشاؤها تلقائيًا في أول تشغيل.

---

## الأوامر المدعومة

- `/start`: بدء البوت وعرض رسالة ترحيبية.
- `/add`: إضافة تذكير جديد (يبدأ مشهد إضافة التذكير).
- `/delete`: حذف تذكير (يبدأ مشهد حذف التذكير).
- `/show`: عرض التذكيرات الحالية للمجموعة.

---

## تشغيل البوت

```bash
npm start
```

---

## بنية المشروع

```
/ReminderBot
├── src
│   ├── commands
│   │   ├── show.mjs
│   │   └── start.mjs
│   ├── events
│   │   ├── handleTextMessage.mjs
│   │   ├── newChatMembers.mjs
│   │   ├── leftChatMember.mjs
│   │   └── myChatMember.mjs
│   ├── scenes
│   │   ├── addReminder.mjs
│   │   └── deleteReminder.mjs
│   ├── utils
│   │   └── updateAdminsPeriodically.mjs
│   │   └── checkIfAdmin.mjs
│   │   └── sendMessageInChunks.mjs
│   ├── client.mjs
│   ├── db.mjs
│   ├── startReminderService.mjs
│   └── index.mjs
├── database
│   └── reminderBot.db
├── README.md
├── package.json
└── .env
```

---

## قاعدة البيانات

يتم تخزين المعلومات في جداول **SQLite** كما يلي:

- **`chats`**: تخزين معلومات الدردشات.
- **`reminders`**: تخزين التذكيرات لكل محادثة.
- **`admins`**: قائمة المشرفين في الدردشات.
- **`members`**: قائمة الأعضاء في الدردشات.

---

## كيفية الإيقاف الآمن

يتم تمكين الإيقاف الآمن باستخدام:
```javascript
process.once('SIGINT', () => client.stop('SIGINT'));
process.once('SIGTERM', () => client.stop('SIGTERM'));
```
اضغط **Ctrl + C** لإيقاف البوت.

---

## **إعداد Docker**

### 1. **إنشاء صورة Docker**  
تأكد من وجود ملف `Dockerfile` في جذر المشروع بالشكل الصحيح.

---

### 2. **بناء صورة Docker**  
قم ببناء الصورة من داخل مجلد المشروع:
```bash
docker build -t reminderbot .
```

---

### 3. **تشغيل الحاوية**  
قم بتشغيل الحاوية باستخدام الأمر التالي:
```bash
docker run -d \
  --name reminderbot \
  -e TELEGRAM_TOKEN=<ضع_توكن_البوت_هنا> \
  -v $(pwd)/database:/app/database \
  reminderbot
```

---

## **إدارة الحاوية**

- **إيقاف الحاوية بشكل آمن:**
  ```bash
  docker stop reminderbot
  docker rm reminderbot
  ```

- **التحقق من حالة الحاوية:**
  ```bash
  docker ps
  ```

- **عرض السجلات:**
  ```bash
  docker logs reminderbot
  ```

  ---

## المساهمون

- **Rayan Almalki** ([rn0x](https://github.com/rn0x)) 

---

## الترخيص

هذا المشروع مرخّص تحت **MIT**.