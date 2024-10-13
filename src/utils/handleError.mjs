// معالج الأخطاء 
import { deleteChat, deleteMember, addChat } from '../db.mjs';

export default async function handleError(client, error) {
    if (error.response && error.response.description) {
        switch (error.response.description) {
            case "Bad Request: message text is empty":
                const emptyMessageWarning = 'النص الذي تحاول إرساله فارغ.';
                await client.telegram.sendMessage(error.on.payload.chat_id, emptyMessageWarning);
                console.warn(emptyMessageWarning);
                break;

            case "Bad Request: the bot was blocked by the user":
                console.warn('تم حظر البوت من قبل المستخدم.');
                await deleteChat(error.on.payload.chat_id); // حذف السجل من جدول المحادثات
                break;

            case "Bad Request: user not found":
                console.warn('المستخدم غير موجود.');
                await deleteMember(error.on.payload.user_id, error.on.payload.chat_id); // حذف السجل من جدول المحادثات
                break;

            case "Bad Request: chat not found":
                console.warn('الدردشة غير موجودة.');
                await deleteChat(error.on.payload.chat_id); // حذف السجل من قاعدة البيانات من جدول المحادثات
                break;

            case "Bad Request: message to delete not found":
                const notFoundMessage = 'لم يتم العثور على الرسالة لحذفها.';
                await client.telegram.sendMessage(error.on.payload.chat_id, notFoundMessage);
                console.warn(notFoundMessage);
                break;

            case "Bad Request: message can't be deleted for everyone":
                const deletePermissionMessage = 'لا يمكن حذف الرسالة للجميع.';
                await client.telegram.sendMessage(error.on.payload.chat_id, deletePermissionMessage);
                console.warn(deletePermissionMessage);
                break;

            case "Forbidden: bot was kicked from the supergroup chat":
                console.warn('تم طرد البوت من المجموعة الفائقة.');
                await deleteChat(error.on.payload.chat_id); // حذف السجل من جدول المحادثات
                break;

            case "Forbidden: user is deactivated":
                console.warn('تم تعطيل المستخدم.');
                await deleteMember(error.on.payload.user_id, error.on.payload.chat_id); // حذف السجل من جدول المحادثات
                break;

            case "Forbidden: not enough rights to send messages":
                const id_user = error.on.payload.chat_id;
                const permissionMessage = 'لا توجد صلاحيات كافية لإرسال رسائل نصية.';
                // await client.telegram.sendMessage(id_user, permissionMessage);
                console.warn(permissionMessage);
                break;

            case "Bad Gateway":
                console.error('خطأ في البوابة، قد يكون هناك مشاكل في الاتصال بـ Telegram.');
                break;

            case "Internal Server Error":
                console.error('خطأ داخلي في خادم Telegram.');
                break;

            case "Timeout":
                console.error('انتهى وقت الانتظار للطلب.');
                break;

            case "Too Many Requests: retry after X seconds":
                console.warn('تم تجاوز حد الطلبات المسموح به، يجب إعادة المحاولة بعد عدد معين من الثواني.');
                break;

            case "Bad Request: group chat was upgraded to a supergroup chat":
                console.warn('تمت ترقية المجموعة إلى مجموعة فائقة.');
                await deleteChat(error.on.payload.chat_id);
                await addChat(error.response.parameters.migrate_to_chat_id, 'supergroup', error.on.payload.title, error.on.payload.username); // تحديث المعرف في قاعدة البيانات
                break;

            default:
                console.warn(`حدث خطأ غير محدد: ${error.response.description}`);
                break;
        }
    } else {
        console.error('خطأ غير معروف:', error);
    }
}