const path = require('path');
const QRCode = require('qrcode');

const {
    mainMenu,
    backMenu,
    walletMenu
} = require('../menus/mainMenu');

const {
    createPixDeposit
} = require('../../services/pushinPay');

const {
    userStates
} = require('../../states/userStates');

const {
    getUser
} = require('../../database/users');

const {
    clearTemporaryMessage,
    isOperationalTime
} = require('../../utils/helpers');

const RULES = {
    deposit: {
        minimum: 20,
        maximum: 1500
    },

    withdraw: {
        minimum: 25
    }
};

module.exports = (
    bot,
    usersDatabase,
    pendingPayments
) => {

    const getHomeCaption = (ctx) => {

        const user = getUser(ctx.from.id);

        const formattedDate =
            new Date().toLocaleString('pt-BR');

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
                    source: path.resolve(
                        __dirname,
                        '../../assets/logo.jpeg'
                    )
                },
                {
                    caption: getHomeCaption(ctx),
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO START');
            console.log(error);

        }

    });

    bot.action('deposit', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            userStates[ctx.from.id] = {
                action: 'waiting_deposit_amount'
            };

            await ctx.editMessageCaption(
`💳 <b>DEPÓSITO VIA PIX</b>

━━━━━━━━━━━━━━━

📌 REGRAS

• Mínimo: R$ 20
• Máximo: R$ 1500

━━━━━━━━━━━━━━━

💰 Digite o valor do depósito.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            const askMessage =
                await ctx.reply(
                    `💰 Envie o valor do depósito.`
                );

            userStates[
                ctx.from.id
            ].messageId =
                askMessage.message_id;

        } catch (error) {

            console.log('❌ ERRO DEPOSIT');
            console.log(error);

        }

    });

    bot.on('text', async (ctx) => {

        try {

            const userState =
                userStates[ctx.from.id];

            if (!userState) return;

            if (
                userState.action !==
                'waiting_deposit_amount'
            ) return;

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const value = Number(
                ctx.message.text
                    .replace(',', '.')
                    .replace('R$', '')
                    .trim()
            );

            if (
                isNaN(value) ||
                value < RULES.deposit.minimum ||
                value > RULES.deposit.maximum
            ) {

                const askMessage =
                    await ctx.reply(
                        `❌ Valor inválido.\n\nDigite entre R$ ${RULES.deposit.minimum} e R$ ${RULES.deposit.maximum}.`
                    );

                userStates[
                    ctx.from.id
                ].messageId =
                    askMessage.message_id;

                return;

            }

            const webhookUrl =
                'https://tecofertamax.shop/webhook/pushinpay';

            const payment =
                await createPixDeposit(
                    value,
                    webhookUrl
                );

            if (!payment) {

                await ctx.reply(
                    '❌ Erro ao gerar PIX.'
                );

                return;

            }

            pendingPayments[payment.id] = {
                id: payment.id,
                amount: value,
                userId: ctx.from.id,
                firstName: ctx.from.first_name,
                status: 'pending'
            };

            const qrCodeImage =
                await QRCode.toBuffer(
                    payment.qr_code
                );

            await ctx.replyWithPhoto(
                {
                    source: qrCodeImage
                },
                {
                    caption:
`💳 <b>PAGAMENTO PIX GERADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${value.toFixed(2)}

━━━━━━━━━━━━━━━

📋 PIX COPIA E COLA

<code>${payment.qr_code}</code>

━━━━━━━━━━━━━━━

⚠️ O saldo será liberado
somente após pagamento REAL.

━━━━━━━━━━━━━━━

🕒 Aguardando pagamento...`,
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            await bot.telegram.sendMessage(
                process.env.ADMIN_TELEGRAM_ID,
`💰 <b>NOVO PIX GERADO</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

💵 Valor:
R$ ${value.toFixed(2)}

🧾 TXID:
<code>${payment.id}</code>

━━━━━━━━━━━━━━━

⏳ STATUS:
AGUARDANDO PAGAMENTO`,
                {
                    parse_mode: 'HTML'
                }
            );

            delete userStates[ctx.from.id];

        } catch (error) {

            console.log('❌ ERRO TEXT');
            console.log(error);

        }

    });

    bot.action('withdraw', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const user = getUser(ctx.from.id);

            if (
                user.balance <
                RULES.withdraw.minimum
            ) {

                return await ctx.editMessageCaption(
`❌ <b>SALDO INSUFICIENTE</b>

━━━━━━━━━━━━━━━

💸 Mínimo saque:
R$ ${RULES.withdraw.minimum.toFixed(2)}

━━━━━━━━━━━━━━━

💰 Saldo:
R$ ${user.balance.toFixed(2)}`,
                    {
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

            }

            await ctx.editMessageCaption(
`💸 <b>SAQUE SOLICITADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⏳ Saque enviado
para análise manual.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            await bot.telegram.sendMessage(
                process.env.ADMIN_TELEGRAM_ID,
`💸 <b>NOVO PEDIDO DE SAQUE</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

💰 Saldo:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⚠️ Aguardando análise.`,
                {
                    parse_mode: 'HTML'
                }
            );

        } catch (error) {

            console.log('❌ ERRO WITHDRAW');
            console.log(error);

        }

    });

    bot.action('wallet', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const user = getUser(ctx.from.id);

            await ctx.editMessageCaption(
`💼 <b>CARTEIRA DIGITAL</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

━━━━━━━━━━━━━━━

💰 Saldo:
R$ ${user.balance.toFixed(2)}

📥 Depositado:
R$ ${user.deposited.toFixed(2)}

📤 Sacado:
R$ ${user.withdrawed.toFixed(2)}

━━━━━━━━━━━━━━━

📅 Criada em:
${user.createdAt}`,
                {
                    parse_mode: 'HTML',
                    ...walletMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO WALLET');
            console.log(error);

        }

    });

    bot.action('support', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const supportOnline =
                isOperationalTime();

            const supportStatus =
                supportOnline
                    ? '🟢 ONLINE'
                    : '🟡 OFFLINE';

            await ctx.editMessageCaption(
`🎧 <b>SUPORTE</b>

━━━━━━━━━━━━━━━

${supportStatus}

🕒 Atendimento:
10h às 20h`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO SUPPORT');
            console.log(error);

        }

    });

    bot.action('home', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            delete userStates[ctx.from.id];

            await ctx.editMessageCaption(
                getHomeCaption(ctx),
                {
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO HOME');
            console.log(error);

        }

    });

};