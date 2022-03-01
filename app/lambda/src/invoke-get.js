
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import {handler} from './index.js';

let region       = 'us-east-2'; //  DDB target region


const lambdaRegion = 'us-west-1';

const requestBody = {
    'Region': region,
    'TableName': 'Customer360',
    'ActionName': 'get',
    'PkName': 'pkey',
    'PkValue': 'cust101',
    'SkName': 'skey',
    'SkValue': '20191104',
    'ReturnFormat': 'both'
};


const executeFunction = async (requestBody) => {



    let response;
    const myArgs = process.argv.slice(2);


    // if(!isNaN(requestBody.PkValue)) {
    //     if(requestBody.PkValue.indexOf(".") > -1) {
    //         requestBody.PkValue = parseFloat(requestBody.PkValue);
    //     } else {
    //         requestBody.PkValue = parseInt(requestBody.PkValue);
    //     }
    // }
    //
    // if(!isNaN(requestBody.SkValue)) {
    //
    //     if(requestBody.SkValue.indexOf(".") > -1) {
    //         requestBody.SkValue = parseFloat(requestBody.SkValue);
    //     } else {
    //         requestBody.SkValue = parseInt(requestBody.SkValue);
    //     }
    // }


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
            const data = new TextDecoder('utf-8').decode(response.Payload);

            console.log(JSON.parse(data));

        } catch (error) {

            console.log(JSON.stringify(error, null, 2));
        }

    }

};

executeFunction(requestBody);

