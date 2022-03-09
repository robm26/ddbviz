import {useLoaderData, useSearchParams} from "remix";

import {Menu}     from "~/components/menu";
import {StatsPanel}     from "~/components/StatsPanel";
import {handler} from "~/lambda/src";

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

    const metadata = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});

    let stats = [];

    const now = new Date();
    const before = new Date(now.getTime() - (minutesBack*60000));

        stats = await handler({
            Region:params.region,
            TableName:tableName,
            ActionName: 'stats',
            StartDate: before.toISOString(),
            EndDate:   now.toISOString()
        });

        //console.log(items.Items.length);



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

    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature

    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<StatsPanel
            stats={data.stats}
            region={data.params.region}
            table={data.params.table}
        />);


    return (<div>
        <Menu region={data.params.region} table={data.params.table}  gsi={gsi} setGsi={setGsi} />

        {payload}

    </div>);

}
