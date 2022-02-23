// user configurable configuration settings for DynamoDB Viz tool

export const config = () => {
  return {
    "displayBytesMax" : 25,
    "regions": [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "eu-west-1",
        "localhost:8000"
    ],
    "prices": {
        "us-east-1": {
            "standard":         {"provisionedWCU":0.00065, "provisionedRCU":0.00013, "storage":0.25},
            "infrequentAccess": {"provisionedWCU":0.00081, "provisionedRCU":0.00016, "storage":0.10}
        },
        "us-east-2": {
            "standard":         {"provisionedWCU":0.00065, "provisionedRCU":0.00013, "storage":0.25},
            "infrequentAccess": {"provisionedWCU":0.00081, "provisionedRCU":0.00016, "storage":0.10}
        },
        "us-west-1": {
            "standard":         {"provisionedWCU":0.000725, "provisionedRCU":0.000145, "storage":0.28},
            "infrequentAccess": {"provisionedWCU":0.000906, "provisionedRCU":0.000181, "storage":0.112}
        },
        "us-west-2": {
            "standard":         {"provisionedWCU":0.00065, "provisionedRCU":0.00013, "storage":0.25},
            "infrequentAccess": {"provisionedWCU":0.00081, "provisionedRCU":0.00016, "storage":0.10}
        },
        "eu-west-1": {
            "standard":         {"provisionedWCU":0.000735, "provisionedRCU":0.000147, "storage":0.283},
            "infrequentAccess": {"provisionedWCU":0.000919, "provisionedRCU":0.000184, "storage":0.1132}
        }
     }
  };
};


