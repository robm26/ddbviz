#!/usr/bin/env bash
REGION=us-west-1
FUNCTION=ddbviz

rm index.zip
cd src
zip -r ../index.zip .
cd ..
aws lambda update-function-code --function-name $FUNCTION \
      --zip-file fileb://index.zip \
      --region $REGION \
      --output json \
      --query '{"Arn ": FunctionArn, "Role": Role}'

