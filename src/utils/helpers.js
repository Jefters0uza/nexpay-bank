const clearTemporaryMessage = async (
    ctx,
    userStates
) => {

    try {

        const state = userStates[ctx.from.id];

        if (!state) return;

        if (!state.messageId) return;

        await ctx.telegram.deleteMessage(
            ctx.chat.id,
            state.messageId
        );

        delete userStates[ctx.from.id].messageId;

    } catch (error) {

    }

};

const isOperationalTime = () => {

    const currentHour = new Date().getHours();

    return (
        currentHour >= 10 &&
        currentHour < 20
    );

};

module.exports = {
    clearTemporaryMessage,
    isOperationalTime
};