
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import {handler} from './index.js';

const region       = 'us-east-2'; //  DDB target region

const lambdaRegion = 'us-west-1';

const requestBody = {
    'Region': region,
    'ActionName': 'describe',
    'TableName': 'Customer360'
};

const executeFunction = async (requestBody) => {

    let response;
    const myArgs = process.argv.slice(2);


    if(myArgs.length>0 && myArgs[0] === 'local'){   // ******* execute local source file index.js

        response = await handler(requestBody);

        console.log(response);


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
            // const data = new TextDecoder('utf-8').decode(response.Payload);


        } catch (error) {

            console.log(JSON.stringify(error, null, 2));
        }

    }

};

executeFunction(requestBody);

