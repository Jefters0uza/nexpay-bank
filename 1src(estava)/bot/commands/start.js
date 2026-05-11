const path = require('path');

const {
    mainMenu,
    backMenu,
    walletMenu,
    affiliateMenu
} = require('../menus/mainMenu');

const userStates = {};

const usersDatabase = {};

const RULES = {
    deposit: {
        minimum: 20,
        maximum: 1500
    },

    withdraw: {
        minimum: 25,
        fee: 0
    },

    support: {
        startHour: 10,
        endHour: 20
    }
};

const isOperationalTime = () => {

    const currentHour = new Date().getHours();

    return (
        currentHour >= RULES.support.startHour &&
        currentHour < RULES.support.endHour
    );

};

const clearTemporaryMessage = async (ctx) => {

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

module.exports = (bot) => {

    const getUser = (userId) => {

        if (!usersDatabase[userId]) {

            usersDatabase[userId] = {
                balance: 0,
                deposited: 0,
                withdrawed: 0,
                pixData: null,
                createdAt: new Date().toLocaleString('pt-BR')
            };

        }

        return usersDatabase[userId];

    };

    const getHomeCaption = (ctx) => {

        const user = getUser(ctx.from.id);

        const currentDate = new Date();

        const formattedDate = currentDate.toLocaleString('pt-BR');

        return `🏦 <b>BEM-VINDO À NEXPAY BANK</b>

Sua privacidade em primeiro lugar.

━━━━━━━━━━━━━━━

🆔 <b>ID DO USUÁRIO:</b>
<code>${ctx.from.id}</code>

💰 <b>TAXA DA PLATAFORMA:</b>
6% sobre depósitos

🕒 <b>ATUALIZADO EM:</b>
${formattedDate}

━━━━━━━━━━━━━━━

💵 <b>SALDO DISPONÍVEL:</b>

R$ ${user.balance.toFixed(2)}`;

    };

    bot.start(async (ctx) => {

        try {

            delete userStates[ctx.from.id];

            getUser(ctx.from.id);

            await ctx.replyWithPhoto(
                {
                    source: path.resolve(__dirname, '../../assets/logo.jpeg')
                },
                {
                    caption: getHomeCaption(ctx),
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO START:', error);

        }

    });

    bot.action('deposit', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            userStates[ctx.from.id] = {
                action: 'waiting_deposit_amount'
            };

            const depositCaption =
`💳 <b>DEPÓSITO VIA PIX</b>

━━━━━━━━━━━━━━━

📌 <b>REGRAS</b>

• Mínimo: R$ ${RULES.deposit.minimum.toFixed(2)}
• Máximo: R$ ${RULES.deposit.maximum.toFixed(2)}

━━━━━━━━━━━━━━━

💰 <b>TAXA OPERACIONAL</b>

• Entre R$ 20 e R$ 29,99 → taxa fixa R$ 3,50
• Acima de R$ 30 → taxa 6%

━━━━━━━━━━━━━━━

⚡ <b>BENEFÍCIOS</b>

• Liquidação instantânea
• Saques gratuitos
• Sistema online 24/7`;

            await ctx.editMessageCaption(
                depositCaption,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            const askMessage = await ctx.reply(
                `💰 Digite o valor do depósito.`,
            );

            userStates[ctx.from.id].messageId = askMessage.message_id;

        } catch (error) {

            console.log('❌ ERRO NO DEPÓSITO:', error);

        }

    });

    bot.action('withdraw', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const user = getUser(ctx.from.id);

            if (user.balance < RULES.withdraw.minimum) {

                return await ctx.editMessageCaption(
`❌ <b>SALDO INSUFICIENTE</b>

━━━━━━━━━━━━━━━

Saque mínimo permitido:
R$ ${RULES.withdraw.minimum.toFixed(2)}

━━━━━━━━━━━━━━━

Seu saldo atual:
R$ ${user.balance.toFixed(2)}`,
                    {
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

            }

            if (user.pixData) {

                await ctx.editMessageCaption(
`💸 <b>CONFIRMAR CHAVE PIX</b>

━━━━━━━━━━━━━━━

👤 <b>TITULAR</b>
${user.pixData.name}

🔑 <b>TIPO</b>
${user.pixData.type}

🏦 <b>CHAVE PIX</b>
<code>${user.pixData.key}</code>

━━━━━━━━━━━━━━━

Deseja utilizar esta chave PIX para o saque?`,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: '✅ CONFIRMAR',
                                        callback_data: 'confirm_withdraw'
                                    }
                                ],
                                [
                                    {
                                        text: '🔄 ALTERAR CHAVE',
                                        callback_data: 'change_pix'
                                    }
                                ],
                                [
                                    {
                                        text: '⬅️ VOLTAR',
                                        callback_data: 'home'
                                    }
                                ]
                            ]
                        }
                    }
                );

                return;

            }

            userStates[ctx.from.id] = {
                action: 'waiting_pix_name'
            };

            await ctx.editMessageCaption(
`💸 <b>SAQUE VIA PIX</b>

━━━━━━━━━━━━━━━

💰 Saldo disponível:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⚡ Taxa:
0%

━━━━━━━━━━━━━━━

🕒 Horário operacional:
10h às 20h

⚠️ Solicitações realizadas fora do horário
serão processadas no próximo horário útil.

━━━━━━━━━━━━━━━

📌 Primeiro saque detectado.

👤 Envie seu nome completo.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO SAQUE:', error);

        }

    });

    bot.action('wallet', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const user = getUser(ctx.from.id);

            const firstName = ctx.from.first_name || 'Usuário';

            const walletCaption =
`💼 <b>CARTEIRA DIGITAL</b>

━━━━━━━━━━━━━━━

⭐️ <b>CONTA</b>

👤 Titular: ${firstName}

🆔 ID:
<code>${ctx.from.id}</code>

━━━━━━━━━━━━━━━

⚡️ <b>RESUMO FINANCEIRO</b>

├ 💰 Saldo disponível: R$ ${user.balance.toFixed(2)}
├ 📥 Total depositado: R$ ${user.deposited.toFixed(2)}
└ 📤 Total sacado: R$ ${user.withdrawed.toFixed(2)}

━━━━━━━━━━━━━━━

📅 Conta desde:
${user.createdAt}`;

            await ctx.editMessageCaption(
                walletCaption,
                {
                    parse_mode: 'HTML',
                    ...walletMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NA CARTEIRA:', error);

        }

    });

    bot.action('support', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const supportOnline = isOperationalTime();

            const supportStatus = supportOnline
                ? '🟢 SUPORTE ONLINE'
                : '🟡 SUPORTE OFFLINE';

            const supportCaption =
`🎧 <b>CENTRAL DE SUPORTE</b>

━━━━━━━━━━━━━━━

${supportStatus}

🕒 Atendimento humano:
10h às 20h

⚡ Tempo médio:
5 a 30 minutos

━━━━━━━━━━━━━━━

Escolha uma opção abaixo.`;

            await ctx.editMessageCaption(
                supportCaption,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [

                            [
                                {
                                    text: '💳 DEPÓSITOS',
                                    callback_data: 'support_deposit'
                                },
                                {
                                    text: '💸 SAQUES',
                                    callback_data: 'support_withdraw'
                                }
                            ],

                            [
                                {
                                    text: '👥 AFILIADOS',
                                    callback_data: 'support_affiliate'
                                },
                                {
                                    text: '⚠️ REPORTAR',
                                    callback_data: 'support_report'
                                }
                            ],

                            [
                                {
                                    text: '📩 CONTATAR SUPORTE',
                                    callback_data: 'contact_support'
                                }
                            ],

                            [
                                {
                                    text: '⬅️ VOLTAR',
                                    callback_data: 'home'
                                }
                            ]

                        ]
                    }
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO SUPORTE:', error);

        }

    });

    bot.on('text', async (ctx) => {

        try {

            const userState = userStates[ctx.from.id];

            if (!userState) return;

            if (userState.action === 'waiting_deposit_amount') {

                await clearTemporaryMessage(ctx);

                await ctx.reply(
                    `⚡ Sistema PIX será integrado futuramente.`,
                );

                delete userStates[ctx.from.id];

                return;

            }

        } catch (error) {

            console.log('❌ ERRO AO RECEBER TEXTO:', error);

        }

    });

    bot.action('home', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            delete userStates[ctx.from.id];

            await ctx.editMessageCaption(
                getHomeCaption(ctx),
                {
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO HOME:', error);

        }

    });

};