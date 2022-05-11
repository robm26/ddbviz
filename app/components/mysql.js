const mysql = require('mysql');
const util  = require('util');

// copy the following into file mysql-credentials.json
// {
//     host     : 'rmeg2eeeeeesqx.cwbe83eeeewr.us-east-1.rds.amazonaws.com',
//     user     : 'user',
//     password : 'TopSecretPassword',
//     database : 'customer_activity'
// };

import config from './mysql-credentials.json';

export const database = config.database;
export const host = config.host;

// config.rowsAsArray = true;

const connection = mysql.createConnection(config);
const query = util.promisify(connection.query).bind(connection);


export const getInfo = async (key) => {
    return(config[key]);
}

export const runSql = async (sql) => {

    let result;

    try {
        connection.connect();
        const options = {sql: sql};
        result = await query(options);

        // console.log(result);
        // console.log(typeof result);


    }  catch (error) {

        console.log(JSON.stringify(error, null, 2));
        result = {
            error:error
        };
    }

    connection.end();

    return(result);
}
