import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { ItemGrid } from "~/components/ItemGrid";
import {handler} from "~/lambda/src";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params }) => {

    let tableName = params.table;
    let indexName = '';
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        indexName = tableName.substring(caretPosition + 1);
        tableName = tableName.substring(0, caretPosition);
    }

    const metadata = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});

    let items = [];

    if(params?.action === 'scan') {

        items = await handler({
            Region:params.region,
            TableName:tableName,
            IndexName:indexName,
            ActionName: 'scan',
            ScanCount: 1,
            ScanLimit: 999999,
            ReturnFormat:"both"
        });
        //console.log(items.Items.length);

    }


    return {
        params:params,
        metadata:metadata['Table'],
        items:items?.Items,
        capacity:items?.ConsumedCapacity?.CapacityUnits,
        lek:items?.LastEvaluatedKey,
        error:items?.error
    };
};

export default function TableScanAction(params) {
    const data = useLoaderData();
    const stats = {rowCount: data?.items?.length};
    stats.ConsumedCapacity = data?.capacity;
    stats.LastEvaluatedKey =  data?.lek ? data.lek : null;
    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature

    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<ItemGrid gsi={gsi} />);


    return (<div>
        <Menu region={data.params.region} table={data.params.table} stats={stats} gsi={gsi} setGsi={setGsi} />
        {payload}

    </div>);

}
