import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { Item } from "~/components/Item";
import { handler } from "../lambda/src";
import { getTableMetadata } from "../components/ddb";


export const action = async ({ request }) => {

    // console.log(JSON.stringify(request));

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

    const PkName = ks[0].AttributeName;

    let SkName;
    if(ks.length > 1) {
        SkName = ks[1].AttributeName;
    }

    let item = {};

    item = await handler({
        Region:params.region,
        TableName:tableName,
        ActionName:'get',
        PkName: PkName,
        PkValue: params.pk,
        SkName: SkName,
        SkValue: params.sk,
        ReturnFormat:"both"
    });


    return {
        params:params,
        metadata:metadata,
        item:item?.Item,
        capacity:item?.ConsumedCapacity?.CapacityUnits
    };
};

export default function TableGetAction(params) {

    const data = useLoaderData();

    const stats = {rowCount: data?.item ? 1 : 0};
    stats.ConsumedCapacity = data?.capacity;
    stats.LastEvaluatedKey =  data?.lek ? data.lek : null;

    return (<div>

        <Menu region={data.params.region} table={data.params.table} stats={stats} pk={data.params.pk} sk={data.params.sk}/>

        <Item />


    </div>);

}
