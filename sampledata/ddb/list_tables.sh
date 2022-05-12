REGION=us-west-1
ENDPOINTURL=http://localhost:8000
ENDPOINTURL=https://dynamodb.$REGION.amazonaws.com

aws dynamodb list-tables --region $REGION --endpoint-url $ENDPOINTURL --output table
