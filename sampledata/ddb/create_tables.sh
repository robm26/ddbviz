REGION=us-west-1

ENDPOINTURL=https://dynamodb.$REGION.amazonaws.com
# ENDPOINTURL=http://localhost:8000
OUTPUT=text


if [ $# -gt 0 ]
  then
    aws dynamodb create-table --cli-input-json "file://$1.json" --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
  else

    aws dynamodb create-table --cli-input-json file://DemoTable01.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable02.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable03.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable04.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable05.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable06.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable07.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable08.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable09.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
    aws dynamodb create-table --cli-input-json file://DemoTable10.json --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'

fi

# Upgrade to Global Tables: add replica in new region
#

#aws dynamodb update-table --table-name DemoTable02 --cli-input-json  --region us-west-2 \
#'{"ReplicaUpdates":[ { "Create": { "RegionName": "eu-west-1" } } ] }'
#
#aws dynamodb update-table --table-name DemoTable03 --cli-input-json --region us-west-2  \
#'{"ReplicaUpdates":[ { "Create": { "RegionName": "us-west-1" } } ] }'
#
#aws dynamodb update-table --table-name DemoTable03 --cli-input-json --region us-west-2  \
#'{"ReplicaUpdates":[ { "Create": { "RegionName": "ap-northeast-1" } } ] }'
