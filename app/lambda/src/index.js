import {
    DynamoDB,
    DynamoDBClient,
    ListTablesCommand,
    DescribeTableCommand,
    ScanCommand,
    QueryCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";

import {DynamoDBStreamsClient, DescribeStreamCommand} from "@aws-sdk/client-dynamodb-streams";

import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

import { PricingClient, DescribeServicesCommand, GetProductsCommand } from "@aws-sdk/client-pricing";

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

    const Field = event?.Field;  // pricing api
    const Value = event?.Value;

    const SkName = event?.SkName;
    let SkValue = event?.SkValue;

    const ScanCount = event?.ScanCount || 1;
    let ScanLimit = event?.ScanLimit;
    if(!ScanLimit) {
        ScanLimit = 100;
    }
    let ScanForward = true;

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

            let sf = true;
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

                if(params.Limit === 1 && firstChar === '<') {
                    sf = false;
                }
            }

            params.KeyConditionExpression = kce;
            params.ExpressionAttributeNames = ean;
            params.ExpressionAttributeValues = eav;
            params.ScanIndexForward = sf;

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
                "Id": "w",
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
                    "Id": "r",
                    "MetricStat": {
                        "Metric": {
                            "Namespace": "AWS/DynamoDB",
                            "MetricName": "ConsumedReadCapacityUnits",
                            "Dimensions": [{"Name": "TableName", "Value": TableName}]
                        },
                        "Period": 60, "Stat": "Sum", "Unit": "Count"
                    },
                    "ReturnData": true,
                },
                    {
                        "Id": "tw",
                        "MetricStat": {
                            "Metric": {
                                "Namespace": "AWS/DynamoDB",
                                "MetricName": "WriteThrottleEvents",
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


        if(ActionName === 'pricing') {
            const client = new PricingClient({ region: 'us-east-1' });

            const params = {
                ServiceCode: 'AmazonDynamoDB',
                Filters: [
                    {'Type': 'TERM_MATCH',
                     'Field': 'servicecode',
                     'Value': 'AmazonDynamoDB'},

                    {'Type': 'TERM_MATCH',
                    'Field': 'regionCode',
                    'Value': Region}
                ],
                FormatVersion: 'aws_v1',
                MaxResults: 100
            };

            const command = new GetProductsCommand(params);
            let priceResults = await client.send(command);

            const priceBook = {};

            priceResults.PriceList.map((offerTxt, index)=> {

                let offer = JSON.parse(offerTxt);
                let families = [
                    'Amazon DynamoDB PayPerRequest Throughput',
                    'Provisioned IOPS',
                    'Database Storage',
                    'DDB-Operation-ReplicatedWrite',
                ];

                if(offer.product.productFamily && families.includes(offer.product.productFamily)) {

                    let priceDimensions = offer?.terms?.OnDemand[Object.keys(offer?.terms?.OnDemand)[0]].priceDimensions;
                    let price;

                    Object.keys(priceDimensions).map((dim)=>{
                        if(dim?.pricePerUnit?.USD !== 0.0000000000) {
                            price = priceDimensions[dim]['pricePerUnit']['USD'];
                        }
                    });
                    priceBook[offer.product?.attributes?.usagetype] = price;
                }
            });

            results = {PriceList: priceBook};

        }


        if(ActionName === 'streams') {

            const streamsClient = new DynamoDBStreamsClient({ region: Region });

            const params = {
                /** input parameters */
            };
            const command = new DescribeStreamCommand(params);
            const streamMetadata = await streamsClient.send(command);


            results = {'stream': TableName + ' ' + Region + ' ' + 'shows'};

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
