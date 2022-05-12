REGION=us-west-1
ENDPOINTURL=https://dynamodb.$REGION.amazonaws.com
# ENDPOINTURL=http://localhost:8000

OUTPUT=text

if [ $# -gt 0 ]
  then
    aws dynamodb delete-table --table-name $1 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
  else
#     aws dynamodb delete-table --table-name DemoTable01 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
     aws dynamodb delete-table --table-name DemoTable02 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
     aws dynamodb delete-table --table-name DemoTable03 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable04 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable05 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable06 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable07 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable08 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable09 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
#     aws dynamodb delete-table --table-name DemoTable10 --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
  fi

