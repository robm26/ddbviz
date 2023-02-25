import {
    DynamoDBClient,
    ListTablesCommand,
    DescribeTableCommand,
    ScanCommand,
    QueryCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";
// import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import {DynamoDBStreamsClient, DescribeStreamCommand} from "@aws-sdk/client-dynamodb-streams";

import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

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
    let SkValueType = event?.SkValueType;

    const ScanCount = event?.ScanCount || 1;
    let ScanLimit = event?.ScanLimit;
    if(!ScanLimit) {
        ScanLimit = 100;
    }
    //let ScanForward = true;

    // const ReturnFormat = event?.ReturnFormat || 'data';

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

                // console.log('typeof SkValue: ' + typeof SkValue);

                if(['<','>'].includes(firstChar)) {
                    operator = firstChar;
                    kceSort = " And #sk " + operator + " :sk";
                    SkValue = SkValue.slice(1);
                    SkType = SkValueType;

                } else if ('*' === finalChar) {
                    kceSort = " And begins_with(#sk, :sk)";
                    SkValue = SkValue.slice(0, -1);

                }

                kce = "#pk = :pk " + kceSort;
                ean["#sk"] = SkName;

                eav[":sk"] = {};
                // console.log('SkValue, type ' + SkValue.toString() + ' ' + typeof SkValue);
                // console.log('SkType ' + SkType);

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

            results = response;
        }

        if(ActionName === 'pricing') {
            const client = new PricingClient({ region: 'us-east-1' });

            const paramsProduct = {
                ServiceCode: 'AmazonDynamoDB',
                Filters: [
                    {'Type': 'TERM_MATCH',
                     'Field': 'servicecode',
                     'Value': 'AmazonDynamoDB'},

                    // {'Type': 'TERM_MATCH',
                    // 'Field': 'regionCode',
                    // 'Value': Region}
                ],
                FormatVersion: 'aws_v1',

                MaxResults: 100
            };

            let NextToken = 'next';

            let allPrices = [];
            let counter = 0;

            let priceResults;

            while(NextToken.length > 0) {
                counter += 1;
                const pcommand = new GetProductsCommand(paramsProduct);
                priceResults = await client.send(pcommand);
                allPrices = [].concat(allPrices, priceResults?.PriceList);
                // console.log('price list length: ' + allPrices.length);

                if(priceResults?.NextToken) {
                    // console.log('NextToken: ' + priceResults.NextToken);
                    NextToken = priceResults?.NextToken;
                    paramsProduct['NextToken'] = NextToken;

                } else {
                    NextToken = '';
                }
            }

            const priceBook = {};

            allPrices.map((offerTxt, index)=> {

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

                    function isNumeric(n) {
                        return !isNaN(parseFloat(n)) && isFinite(n);
                    }

                    Object.keys(priceDimensions).map((dim)=>{

                        if(!isNumeric(priceDimensions[dim].endRange)) {
                            price = priceDimensions[dim]['pricePerUnit']['USD'];
                        }
                    });

                    priceBook[offer.product?.attributes?.usagetype] = price;
                }
            });

            results = {PriceList: priceBook};

        }


        if(ActionName === 'streams') {

            const activeShards = [];
            const arn = event?.StreamArn;
            const reg = arn.split(":")[3];

            const streamsClient = new DynamoDBStreamsClient({ region: reg });

            let loop = true;
            let loopCount = 0;
            let LastEvaluatedShardId;
            let params = {
                'StreamArn': event?.StreamArn,
                'Limit': 100
            };

            while(loop) {
                loopCount += 1;

                let streamMetadata;
                let command;

                try {
                    command = new DescribeStreamCommand(params);
                    streamMetadata = await streamsClient.send(command);

                }  catch (error) {
                    console.log(JSON.stringify(error, null, 2));
                }

                // console.log('smd\n' + JSON.stringify(streamMetadata));

                LastEvaluatedShardId = streamMetadata['StreamDescription']['LastEvaluatedShardId'];
                if(LastEvaluatedShardId) {
                    params['ExclusiveStartShardId'] = LastEvaluatedShardId;
                } else {
                    loop = false;
                }

                streamMetadata['StreamDescription']['Shards'].map((shard, index)=>{
                    if(!shard['SequenceNumberRange']['EndingSequenceNumber']) {
                        activeShards.push(shard['ShardId']);
                    }
                });

            }

            results = {'activeShards': activeShards};

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
