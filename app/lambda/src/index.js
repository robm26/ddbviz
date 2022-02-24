import {
    DynamoDB,
    DynamoDBClient,
    ListTablesCommand,
    ScanCommand,
    QueryCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";

// import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';


export async function handler(event) {

    const Region = event?.Region || 'us-east-1';
    const TableName = event?.TableName;
    const IndexName = event?.IndexName;
    const ActionName = event?.ActionName;
    const PkName = event?.PkName;
    const PkValue = event?.PkValue;
    const SkName = event?.SkName;
    let SkValue = event?.SkValue;
    const ScanCount = event?.ScanCount || 1;
    const ScanLimit = event?.ScanLimit;
    const ReturnFormat = event?.ReturnFormat || 'data';

    //let endpointURL = 'http://localhost:8000';
    let endpointURL = 'https://dynamodb.' + Region + '.amazonaws.com';

    let params = {
        TableName: TableName,
        ReturnConsumedCapacity:'TOTAL',
        Limit: ScanLimit
    };

    if(IndexName) {
        params.IndexName = IndexName;
    }

    const stats = {
        Count:0,
        ScannedCount:0,
        CapacityUnits:0,
        Sampled: {
            Items: 0,
            ItemCollections: 0,
            AvgItemsPerCollection: 0,
            AvgCollectionSize: 0,
            PKs: {}
        }
    };

    // const config = DynamoDBClientConfig({
    //     // credentials: {
    //     //     accessKeyId: process.env.AWS_ACCESS_KEY
    //     //     secretAccessKey: process.env.AWS_SECRET_KEY
    //     // },
    //     region: Region,
    // });
    //
    // config.endpoint = endpointURL;

    // const client = new DynamoDBClient.from(new DynamoDB(config));

    const client = new DynamoDBClient( {
        region:Region,
        endpoint: endpointURL,
        // credentials: {
        //     accessKeyId: "xxx",
        //     secretAccessKey: "yyy",
        // }
    });


    try {
        let results;

        if(ActionName === 'scan') {
            results = await client.send(new ScanCommand(params));
        }

        let kce = "#pk = :pk";
        let ean = {"#pk":PkName};
        let eav = {":pk": {"S":PkValue}};

        if(SkName && SkValue) {

            const firstChar = SkValue.slice(0,1);
            const finalChar = SkValue.slice(-1);

            let operator = '=';

            let kceSort = " And #sk = :sk";

            if(['<','>'].includes(firstChar)) {
                operator = firstChar;
                kceSort = " And #sk " + operator + " :sk";
                SkValue = SkValue.slice(1);

            } else if ('*' === finalChar) {
                kceSort = " And begins_with(#sk, :sk)";
                SkValue = SkValue.slice(0, -1);

            }

            //
            kce = "#pk = :pk " + kceSort;
            ean["#sk"] = SkName;
            eav[":sk"] = {"S":SkValue};


        }

        // console.log(kce);
        // console.log(ean);
        // console.log(eav);

        if(ActionName === 'query') {
            params.KeyConditionExpression = kce;
            params.ExpressionAttributeNames = ean;
            params.ExpressionAttributeValues = eav;

            results = await client.send(new QueryCommand(params));
        }
        if(ActionName === 'get') {
            params = {
                TableName: TableName,
                ReturnConsumedCapacity:'TOTAL',
                Key: {}
            };
            params.Key[PkName] = {'S':PkValue};
            if(SkValue) {
                params.Key[SkName] = {'S':SkValue};
            }

            results = await client.send(new GetItemCommand(params));

        }

        return results;

    } catch (error) {

        console.log(error.name + ' : ' + error.message);

        return 'error: ' + error.name;

    }

}
