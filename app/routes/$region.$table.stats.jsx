import {useLoaderData, Link} from "remix";

import {Menu}     from "~/components/menu";
import {StatsPanel}     from "~/components/StatsPanel";
import {handler} from "~/lambda/src";

import * as fs from 'fs';

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {
    const url = new URL(request.url);
    const minutesBack = url.searchParams.get("minutesBack");

    let tableName = params.table;
    let indexName = '';
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        indexName = tableName.substring(caretPosition + 1);
        tableName = tableName.substring(0, caretPosition);
    }

    //const metadata = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});

    let metadata;

    if(params.region === 'demo') {
        const fileContents = fs.readFileSync(
            './app/demos/' + tableName + '.json',
            {encoding: 'utf-8'},
        );

        metadata = JSON.parse(fileContents);

    } else {
        const requestBody = {
            'Region': params.region,
            'ActionName': 'describe',
            'TableName': tableName
        };

        metadata = await handler(requestBody);
    }


    let stats = [];

    const now = new Date();
    const before = new Date(now.getTime() - (minutesBack*60000));

    if(params.region === 'demo') {

        const fileContents = fs.readFileSync(
            './app/demos/stats/' + tableName + '.json',
            {encoding: 'utf-8'},
        );
        stats = JSON.parse(fileContents);

    } else {
        stats = await handler({
            Region:params.region,
            TableName:tableName,
            ActionName: 'stats',
            StartDate: before.toISOString(),
            EndDate:   now.toISOString()
        });
        console.log('statsssse');
        // console.log(JSON.stringify(stats, null, 2));
    }


    return {
        params:params,
        metadata:metadata['Table'],
        minutesBack: minutesBack,
        stats:stats
        // items:items?.Items,
        // capacity:items?.ConsumedCapacity?.CapacityUnits,
        // lek:items?.LastEvaluatedKey,
        // error:items?.error
    };
};

export default function TableStatsAction(params) {
    const data = useLoaderData();

    const path = '/' + data.params.region + '/' + data.params.table;

    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature

    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<StatsPanel
            stats={data.stats}
            region={data.params.region}
            table={data.params.table}
        />);

    const streamsLink = (<div className='cwForm'>DynamoDB Streams&nbsp;&nbsp;&nbsp;
        <Link to={path + '/streams'}><button className=''>DESCRIBE STREAM</button></Link>
    </div>);

    return (<div>
        <Menu region={data.params.region} table={data.params.table}  gsi={gsi} setGsi={setGsi} />


        {/*{payload}*/}
        {/*{streamsLink}*/}

        {/*{data.params.region === 'demo' ? null : payload}*/}
        {/*{data.params.region === 'demo' ? null : streamsLink}*/}

    </div>);

}
