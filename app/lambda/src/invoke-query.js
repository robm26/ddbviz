
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import {handler} from './index.js';

const region       = 'us-west-2'; //  DDB target region

const lambdaRegion = 'us-west-1';

const requestBody = {
    'Region': region,
    'TableName': 'DemoTable04',
    'ActionName': 'query',
    'PkName': 'product',
    'PkValue': 'Car',
    'SkName': 'rating',
    'SkValue': '<17.55',
    'SkValueType' : 'N',
    'ScanCount': 10,
    'ScanLimit': 10,
    'ReturnFormat': 'both'
};

requestBody.IndexName = 'GSI1';

const executeFunction = async (requestBody) => {

    let response;
    const myArgs = process.argv.slice(2);


    if(myArgs.length>0 && myArgs[0] === 'local'){   // ******* execute local source file index.js

        try {
            response = await handler(requestBody);
            console.log(response);

        } catch (error) {

            console.log(JSON.stringify(error, null, 2));
        }


    } else {               // ******* invoke remote Lambda function (must deploy it first)


        const client = new LambdaClient({ region: lambdaRegion });

        const params = {
            FunctionName: 'ddbviz',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(requestBody)
        };

        const command = new InvokeCommand(params);

        try {
            response = await client.send(command);
            const data = new TextDecoder('utf-8').decode(response.Payload);

            console.log(JSON.parse(data));

        } catch (error) {

            // console.log(JSON.stringify(error, null, 2));
        }

    }

};

executeFunction(requestBody);

