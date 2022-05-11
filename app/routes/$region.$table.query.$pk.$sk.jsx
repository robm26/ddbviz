import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { ItemGrid } from "~/components/ItemGrid";
import { Item } from "~/components/Item";
import {handler} from "~/lambda/src";

export const action = async ({ request }) => {

    return null;
};

export const loader = async ({ params, request }) => {

    let tableName = params.table;
    let indexName = '';
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        indexName = tableName.substring(caretPosition + 1);
        tableName = tableName.substring(0, caretPosition);
    }

    const md = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});
    const metadata = md.Table;

    let ks = metadata.KeySchema;
    let ads = metadata.AttributeDefinitions;

    if(indexName) {
        ks = metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === indexName)[0].KeySchema;
    }

    const PkName = ks[0].AttributeName;
    const PkType = ads.filter(item => item.AttributeName === PkName)[0].AttributeType;

    const SkName = ks[1].AttributeName;
    const SkType = ads.filter(item => item.AttributeName === SkName)[0].AttributeType;

    let items = [];

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    let sf = true; // scan forward
    if(limit && params?.sk.slice(0,1) === '<') {
        sf = false;
    }

    let event = {
        Region:params.region,
        TableName:tableName,
        IndexName:indexName,
        ActionName:'query',
        PkName: PkName,
        PkValue: params.pk,
        SkName: SkName,
        SkValue: params.sk,
        SkValueType: SkType,
        ScanCount: 1,
        ScanLimit: parseInt(limit) || 99999999,
        ScanForward: sf,
        ReturnFormat:"both"
    };


    if(PkType === 'N' && !isNaN(params.pk)) {
        if(params.pk.indexOf(".") > -1) {
            event.PkValue = parseFloat(params.pk);
        } else {
            event.PkValue = parseInt(params.pk);
        }
    }
    if(SkType === 'N' && !isNaN(params.sk)) {

        if(params.sk.indexOf(".") > -1) {
            event.SkValue = parseFloat(params.sk);
        } else {
            event.SkValue = parseInt(params.sk);
        }
    }

    items = await handler(event);


    return {
        params:params,
        metadata:metadata,
        items:items?.Items,
        capacity:items?.ConsumedCapacity?.CapacityUnits,
        error:items?.error
    };
};

export default function TableQueryActionPkSk(params) {

    const data = useLoaderData();
    const stats = {rowCount: data?.items?.length};
    stats.ConsumedCapacity = data?.capacity;
    stats.LastEvaluatedKey =  data?.lek ? data.lek : null;
    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature

    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        stats.rowCount === 1 ? (<Item gsi={gsi} />) : (<ItemGrid  gsi={gsi} />) ;

    return (<div>

        <Menu region={data.params.region} table={data.params.table} stats={stats} pk={data.params.pk} sk={data.params.sk} gsi={gsi} setGsi={setGsi}/>

        {payload}


    </div>);

}
