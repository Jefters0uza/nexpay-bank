require('dotenv').config();

const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const startCommand = require('./bot/commands/start');

const {
    usersDatabase,
    getUser,
    addHistory
} = require('./database/users');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

const pendingPayments = {};

startCommand(
    bot,
    usersDatabase,
    pendingPayments
);

app.get('/', (req, res) => {

    res.json({
        status: true,
        message: 'NexPay API ONLINE'
    });

});

app.post('/webhook/pushinpay', async (req, res) => {

    try {

        const paymentData = req.body;

        console.log('💰 WEBHOOK RECEBIDO');
        console.log(paymentData);

        if (
            !paymentData ||
            !paymentData.id
        ) {

            return res.status(400).json({
                error: true
            });

        }

        const payment =
            pendingPayments[paymentData.id];

        if (!payment) {

            return res.status(200).json({
                received: true
            });

        }

        if (payment.status === 'paid') {

            return res.status(200).json({
                received: true
            });

        }

        if (
            paymentData.status === 'paid'
        ) {

            payment.status = 'paid';

            const user =
                getUser(payment.userId);

            user.balance += payment.amount;

            user.deposited += payment.amount;

            addHistory(
                payment.userId,
                'DEPÓSITO PIX',
                payment.amount
            );

            /*
            ===================================
            SISTEMA DE AFILIADOS
            ===================================
            */

            if (
                user.invitedBy &&
                !payment.affiliatePaid
            ) {

                const affiliateUser =
                    getUser(
                        user.invitedBy
                    );

                const commission =
                    payment.amount * 0.015;

                affiliateUser.balance +=
                    commission;

                affiliateUser.affiliateBalance +=
                    commission;

                affiliateUser.affiliateEarnings +=
                    commission;

                affiliateUser.referrals.push({
                    userId: payment.userId,
                    amount: payment.amount
                });

                addHistory(
                    user.invitedBy,
                    'COMISSÃO AFILIADO',
                    commission
                );

                payment.affiliatePaid = true;

                try {

                    await bot.telegram.sendMessage(
                        user.invitedBy,
`💸 <b>COMISSÃO RECEBIDA</b>

━━━━━━━━━━━━━━━

👤 Novo indicado ativo.

💰 Comissão:
R$ ${commission.toFixed(2)}

━━━━━━━━━━━━━━━

⚡ Valor já disponível
em sua carteira.`,
                        {
                            parse_mode: 'HTML'
                        }
                    );

                } catch (error) {

                    console.log(
                        '❌ ERRO COMISSÃO AFILIADO'
                    );

                }

            }

            try {

                await bot.telegram.sendMessage(
                    payment.userId,
`✅ <b>DEPÓSITO CONFIRMADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${payment.amount.toFixed(2)}

━━━━━━━━━━━━━━━

⚡ O valor já está
disponível em sua carteira.`,
                    {
                        parse_mode: 'HTML'
                    }
                );

            } catch (error) {

                console.log(
                    '❌ ERRO MSG USER'
                );

            }

            try {

                await bot.telegram.sendMessage(
                    process.env.ADMIN_TELEGRAM_ID,
`💸 <b>NOVO DEPÓSITO PAGO</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${payment.firstName}

🆔 ID:
<code>${payment.userId}</code>

💰 Valor:
R$ ${payment.amount.toFixed(2)}

━━━━━━━━━━━━━━━

✅ STATUS:
PAGO`,
                    {
                        parse_mode: 'HTML'
                    }
                );

            } catch (error) {

                console.log(
                    '❌ ERRO MSG ADMIN'
                );

            }

        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        console.log('❌ ERRO WEBHOOK');
        console.log(error);

        return res.status(500).json({
            error: true
        });

    }

});

const PORT =
    process.env.PORT || 3000;

async function startServer() {

    try {

        const botInfo =
            await bot.telegram.getMe();

        console.log(
            `🤖 Bot conectado: @${botInfo.username}`
        );

        bot.launch({
            dropPendingUpdates: true
        });

        console.log(
            '🤖 Bot NexPay ONLINE'
        );

        app.listen(PORT, () => {

            console.log(
                `🚀 Servidor rodando na porta ${PORT}`
            );

        });

    } catch (error) {

        console.log(
            '❌ ERRO AO INICIAR O BOT'
        );

        console.log(error);

    }

}

startServer();

process.once('SIGINT', () => {

    bot.stop('SIGINT');

});

process.once('SIGTERM', () => {

    bot.stop('SIGTERM');

});