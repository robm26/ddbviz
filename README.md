# ddb viz

A webapp to visualize your DynamoDB tables and table data, 
with a focus on cost optimization.


## Features

This tool allows you to click to an AWS region and see a smart grid
of all your DynamoDB tables.  Table sizes, configuration settings, and costs
are shown in sortable columns, allowing you to spot the tables with the biggest costs.

For tables with a high storage size relative to read and write capacity, the tool will 
calculate the potential savings if the table were converted to 
[DynamoDB Infrequent Access](https://aws.amazon.com/dynamodb/standard-ia/).  This is a mode that charges less for storage but
more for read and write operations, and is perfect for reducing
 the total monthly cost of huge tables with low activity.


### Prerequisites
 * An AWS account with DynamoDB tables
 * AWS CLI setup and configured with DynamoDB permissions
 * Node.JS with the ```aws-sdk``` installed
 * [Remix.run](https://remix.run) installed
 
 
## Setup

You can setup this webapp yourself on your laptop or in the 
AWS Cloud9 environment.

1. Clone the repository to your laptop 
1. Verify your environment is ready to connect to your AWS account by running
```aws sts get-caller-identity```  and ```aws dynamodb list-tables```
1. Open a shell terminal, navigate into the [app](./app/) 
folder, and type ```npm run dev```
1. Navigate to http://localhost:3000 to open the app.
1. Choose one of the regions listed, 
or you can choose localhost:8000 to use DynamoDB Local.
1. A grid with rows and columns should appear.  Notice the column headers are sortable.
1. Review the final columns which calculate and compare the 
monthly table costs in Standard and Infrequent Access (IA) modes.
1. If a table may benefit from IA, the monthly savings will be shown in green.


## Note
The regions available for navigation may be manually adjusted 
in the [app/configuration.js](./app/configuration.js) file.

While the app neither stores or requires AWS credentials to run, 
relying only on your existing CLI environment,
it does expose DynamoDB's list-tables via HTTP. 
It is recommended to stop the dev server when you are done.

## Contribute
Submit a PR or an Issue, or [share your feedback](https://twitter.com/robmccauley).
