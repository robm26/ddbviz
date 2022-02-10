import AWS from 'aws-sdk';


export const listTables = async (connection) => {

    const dynamodb = new AWS.DynamoDB(prepareAwsConfig(connection));
    let err;

    const data = await dynamodb.listTables()
        .promise()
        .catch((error) => {
            // console.log(JSON.stringify(error.message));
            err = error.message;
        });
    if(err) {
        return err;
    } else {
        return data.TableNames;
    }

};

export const getTableMetadata = async (connection, table) => {

    const dynamodb = new AWS.DynamoDB(prepareAwsConfig(connection));

    let data = await dynamodb.describeTable({TableName:table}).promise();

    return data.Table;

};

function prepareAwsConfig(connection) {
    let endpoint;
    let region;
    if(connection.substring(0,9) === 'localhost') {
        endpoint = 'http://' + connection;
        region = 'us-east-1';
    } else {
        endpoint = 'https://dynamodb.' + connection + '.amazonaws.com';
        region = connection;
    }

    let ret =  {
        region:region,
        endpoint:endpoint
    };

    return ret;
}
