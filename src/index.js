require('dotenv').config();

const { Telegraf } = require('telegraf');

const express = require('express');

const cors = require('cors');

const helmet = require('helmet');

const morgan = require('morgan');

const startCommand =
    require('./bot/commands/start');

const {
    usersDatabase,
    getUser,
    addHistory
} = require('./database/users');

const app = express();

const bot =
    new Telegraf(
        process.env.BOT_TOKEN
    );

/*
==================================
MIDDLEWARES EXPRESS
==================================
*/

app.use(cors());

app.use(helmet());

app.use(morgan('dev'));

app.use(express.json());

/*
==================================
DEBUG UPDATES
==================================
*/

bot.use(async (ctx, next) => {

    try {

        console.log(
            '📩 UPDATE RECEBIDO:',
            ctx.updateType
        );

        if (ctx.message?.text) {

            console.log(
                '💬 MSG:',
                ctx.message.text
            );

        }

        await next();

    } catch (error) {

        console.log(
            '❌ ERRO MIDDLEWARE'
        );

        console.log(error);

    }

});

/*
==================================
PAYMENTS
==================================
*/

const pendingPayments = {};

/*
==================================
COMMANDS
==================================
*/

startCommand(
    bot,
    usersDatabase,
    pendingPayments
);

/*
==================================
ROUTES
==================================
*/

app.get('/', (req, res) => {

    return res.json({

        status: true,

        message:
            'NexPay API ONLINE'

    });

});

/*
==================================
WEBHOOK PUSHINPAY
==================================
*/

app.post(
    '/webhook/pushinpay',

    async (req, res) => {

        try {

            const paymentData =
                req.body;

            console.log(
                '💰 WEBHOOK RECEBIDO'
            );

            console.log(paymentData);

            if (
                !paymentData ||
                !paymentData.id
            ) {

                return res
                    .status(400)
                    .json({
                        error: true
                    });

            }

            const payment =
                pendingPayments[
                    paymentData.id
                ];

            if (!payment) {

                return res
                    .status(200)
                    .json({
                        received: true
                    });

            }

            if (
                payment.status ===
                'paid'
            ) {

                return res
                    .status(200)
                    .json({
                        received: true
                    });

            }

            if (
                paymentData.status ===
                'paid'
            ) {

                payment.status = 'paid';

                const user =
                    getUser(
                        payment.userId
                    );

                user.balance +=
                    payment.amount;

                user.deposited +=
                    payment.amount;

                addHistory(
                    payment.userId,
                    'DEPÓSITO PIX',
                    payment.amount
                );

                try {

                    await bot.telegram.sendMessage(

                        payment.userId,

`✅ <b>DEPÓSITO CONFIRMADO</b>

💰 Valor:
R$ ${payment.amount.toFixed(2)}`,

                        {
                            parse_mode:
                                'HTML'
                        }

                    );

                } catch (error) {

                    console.log(error);

                }

            }

            return res
                .status(200)
                .json({
                    success: true
                });

        } catch (error) {

            console.log(
                '❌ ERRO WEBHOOK'
            );

            console.log(error);

            return res
                .status(500)
                .json({
                    error: true
                });

        }

    }
);

/*
==================================
SERVER
==================================
*/

const PORT =
    process.env.PORT || 3000;

async function startServer() {

    try {

        console.log(
            '🚀 INICIANDO BOT'
        );

        const botInfo =
            await bot.telegram.getMe();

        console.log(
            `🤖 @${botInfo.username}`
        );

        /*
        ==============================
        REMOVE WEBHOOK
        ==============================
        */

        await bot.telegram.deleteWebhook();

        console.log(
            '🧹 WEBHOOK REMOVIDO'
        );

        /*
        ==============================
        START BOT
        ==============================
        */

        await bot.launch();

        console.log(
            '✅ BOT ONLINE'
        );

        /*
        ==============================
        EXPRESS
        ==============================
        */

        app.listen(PORT, () => {

            console.log(
                `🌐 PORTA ${PORT}`
            );

        });

    } catch (error) {

        console.log(
            '❌ ERRO START SERVER'
        );

        console.log(error);

    }

}

startServer();

/*
==================================
STOP
==================================
*/

process.once(
    'SIGINT',

    () => {

        bot.stop('SIGINT');

    }
);

process.once(
    'SIGTERM',

    () => {

        bot.stop('SIGTERM');

    }
);