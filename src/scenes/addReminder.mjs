import checkIfAdmin from '../utils/checkIfAdmin.mjs';
import { Scenes } from 'telegraf';

const addReminderScene = new Scenes.BaseScene('addReminder');

// عند الدخول إلى المشهد
addReminderScene.enter(async (ctx) => {
    const isAdmin = await checkIfAdmin(ctx);
    if (!isAdmin) {
        await ctx.reply('❌ ليس لديك صلاحيات لإضافة المواعيد.');
        return ctx.scene.leave();
    }
    await ctx.reply('📅 يرجى إدخال عنوان التذكير:');
    ctx.session.reminder = {}; // تهيئة الكائن لحفظ بيانات التذكير
});

// استقبال عنوان التذكير
addReminderScene.on('text', async (ctx) => {
    if (!ctx.session.reminder.title) {
        ctx.session.reminder.title = ctx.message.text;
        await ctx.reply('⏰ الآن أدخل وقت التذكير (بصيغة YYYY-MM-DD HH:mm):');
    } else if (!ctx.session.reminder.reminderTime) {
        const time = ctx.message.text;
        const isValidTime = !isNaN(Date.parse(time)); // التحقق من صحة الوقت

        if (!isValidTime) {
            return await ctx.reply('❌ تنسيق الوقت غير صحيح. حاول مرة أخرى:');
        }

        ctx.session.reminder.reminderTime = new Date(time);
        await ctx.reply('📝 أدخل رسالة التذكير:');
    } else {
        ctx.session.reminder.message = ctx.message.text;

        // استدعاء دالة لإضافة التذكير إلى قاعدة البيانات
        try {
            await addReminderToDatabase(
                ctx.chat.id,
                ctx.session.reminder.reminderTime,
                ctx.session.reminder.title,
                ctx.session.reminder.message
            );

            await ctx.reply('✅ تم إضافة التذكير بنجاح!');
        } catch (error) {
            console.error('Failed to add reminder:', error);
            await ctx.reply('❌ حدث خطأ أثناء إضافة التذكير. حاول مرة أخرى لاحقًا.');
        }

        // إنهاء المشهد
        return ctx.scene.leave();
    }
});

// التعامل مع الإلغاء
addReminderScene.command('cancel', async (ctx) => {
    await ctx.reply('❌ تم إلغاء إضافة التذكير.');
    ctx.scene.leave();
});

// وظيفة لإضافة التذكير إلى قاعدة البيانات
const addReminderToDatabase = async (chatId, reminderTime, title, message) => {
    const { addReminder } = await import('../db.mjs');
    await addReminder(chatId, reminderTime, title, message);
};

export { addReminderScene };
