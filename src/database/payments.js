const fs = require('fs');

const path = require('path');

/*
=================================
DATABASE PATH
=================================
*/

const databasePath = path.resolve(
    __dirname,
    '../data/payments.json'
);

/*
=================================
DATABASE
=================================
*/

let paymentsDatabase = {};

/*
=================================
LOAD DATABASE
=================================
*/

const loadPaymentsDatabase = () => {

    try {

        if (
            !fs.existsSync(databasePath)
        ) {

            fs.writeFileSync(
                databasePath,
                '{}'
            );

        }

        const data =
            fs.readFileSync(
                databasePath,
                'utf-8'
            );

        paymentsDatabase =
            JSON.parse(data);

        console.log(
            '✅ PAYMENTS DATABASE CARREGADA'
        );

    } catch (error) {

        console.log(
            '❌ ERRO LOAD PAYMENTS'
        );

        console.log(error);

        paymentsDatabase = {};

    }

};

/*
=================================
SAVE DATABASE
=================================
*/

const savePaymentsDatabase = () => {

    try {

        fs.writeFileSync(

            databasePath,

            JSON.stringify(
                paymentsDatabase,
                null,
                4
            )

        );

    } catch (error) {

        console.log(
            '❌ ERRO SAVE PAYMENTS'
        );

        console.log(error);

    }

};

/*
=================================
CREATE PAYMENT
=================================
*/

const createPayment = (
    paymentId,
    data
) => {

    paymentsDatabase[
        paymentId
    ] = data;

    savePaymentsDatabase();

};

/*
=================================
GET PAYMENT
=================================
*/

const getPayment = (
    paymentId
) => {

    return paymentsDatabase[
        paymentId
    ];

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

    if (
        !paymentsDatabase[
            paymentId
        ]
    ) {

        return;

    }

    paymentsDatabase[
        paymentId
    ] = {

        ...paymentsDatabase[
            paymentId
        ],

        ...data

    };

    savePaymentsDatabase();

};

/*
=================================
INIT
=================================
*/

loadPaymentsDatabase();

/*
=================================
EXPORTS
=================================
*/

module.exports = {

    paymentsDatabase,

    createPayment,

    getPayment,

    updatePayment,

    savePaymentsDatabase

};