import {useLoaderData, useSearchParams} from "remix";

import {Menu}     from "~/components/menu";
import {StreamsPanel}     from "~/components/StreamsPanel";
import {handler} from "~/lambda/src";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {

    let tableName = params.table;

    const metadata = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});

    let shards;
    if(metadata?.Table?.LatestStreamArn) {

        shards = await handler({
            StreamArn: metadata?.Table?.LatestStreamArn,
            ActionName: 'streams'
        });
    }

    return {
        params:params,
        metadata:metadata['Table'],
        shards:shards
    };
};

export default function TableStatsAction(params) {
    const data = useLoaderData();

    // console.log('     ********** hello streaams');
    // console.log(Object.keys(data.params).toString());

    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature


    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<div>
            {data?.metadata?.LatestStreamArn
                ? (<StreamsPanel region={data.params.region} table={data.params.table} shards={data.shards} />)
                : 'This table does not have Streams enabled.'}

        </div>);



    return (<div>
        <Menu region={data.params.region} table={data.params.table}  gsi={gsi} setGsi={setGsi} />
        {/*<span>{data?.metadata?.LatestStreamArn}</span>*/}
        {payload}

    </div>);

}
