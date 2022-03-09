import {
    DynamoDB,
    DynamoDBClient,
    ListTablesCommand,
    DescribeTableCommand,
    ScanCommand,
    QueryCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";

import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

// import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';


export async function handler(event) {

    const Region = event?.Region || 'us-east-1';
    const TableName = event?.TableName;
    const IndexName = event?.IndexName;
    const ActionName = event?.ActionName;
    const PkName = event?.PkName;
    const PkValue = event?.PkValue;
    const StartDate = event?.StartDate;
    const EndDate = event?.EndDate;

    const SkName = event?.SkName;
    let SkValue = event?.SkValue;

    const ScanCount = event?.ScanCount || 1;
    let ScanLimit = event?.ScanLimit;
    ScanLimit = 100;
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

        if(ActionName === 'list') {

            results = await client.send(new ListTablesCommand(params));
        }

        if(ActionName === 'describe') {
            params = {
                TableName: TableName
            };
            results = await client.send(new DescribeTableCommand(params));
        }

        if(ActionName === 'stats') {

            const queries = [{
                "Id": "w1",
                "MetricStat": {
                    "Metric": {
                        "Namespace": "AWS/DynamoDB",
                        "MetricName": "ConsumedWriteCapacityUnits",
                        "Dimensions": [{"Name": "TableName", "Value": TableName}]
                    },
                    "Period": 60, "Stat": "Sum", "Unit": "Count"
                },
                "ReturnData": true,
            },
                {
                    "Id": "p1",
                    "MetricStat": {
                        "Metric": {
                            "Namespace": "AWS/DynamoDB",
                            "MetricName": "ConsumedReadCapacityUnits",
                            "Dimensions": [{"Name": "TableName", "Value": TableName}]
                        },
                        "Period": 60, "Stat": "Sum", "Unit": "Count"
                    },
                    "ReturnData": true,
                }
            ];

            const params = {
                "Region": Region,
                "MetricDataQueries" : queries,
                "StartTime": new Date(StartDate),
                "EndTime":   new Date(EndDate)
            };

            const cwClient = new CloudWatchClient({ region: Region });
            const command = new GetMetricDataCommand(params);
            const response = await cwClient.send(command);

            // console.log(JSON.stringify(response, null, 2));

            results = response;

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
