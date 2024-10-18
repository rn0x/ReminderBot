import checkIfAdmin from '../utils/checkIfAdmin.mjs';
import { Scenes } from 'telegraf';

// إنشاء المشهد الخاص بحذف التذكير
const deleteReminderScene = new Scenes.BaseScene('deleteReminder');

// عند دخول المشهد
deleteReminderScene.enter(async (ctx) => {
    const isAdmin = await checkIfAdmin(ctx);
    if (!isAdmin) {
        await ctx.reply('❌ ليس لديك صلاحيات لحذف التذكيرات.');
        return ctx.scene.leave();
    }

    // عرض قائمة التذكيرات للمستخدم
    try {
        const reminders = await getRemindersByChatId(ctx.chat.id);
        if (reminders.length === 0) {
            await ctx.reply('📭 لا توجد تذكيرات حالية في هذه المحادثة.');
            return ctx.scene.leave();
        }

        const reminderList = reminders.map((r, index) => {
            const date = r.date ? new Date(r.date) : null; // التحقق من وجود التاريخ
            const timeParts = r.time.split(':'); // تقسيم الوقت إلى الساعات والدقائق
            const formattedTime = `${String(timeParts[0]).padStart(2, '0')}:${String(timeParts[1]).padStart(2, '0')}`; // تنسيق الوقت

            // تنسيق التاريخ إذا كان موجودًا
            const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : 'غير محدد';

            // تحديد نوع التكرار
            let recurrenceText;
            if (r.isRecurring) {
                recurrenceText = r.dayOfWeek === 0
                    ? '🗓️ <b>كل يوم</b>'
                    : `🗓️ <b>كل ${['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][r.dayOfWeek - 1]}</b>`;
            } else {
                recurrenceText = '🔄 <b>لمرة واحدة</b>';
            }

            let reminderListMessage = `⏰ رقم التذكير: ${index + 1}\n`;
            reminderListMessage += `📋 عنوان التذكير: <b>${r.title}</b>\n`;
            reminderListMessage += `📝 نص التذكير: <b>${r.message}</b>\n`;
            reminderListMessage += `📅 <b>التاريخ:</b> ${formattedDate}\n`;
            reminderListMessage += `🕒 <b>الوقت:</b> ${formattedTime}\n`;
            reminderListMessage += `${recurrenceText}\n\n`;

            return reminderListMessage;
        }).join('\n');

        await ctx.reply('🔍 يجب إدخال رقم التذكير الذي ترغب في حذفه:\n');
        await ctx.reply(`📅 <b>التذكيرات الحالية:</b>\n\n${reminderList}`, { parse_mode: 'HTML' });
        ctx.session.reminders = reminders; // تخزين التذكيرات في الجلسة
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        await ctx.reply('❌ حدث خطأ أثناء تحميل التذكيرات. حاول لاحقًا.');
        ctx.scene.leave();
    }
});

// استقبال رقم التذكير للحذف
deleteReminderScene.on('text', async (ctx) => {
    const reminders = ctx.session.reminders;
    const index = parseInt(ctx.message.text) - 1;

    if (isNaN(index) || index < 0 || index >= reminders.length) {
        return await ctx.reply('❌ رقم غير صحيح. حاول مرة أخرى:');
    }

    const reminder = reminders[index];

    try {
        await deleteReminderFromDatabase(reminder.id);
        await ctx.reply(`✅ تم حذف التذكير: "<b>${reminder.title}</b>" بنجاح!`, { parse_mode: 'HTML' });
    } catch (error) {
        console.error('Failed to delete reminder:', error);
        await ctx.reply('❌ حدث خطأ أثناء حذف التذكير. حاول لاحقًا.');
    }

    ctx.scene.leave(); // إنهاء المشهد
});

// التعامل مع الإلغاء
deleteReminderScene.command('cancel', async (ctx) => {
    await ctx.reply('❌ تم إلغاء عملية الحذف.');
    ctx.scene.leave();
});

// وظيفة لجلب التذكيرات من قاعدة البيانات
const getRemindersByChatId = async (chatId) => {
    const { fetchReminders } = await import('../db.mjs');
    return await fetchReminders(chatId);
};

// وظيفة لحذف التذكير من قاعدة البيانات
const deleteReminderFromDatabase = async (reminderId) => {
    const { removeReminder } = await import('../db.mjs');
    await removeReminder(reminderId);
};

export { deleteReminderScene };
