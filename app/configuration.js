// user configurable configuration settings for DynamoDB Viz tool

export const config = () => {


  return {
    "displayBytesMax" : 25,

      "gridFormatting":{
          "valueBig" : 2000,
          "valueHuge" : 5000
      },

    "regions": [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "eu-west-1",
        "demo",
        "localhost:8000",

    ]
  };
};


