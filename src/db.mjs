// db.mjs
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الملف الحالي والدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد مسار قاعدة البيانات
const dbDirectory = path.join(__dirname, '../database');
const DATABASE_NAME = path.join(dbDirectory, 'reminderBot.db');

if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory);
    console.log('تم إنشاء مجلد "database" بنجاح.');
}

// فتح اتصال بقاعدة البيانات
const openDatabase = async () => {
    const db = await open({
        filename: DATABASE_NAME,
        driver: sqlite3.Database,
    });

    return db;
};

// إنشاء الجداول إذا لم تكن موجودة
const createTables = async () => {
    const db = await openDatabase();

    // جدول المحادثات
    await db.exec(`
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- معرف المحادثة (فريد)
            chatType TEXT NOT NULL,                  -- نوع المحادثة (مثل: private, group, supergroup, channel)
            chatId TEXT NOT NULL UNIQUE,             -- معرف الدردشة (لتحديد المحادثة)
            title TEXT,                              -- عنوان المحادثة
            username TEXT,                           -- اسم المستخدم للمحادثة (قد يكون فارغًا)
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP  -- تاريخ ووقت إنشاء السجل
        );
    `);

    // جدول التذكيرات
    await db.exec(`
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chatId TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            time TEXT NOT NULL,         -- الوقت في صيغة HH:MM
            dayOfWeek INTEGER,          -- رقم اليوم في الأسبوع (0-6) يمكن أن يكون فارغًا
            date DATE,                  -- التاريخ (YYYY-MM-DD) يمكن أن يكون فارغًا للتذكيرات المتكررة
            isRecurring BOOLEAN DEFAULT 0, -- هل التذكير متكرر
            sent BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chatId) REFERENCES chats (chatId)
        );
    `);

    // جدول المشرفين
    await db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- معرف المشرف (فريد)
            userId TEXT NOT NULL,                   -- معرف المستخدم (لتحديد المشرف)
            chatId TEXT NOT NULL,                   -- معرف المحادثة المرتبط
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, -- تاريخ ووقت إضافة المشرف
            UNIQUE(userId, chatId),                 -- منع تكرار المشرف في نفس المحادثة
            FOREIGN KEY (chatId) REFERENCES chats (chatId) -- قيود العلاقة مع جدول المحادثات
        );
    `);


    // جدول الأعضاء
    await db.exec(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- معرف العضو (فريد)
            userId TEXT NOT NULL,                   -- معرف المستخدم (لتحديد العضو)
            chatId TEXT NOT NULL,                   -- معرف المحادثة المرتبط
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, -- تاريخ ووقت إضافة العضو
            UNIQUE(userId, chatId),                 -- منع تكرار العضو في نفس المحادثة
            FOREIGN KEY (chatId) REFERENCES chats (chatId) -- قيود العلاقة مع جدول المحادثات
        );
    `);

    await db.close();
};

// دالة للتحقق من وجود سجل بناءً على عدة قيم
const recordExists = async (tableName, criteria) => {
    const db = await openDatabase();
    const keys = Object.keys(criteria);
    const placeholders = keys.map((key) => `${key} = ?`).join(' AND ');
    const values = Object.values(criteria);

    const row = await db.get(`SELECT 1 FROM ${tableName} WHERE ${placeholders}`, values);
    await db.close();
    return !!row; // تعيد true إذا كان السجل موجودًا
};

// دالة للتحقق من صحة المدخلات
const validateInputs = (inputs) => {
    for (const [key, value] of Object.entries(inputs)) {
        if (!value) {
            console.log(`${key} is required`);
        }
    }
};

// دالة للتحقق من وجود تعارض مع التذكيرات
const checkConflictingReminders = async (chatId, time, dayOfWeek, date) => {
    const db = await openDatabase();

    const query = `
        SELECT 1 FROM reminders 
        WHERE chatId = ? AND time = ? 
        AND (dayOfWeek = ? OR date = ?)
    `;
    const conflicts = await db.get(query, [String(chatId), time, dayOfWeek, date]);

    await db.close();
    return !!conflicts;
};

// دالة لجلب التذكيرات الخاصة بمحادثة معينة
export const fetchReminders = async (chatId) => {
    const db = await openDatabase();

    try {
        const reminders = await db.all(`
            SELECT * FROM reminders WHERE chatId = ?
        `, [String(chatId)]);

        return reminders;
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
    } finally {
        await db.close();
    }
};

// دالة لحذف تذكرة
export const removeReminder = async (reminderId) => {
    const db = await openDatabase();

    try {
        const result = await db.run('DELETE FROM reminders WHERE id = ?', [reminderId]);
        if (result.changes === 0) {
            console.log('Reminder not found');
        }
    } catch (error) {
        console.error('Failed to remove reminder:', error);
    } finally {
        await db.close();
    }
};

// دالة لإضافة تذكرة مع دعم التكرار
export const addReminder = async (chatId, time, title, message, isRecurring = false, date = null, dayOfWeek = null) => {
    const db = await openDatabase();

    try {
        const conflict = await checkConflictingReminders(String(chatId), time, dayOfWeek, date);
        if (conflict) {
            console.log('يوجد تعارض مع تذكير آخر.');
            return;
        }

        const result = await db.run(`
            INSERT INTO reminders (chatId, time, title, message, isRecurring, date, dayOfWeek)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [String(chatId), time, title, message, isRecurring, date, dayOfWeek]);

        return result.lastID;
    } catch (error) {
        console.error('Failed to add reminder:', error);
    } finally {
        await db.close();
    }
};

// دالة لتحديث حالة التذكير في قاعدة البيانات
export const updateReminder = async (reminderId, updateFields) => {
    const db = await openDatabase();

    // بناء جملة التحديث ديناميكيًا
    const fields = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateFields);

    try {
        await db.run(`UPDATE reminders SET ${fields} WHERE id = ?`, [...values, reminderId]);
        console.log(`Reminder ${reminderId} updated successfully.`);
    } catch (error) {
        console.error(`Failed to update reminder ${reminderId}:`, error);
    } finally {
        await db.close();
    }
};


// دالة لإضافة عضو
export const addMember = async (userId, chatId) => {
    validateInputs({ userId, chatId });

    const db = await openDatabase();

    try {
        const result = await db.run(`
            INSERT INTO members (userId, chatId)
            VALUES (?, ?)
            ON CONFLICT(userId, chatId) DO NOTHING;
        `, [String(userId), String(chatId)]);

        return result.lastID || null;
    } catch (error) {
        console.error('Failed to add member:', error);
    } finally {
        await db.close();
    }
};

// دالة لجلب جميع الأعضاء في محادثة معينة
export const getMembersByChat = async (chatId) => {
    validateInputs({ chatId });

    const db = await openDatabase();

    try {
        const members = await db.all('SELECT * FROM members WHERE chatId = ?', [String(chatId)]);
        return members;
    } catch (error) {
        console.error('Failed to fetch members by chat:', error);
    } finally {
        await db.close();
    }
};

// دالة لجلب عضو معين حسب userId و chatId
export const getMemberByUserIdAndChatId = async (userId, chatId) => {
    validateInputs({ userId, chatId });

    const db = await openDatabase();

    try {
        const member = await db.get(
            'SELECT * FROM members WHERE userId = ? AND chatId = ?',
            [String(userId), String(chatId)]
        );

        if (!member) {
            console.log(`No member found with userId ${userId} in chat ${chatId}.`);
            return null;
        }

        return member;
    } catch (error) {
        console.error('Failed to fetch member by userId and chatId:', error);
    } finally {
        await db.close();
    }
};


// دالة لحذف عضو
export const deleteMember = async (userId, chatId) => {
    validateInputs({ userId, chatId });

    const exists = await recordExists('members', { userId: String(userId), chatId: String(chatId) });
    if (!exists) {
        console.log(`Member with userId ${userId} does not exist in chat ${chatId}. Ignoring deletion.`);
        return; // تجاهل العملية إذا لم يكن العضو موجودًا
    }

    const db = await openDatabase();

    try {
        await db.run('DELETE FROM members WHERE userId = ? AND chatId = ?', [String(userId), String(chatId)]);
    } catch (error) {
        console.error('Failed to delete member:', error);
    } finally {
        await db.close();
    }
};

// دالة لإضافة محادثة مع التحقق من وجودها مسبقًا
export const addChat = async (chatId, chatType, title, username) => {
    validateInputs({ chatId, chatType, title, username });

    const db = await openDatabase();

    try {
        const result = await db.run(`
            INSERT INTO chats (chatId, chatType, title, username)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(chatId) DO UPDATE SET 
                chatType = excluded.chatType,
                title = excluded.title,
                username = excluded.username;
        `, [String(chatId), chatType, title, username]);

        return result.lastID;
    } catch (error) {
        console.error('Failed to add or update chat:', error);
    } finally {
        await db.close();
    }
};

// دالة لحذف محادثة وجميع البيانات المرتبطة بها
export const deleteChat = async (chatId) => {
    validateInputs({ chatId });

    const exists = await recordExists('chats', { chatId: String(chatId) });
    if (!exists) {
        console.log(`Chat with id ${chatId} does not exist.`);
        return; // بدلاً من رمي خطأ، يمكنك ببساطة إنهاء الدالة
    }

    const db = await openDatabase();

    try {
        // حذف جميع التذكيرات المرتبطة بالمحادثة
        await db.run('DELETE FROM reminders WHERE chatId = ?', [String(chatId)]);

        // حذف جميع الأعضاء المرتبطين بالمحادثة
        await db.run('DELETE FROM members WHERE chatId = ?', [String(chatId)]);

        // حذف المحادثة نفسها
        await db.run('DELETE FROM chats WHERE chatId = ?', [String(chatId)]);
    } catch (error) {
        console.error('Failed to delete chat:', error);
    } finally {
        await db.close();
    }
};

// دالة لجلب جميع الدردشات
export const fetchAllChats = async () => {
    const db = await openDatabase();

    try {
        const chats = await db.all('SELECT * FROM chats');
        return chats;
    } catch (error) {
        console.error('Failed to fetch chats:', error);
    } finally {
        await db.close();
    }
};

// دالة لإضافة مشرف
export const addAdmin = async (userId, chatId) => {
    validateInputs({ userId, chatId });

    const db = await openDatabase();

    try {
        const result = await db.run(`
            INSERT INTO admins (userId, chatId)
            VALUES (?, ?)
            ON CONFLICT(userId, chatId) DO NOTHING;
        `, [String(userId), String(chatId)]);

        return result.lastID || null;
    } catch (error) {
        console.error('Failed to add admin:', error);
    } finally {
        await db.close();
    }
};

// دالة لجلب جميع المشرفين في محادثة معينة
export const getAdminsByChat = async (chatId) => {
    validateInputs({ chatId });

    const db = await openDatabase();

    try {
        const admins = await db.all('SELECT * FROM admins WHERE chatId = ?', [String(chatId)]);
        return admins;
    } catch (error) {
        console.error('Failed to fetch admins by chat:', error);
    } finally {
        await db.close();
    }
};

// دالة لتحديث قائمة المشرفين في قاعدة البيانات
export const updateAdmins = async (client, chatId) => {
    const db = await openDatabase();

    try {
        const admins = await client.telegram.getChatAdministrators(chatId);

        // تنظيف الجدول الحالي وإعادة إدخال المشرفين الجدد
        await db.run(`DELETE FROM admins WHERE chatId = ?`, [String(chatId)]);

        const insertPromises = admins.map(async (admin) => {
            await db.run(`INSERT INTO admins (userId, chatId) VALUES (?, ?)`, [String(admin.user.id), String(chatId)]);
        });

        await Promise.all(insertPromises);
        console.log(`Admins updated for chat ${chatId}`);
    } catch (error) {
        console.error('Error updating admins:', error.message);
    } finally {
        await db.close();
    }
};


// تنفيذ دالة إنشاء الجداول
createTables()
    .then(() => console.log('Database and tables created successfully'))
    .catch((error) => console.error('Failed to create database:', error));