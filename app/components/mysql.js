const mysql      = require('mysql');
const util = require('util');

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

const connection = mysql.createConnection(config);
const query = util.promisify(connection.query).bind(connection);


export const getInfo = async (key) => {
    return(config[key]);
}

export const runSql = async (sql) => {

    connection.connect();

    const result = await query(sql);

    connection.end();

    return(result);
}
