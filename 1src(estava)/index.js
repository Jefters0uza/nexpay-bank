require('dotenv').config();

const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const startCommand = require('./bot/commands/start');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

startCommand(bot);

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'NexPay API ONLINE'
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {

    try {

        const botInfo = await bot.telegram.getMe();

        console.log(`🤖 Bot conectado: @${botInfo.username}`);

        bot.launch({
            dropPendingUpdates: true
        });

        console.log('🤖 Bot NexPay ONLINE');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });

    } catch (error) {

        console.log('❌ ERRO AO INICIAR O BOT');
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