# استخدم صورة رسمية لـ Node.js
FROM node:18-alpine

# تعيين دليل العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات المشروع
COPY package*.json ./

# تثبيت التبعيات
RUN npm install

# نسخ باقي الملفات إلى الحاوية
COPY . .

# إنشاء volume لإدارة قاعدة البيانات
VOLUME ["/app/database"]

# تحديد أمر التشغيل الافتراضي
CMD ["npm", "start"]
