import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { Item } from "~/components/Item";
import { handler } from "~/lambda/src";


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

    const md = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});
    const metadata = md.Table;

    let ks = metadata.KeySchema;

    const PkName = ks[0].AttributeName;

    let SkName;
    if(ks.length > 1) {
        SkName = ks[1].AttributeName;
    }

    let item = {};

    let event = {
        Region:params.region,
        TableName:tableName,
        ActionName:'get',
        PkName: PkName,
        PkValue: params.pk,
        SkName: '',
        SkValue: '',
        ReturnFormat:"both"
    };


    item = await handler(event);


    return {
        params:params,
        metadata:metadata,
        item:item?.Item,
        capacity:item?.ConsumedCapacity?.CapacityUnits,
        error:item?.error
    };
};

export default function TableGetActionPk(params) {

    const data = useLoaderData();

    const stats = {rowCount: data?.items?.length};
    stats.ConsumedCapacity = data?.capacity;
    const error = data?.error;

    const [gsi, setGsi] = React.useState('');  // GSI hover to preview feature

    const payload = error ?
        (<div className="errorPanel">{error.name}<br/>{error.message}</div>) :
        (<Item  gsi={gsi} />);

    return (<div>

        <Menu region={data.params.region} table={data.params.table} stats={stats} pk={data.params.pk} sk={data.params.sk} gsi={gsi} setGsi={setGsi} />

        {payload}


    </div>);

}
