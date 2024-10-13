// دالة لجلب جميع المستخدمين في المحادثة
export default async function getAllChatMembers(ctx) {
    const chatId = ctx.chat.id; // الحصول على معرف المحادثة
    const users = [];

    try {
        const membersCount = await ctx.telegram.getChatMembersCount(chatId); // عدد الأعضاء في المحادثة

        const isSuperGroup = ctx.chat.type === 'supergroup';
        const MAX_MEMBERS = isSuperGroup ? 200000 : 200;
        if (membersCount > MAX_MEMBERS) {
            throw new Error(`عدد الأعضاء (${membersCount}) يتجاوز الحد الأقصى المسموح به (${MAX_MEMBERS}).`);
        }

        // جلب معلومات الأعضاء واحدًا تلو الآخر
        for (let i = 0; i < membersCount; i++) {
            try {
                const member = await ctx.telegram.getChatMember(chatId, i);
                users.push(member.user); // إضافة المستخدم إلى القائمة
            } catch (error) {
                console.error(`فشل في جلب العضو رقم ${i}:`, error);
                // يمكنك إبلاغ المستخدم بوجود مشكلة مع هذا العضو إذا رغبت
            }
        }
    } catch (error) {
        console.error('فشل في جلب عدد الأعضاء أو المعلومات:', error);
        throw new Error('حدث خطأ أثناء جلب الأعضاء. يرجى المحاولة لاحقًا.');
    }

    return users; // إرجاع قائمة المستخدمين
}
