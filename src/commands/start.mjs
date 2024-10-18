// commands/start.mjs
export default async function startCommand(ctx) {
    const userName = ctx.from.first_name || ctx.from.username; // اسم المستخدم أو الاسم الأول
    const botUsername = ctx.botInfo.username; // اسم مستخدم البوت

    let welcomeMessage = `👋 <b>مرحبًا بك، ${userName}!</b> \n\n`;
    welcomeMessage += `هذا البوت يساعدك في إدارة التذكيرات. يمكنك من خلاله:\n`;
    welcomeMessage += `1️⃣ <b>إضافة تذكير جديد:</b> /add\n`;
    welcomeMessage += `2️⃣ <b>حذف تذكير:</b> /delete\n`;
    welcomeMessage += `3️⃣ <b>عرض التذكيرات الحالية:</b> /show\n\n`;
    welcomeMessage += `<b>💡 يمكنك استخدام هذا البوت في المجموعات، ويجب أن يكون مشرفًا.</b>\n`;
    welcomeMessage += `<b>📌 لإضافة البوت إلى المجموعة، استخدم الرابط:</b> <a href="https://t.me/${botUsername}?startgroup=">أضف البوت</a>\n\n`;
    welcomeMessage += `إذا كان لديك أي استفسار أو تحتاج إلى مساعدة، فلا تتردد في التواصل معي على @f93ii!`;

    await ctx.reply(welcomeMessage, {
        parse_mode: "HTML",
        disable_web_page_preview: true, // تعطيل معاينة الرابط
    });
}
