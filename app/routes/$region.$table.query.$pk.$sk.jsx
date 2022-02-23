import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { ItemGrid } from "~/components/ItemGrid";
import {handler} from "../lambda/src";
import {getTableMetadata} from "../components/ddb";


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

    const metadata = await getTableMetadata(params.region, tableName);

    let ks = metadata.KeySchema;

    if(indexName) {
        ks = metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === indexName)[0].KeySchema;
    }

    const PkName = ks[0].AttributeName;
    const SkName = ks[1].AttributeName;

    let items = [];


    items = await handler({
        Region:params.region,
        TableName:tableName,
        IndexName:indexName,
        ActionName:'query',
        PkName: PkName,
        PkValue: params.pk,
        SkName: SkName,
        SkValue: params.sk,
        ScanCount: 1,
        ScanLimit: 999999,
        ReturnFormat:"both"
    });


    return {
        params:params,
        metadata:metadata,
        items:items?.Items,
        capacity:items?.ConsumedCapacity?.CapacityUnits
    };
};

export default function TableQueryAction(params) {

    const data = useLoaderData();
    const stats = {rowCount: data.items.length};
    stats.ConsumedCapacity = data?.capacity;
    stats.LastEvaluatedKey =  data?.lek ? data.lek : null;

    return (<div>

        <Menu region={data.params.region} table={data.params.table} stats={stats} pk={data.params.pk} sk={data.params.sk}/>

        <ItemGrid items={data.items}/>


    </div>);

}
