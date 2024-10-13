import schedule from 'node-schedule';
import {
    fetchAllChats,
    fetchReminders,
    getMembersByChat,
    getAdminsByChat,
    updateReminder
} from './db.mjs';

const scheduledReminders = new Set(); // Cache لتخزين معرّفات التذكيرات المجدولة

// دالة لإرسال التذكيرات
const sendReminder = async (client, chatId, title, message, timeRemaining = null, mentionAdmins = false, mentionAll = false) => {
    try {
        let fullMessage = `${title}\n${message}`;
        if (timeRemaining) {
            fullMessage += `\n⏳ الوقت المتبقي: ${timeRemaining}`;
        }

        let options = {
            parse_mode: 'Markdown',
            disable_notification: false,
        };

        if (mentionAdmins) {
            const admins = await getAdminsByChat(chatId);
            const adminMentions = admins.map(admin => `@${admin.userId}`).join(' ');
            fullMessage += `\n\n👮‍♂️ المشرفون: ${adminMentions}`;
        }

        if (mentionAll) {
            const members = await getMembersByChat(chatId);
            const memberMentions = members.map(member => `@${member.userId}`).join(' ');
            fullMessage += `\n\n👥 الأعضاء: ${memberMentions}`;
        }

        await client.telegram.sendMessage(chatId, fullMessage, options).catch((error) => { console.error(error);
        })
    } catch (error) {
        console.error(`Error sending reminder: ${error.message}`);
    }
};

// دالة لجدولة التذكيرات
const scheduleReminder = (client, reminder) => {
    const reminderTime = new Date(reminder.reminderTime);

    // تذكير قبل ساعة
    const oneHourBefore = new Date(reminderTime.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > new Date()) {
        schedule.scheduleJob(oneHourBefore, async () => {
            await sendReminder(client, reminder.chatId, reminder.title, reminder.message);
        });
    }

    // تذكير قبل 15 دقيقة مع منشن للمشرفين
    const fifteenMinutesBefore = new Date(reminderTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinutesBefore > new Date()) {
        schedule.scheduleJob(fifteenMinutesBefore, async () => {
            const timeRemaining = `15 دقيقة`;
            await sendReminder(client, reminder.chatId, reminder.title, reminder.message, timeRemaining, true);
        });
    }

    // التذكير في الموعد مع منشن لجميع الأعضاء
    if (reminderTime > new Date()) {
        schedule.scheduleJob(reminderTime, async () => {
            await sendReminder(client, reminder.chatId, reminder.title, reminder.message, null, false, true);
            await updateReminder(reminder.id, { sent: 1 });
        });
    }
};

// دالة لفحص وجدولة التذكيرات الجديدة
const checkAndScheduleReminders = async (client) => {
    const chatIds = await fetchAllChats(); // جلب جميع الدردشات

    for (const chat of chatIds) {
        const reminders = await fetchReminders(chat.chatId); // جلب التذكيرات لكل محادثة

        for (const reminder of reminders) {
            if (!reminder.sent && !scheduledReminders.has(reminder.id)) {
                scheduleReminder(client, reminder); // جدولة التذكير
                scheduledReminders.add(reminder.id); // إضافة التذكير إلى الـ cache
            }
        }
    }
};

// دالة بدء خدمة التذكير
export default function startReminderService(client) {
    setInterval(() => checkAndScheduleReminders(client), 60000); // تحديث كل دقيقة
    console.log('Reminder service started successfully');
}