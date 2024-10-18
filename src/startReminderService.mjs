import schedule from 'node-schedule';
import {
    fetchAllChats,
    fetchReminders,
    getMembersByChat,
    getMemberByUserIdAndChatId,
    getAdminsByChat,
    updateReminder,
} from './db.mjs';
import { sendMessageInChunks } from './utils/sendMessageInChunks.mjs';

const scheduledReminders = new Set();

// دالة لتحويل التاريخ إلى توقيت مكة المكرمة
const toMakkahTime = (date) => {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
};

// دالة لإرسال التذكير
const sendReminder = async (client, chatId, title, message, timeRemaining = null, mentionAdmins = false, mentionAll = false) => {
    try {
        let fullMessage = `🔔 #تذكير\n\n🗓️ ${title}\n📢 ${message}`;
        if (timeRemaining) {
            fullMessage += `\n⏳ الوقت المتبقي: ${timeRemaining}`;
        }

        const options = { parse_mode: 'Markdown', disable_notification: false };

        // ذكر المشرفين إذا كانت الإعدادات تتطلب ذلك
        if (mentionAdmins) {
            const admins = await getAdminsByChat(chatId);
            let adminMentions = '';

            for (const admin of admins) {
                const member = await getMemberByUserIdAndChatId(admin.userId, chatId);
                if (member) { // تحقق من وجود العضو
                    if (member.username) {
                        adminMentions += `@${member.username} `;
                    } else {
                        console.warn(`Admin ${admin.userId} does not have a username.`);
                    }
                } else {
                    console.warn(`No member found with userId ${admin.userId} in chat ${chatId}.`);
                }
            }

            if (adminMentions) {
                fullMessage += `\n\n👮‍♂️ المشرفون: ${adminMentions.trim()}`;
            }
        }

        // ذكر جميع الأعضاء إذا كانت الإعدادات تتطلب ذلك
        if (mentionAll) {
            const members = await getMembersByChat(chatId);
            let memberMentions = '';

            for (const member of members) {
                if (member.username) {
                    memberMentions += `@${member.username} `;
                } else {
                    console.warn(`Member ${member.id} does not have a username.`);
                }
            }

            if (memberMentions) {
                fullMessage += `\n\n👥 الأعضاء: ${memberMentions.trim()}`;
            }
        }

        await sendMessageInChunks(client, chatId, fullMessage, options);
    } catch (error) {
        console.error(`Error sending reminder: ${error.message}`);
    }
};

// دالة لجدولة التذكير بناءً على نوعه
const scheduleReminder = (client, reminder) => {
    if (reminder.isRecurring) {
        scheduleRecurringReminder(client, reminder);
    } else {
        scheduleNonRecurringReminder(client, reminder);
    }
};

// دالة لجدولة التذكيرات المتكررة
const scheduleRecurringReminder = (client, reminder) => {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = toMakkahTime(new Date());

    const nextOccurrence = new Date();
    nextOccurrence.setHours(hours, minutes, 0, 0);

    const currentDayOfWeek = (now.getDay() + 1) % 7 + 1;
    const targetDayOfWeek = reminder.dayOfWeek;

    let dayOffset = 0;

    if (targetDayOfWeek === 0) {
        // إذا كان التذكير يوميًا
        dayOffset = 0; // تذكير يومي
    } else {
        dayOffset = (targetDayOfWeek - currentDayOfWeek + 7) % 7; // حساب الفرق بين الأيام

        // إذا كان اليوم المحدد قد مضى، تأجيل للأسبوع القادم
        if (dayOffset === 0 && nextOccurrence <= now) {
            dayOffset = 7;
        }
    }

    nextOccurrence.setDate(now.getDate() + dayOffset);

    // طباعة القيم لمراجعتها
    // console.log(`الوقت الحالي: ${now}`);
    // console.log(`اليوم الحالي (1-7): ${currentDayOfWeek}`);
    // console.log(`اليوم المستهدف (1-7): ${targetDayOfWeek}`);
    // console.log(`فرق الأيام (dayOffset): ${dayOffset}`);
    // console.log(`تاريخ ووقت التذكير التالي: ${nextOccurrence}`);

    schedule.scheduleJob(nextOccurrence, async () => {
        await sendReminder(client, reminder.chatId, reminder.title, reminder.message, null, false, true);
        // console.log(`Recurring reminder ${reminder.id} sent at ${nextOccurrence}`);
    });

    // جدولة التنبيهات
    scheduleReminderAlerts(client, reminder, nextOccurrence);
};

// دالة لجدولة التذكيرات غير المتكررة
const scheduleNonRecurringReminder = (client, reminder) => {
    const reminderTime = toMakkahTime(new Date(`${reminder.date}T${reminder.time}:00`));
    const now = toMakkahTime(new Date());

    if (reminderTime <= now) {
        return; // التذكير قد مضى
    }

    schedule.scheduleJob(reminderTime, async () => {
        await sendReminder(client, reminder.chatId, reminder.title, reminder.message, null, false, true);
        await updateReminder(reminder.id, { sent: 1 });
        // console.log(`One-time reminder ${reminder.id} sent at ${reminderTime}`);
    });

    // جدولة التنبيهات
    scheduleReminderAlerts(client, reminder, reminderTime);

    // console.log(`Scheduled one-time reminder ${reminder.id} for ${reminderTime}`);
};

// دالة لجدولة التنبيهات
const scheduleReminderAlerts = (client, reminder, reminderTime) => {
    // تنبيه قبل 1 ساعة
    const oneHourBefore = new Date(reminderTime.getTime() - 60 * 60 * 1000);
    schedule.scheduleJob(oneHourBefore, async () => {
        const timeRemaining = `${Math.floor((reminderTime - toMakkahTime(new Date())) / (60 * 1000))} دقيقة`;
        await sendReminder(client, reminder.chatId, reminder.title, reminder.message, timeRemaining);
        // console.log(`One hour alert for reminder ${reminder.id} sent at ${oneHourBefore}`);
    });

    // تنبيه قبل 15 دقيقة
    const fifteenMinutesBefore = new Date(reminderTime.getTime() - 15 * 60 * 1000);
    schedule.scheduleJob(fifteenMinutesBefore, async () => {
        const timeRemaining = `${Math.floor((reminderTime - toMakkahTime(new Date())) / (60 * 1000))} دقيقة`;
        await sendReminder(client, reminder.chatId, reminder.title, reminder.message, timeRemaining, true); // mentionAdmins = true
        // console.log(`Fifteen minutes alert for reminder ${reminder.id} sent at ${fifteenMinutesBefore}`);
    });
};

// دالة لفحص وجدولة التذكيرات الجديدة
const checkAndScheduleReminders = async (client) => {
    const chatIds = await fetchAllChats();

    for (const chat of chatIds) {
        const reminders = await fetchReminders(chat.chatId);

        for (const reminder of reminders) {
            if (!scheduledReminders.has(reminder.id)) {
                scheduleReminder(client, reminder);
                scheduledReminders.add(reminder.id);
            }
        }
    }
};

// دالة بدء خدمة التذكير
export default async function startReminderService(client) {
    setInterval(() => checkAndScheduleReminders(client), 60000);
    console.log('Reminder service started successfully');
}