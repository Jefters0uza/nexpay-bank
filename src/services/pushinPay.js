const axios = require('axios');

const api = axios.create({
    baseURL: 'https://api.pushinpay.com.br/api',
    headers: {
        Authorization: `Bearer ${process.env.PUSHINPAY_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
});

const createPixDeposit = async (value, webhookUrl) => {

    try {

        const valueInCents = Math.floor(value * 100);

        const response = await api.post('/pix/cashIn', {
            value: valueInCents,
            webhook_url: webhookUrl
        });

        return response.data;

    } catch (error) {

        console.log('❌ ERRO PUSHINPAY');
        console.log(error.response?.data || error.message);

        return null;

    }

};

module.exports = {
    createPixDeposit
};