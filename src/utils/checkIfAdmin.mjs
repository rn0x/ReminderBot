export default async function checkIfAdmin(ctx) {
    try {
        const chatId = ctx.chat.id;
        const administrators = await ctx.telegram.getChatAdministrators(chatId);
        const userId = ctx.from.id;

        // تحقق مما إذا كان المستخدم في قائمة المشرفين
        return administrators.some(admin => admin.user.id === userId);
    } catch (error) {
        console.error('خطأ في جلب المشرفين:', error);
        return false; // في حالة حدوث خطأ، لا تعطي صلاحيات
    }
};