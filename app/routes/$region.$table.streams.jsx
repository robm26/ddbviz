import {useLoaderData, useSearchParams} from "remix";

import {Menu}     from "~/components/menu";
import {StreamsPanel}     from "~/components/StreamsPanel";
import {handler} from "~/lambda/src";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {
    const url = new URL(request.url);

    let tableName = params.table;

    const metadata = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});

    let streamArn;
    let streamShards = [];


    let streams = await handler({
        Region:params.region,
        TableName:tableName,
        ActionName: 'streams'
    });

    return {
        params:params,
        metadata:metadata['Table'],
        streams:streams
    };
};

export default function TableStatsAction(params) {
    const data = useLoaderData();

    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature


    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<div>
            {data?.metadata?.LatestStreamArn
                ? 'LatestStreamArn: ' + data?.metadata?.LatestStreamArn
                : 'This table does not have Streams enabled.'}
            <StreamsPanel
            region={data.params.region}
            table={data.params.table}
        /></div>);



    return (<div>
        <Menu region={data.params.region} table={data.params.table}  gsi={gsi} setGsi={setGsi} />

        {payload}

    </div>);

}
