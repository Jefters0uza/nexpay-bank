const fs = require('fs');
/*
=================================
CREATE PAYMENT
=================================
*/

const createPayment = (
    paymentId,
    data
) => {

    paymentsDatabase[paymentId] = data;

    savePaymentsDatabase();

};

/*
=================================
GET PAYMENT
=================================
*/

const getPayment = (paymentId) => {

    return paymentsDatabase[paymentId];

};

/*
=================================
UPDATE PAYMENT
=================================
*/

const updatePayment = (
    paymentId,
    data
) => {

    if (!paymentsDatabase[paymentId]) {

        return;

    }

    paymentsDatabase[paymentId] = {

        ...paymentsDatabase[paymentId],

        ...data

    };

    savePaymentsDatabase();

};

loadPaymentsDatabase();

module.exports = {

    paymentsDatabase,

    createPayment,

    getPayment,

    updatePayment,

    savePaymentsDatabase

};