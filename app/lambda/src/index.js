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

    const PkType = typeof PkValue === 'string' ? 'S' : 'N';
    let SkType;
    if(SkValue) {
        SkType = typeof SkValue === 'string' ? 'S' : 'N';
    }


    let endpointURL = 'https://dynamodb.' + Region + '.amazonaws.com';

    if(Region === 'localhost:8000') {
        endpointURL = 'http://' + Region
    }

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

              //   ******************** QUERY
        if(ActionName === 'query') {
            let kce = "#pk = :pk";
            let ean = {"#pk":PkName};
            let eav = {};
            eav[":pk"] = {};
            eav[":pk"][PkType] = PkType === 'S' ? PkValue : PkValue.toString();


            if(SkName && SkValue) {
                let firstChar;
                let finalChar;

                if (SkType === 'S') {
                    firstChar = SkValue.slice(0,1);
                    finalChar = SkValue.slice(-1);
                }

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

                kce = "#pk = :pk " + kceSort;
                ean["#sk"] = SkName;

                eav[":sk"] = {};
                eav[":sk"][SkType] = SkType === 'S' ? SkValue : SkValue.toString();

            }

            // console.log(kce);
            // console.log(ean);
            // console.log(eav);


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

            params.Key[PkName] = {};
            params.Key[PkName][PkType] = PkValue.toString();


            if(SkValue) {

                params.Key[SkName] = {};
                params.Key[SkName][SkType] = SkValue.toString();
            }

            results = await client.send(new GetItemCommand(params));

        }

        return results;

    } catch (error) {

        return {
            error: {
                name: error.name,
                message: error.message
            }
        };

    }

}
