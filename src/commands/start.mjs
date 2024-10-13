// commands/start.mjs
export default async function startCommand(ctx) {
    const userName = ctx.from.first_name || ctx.from.username; // اسم المستخدم أو الاسم الأول
    const botUsername = ctx.botInfo.username; // اسم مستخدم البوت

    await ctx.reply(
        `👋 *مرحبًا بك، ${userName}!* \n\n` +
        `هذا البوت يساعدك في إدارة التذكيرات. يمكنك من خلاله:\n` +
        `1️⃣ *إضافة تذكير جديد:* /add\n` +
        `2️⃣ *حذف تذكير:* /delete\n` +
        `3️⃣ *عرض التذكيرات الحالية:* /show\n\n` +
        `💡 *يمكنك استخدام هذا البوت في المجموعات، ويجب أن يكون مشرفًا.*\n` +
        `📌 *لإضافة البوت إلى المجموعة، استخدم الرابط:* [أضف البوت](https://t.me/${botUsername}?startgroup=)\n\n` +
        `إذا كان لديك أي استفسار أو تحتاج إلى مساعدة، فلا تتردد في التواصل معي على @f93ii!`,
        {
            parse_mode: "Markdown",
            disable_web_page_preview: true, // تعطيل معاينة الرابط
        }
    );
}
