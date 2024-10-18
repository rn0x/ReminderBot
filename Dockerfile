# استخدم صورة رسمية لـ Node.js
FROM node:18-alpine

# تثبيت tzdata لتعيين المنطقة الزمنية
RUN apk add --no-cache tzdata

# تعيين المنطقة الزمنية إلى مكة المكرمة
ENV TZ=Asia/Riyadh

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