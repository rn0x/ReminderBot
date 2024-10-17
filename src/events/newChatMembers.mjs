import { addMember } from '../db.mjs';

export default async function handleNewChatMembers(ctx) {
    const newMembers = ctx.message.new_chat_members;

    for (const member of newMembers) {
        console.log(`New member joined: ${member.id}`);
        console.log(`chat: ${ctx.chat.id}`);
        try {
            await addMember(member.id, ctx.chat.id, member?.username || null);
            console.log(`Added member ${member.id} to the database.`);
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    }
}