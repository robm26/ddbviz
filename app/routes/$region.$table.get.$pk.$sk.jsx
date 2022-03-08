import {useLoaderData} from "remix";

import { Menu }     from "~/components/menu";
import { Item } from "~/components/Item";
import { handler } from "~/lambda/src";


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

    const md = await handler({'Region': params.region, 'ActionName': 'describe', 'TableName': tableName});
    const metadata = md.Table;

    let ks = metadata.KeySchema;
    let ads = metadata.AttributeDefinitions;


    const PkName = ks[0].AttributeName;
    const PkType = ads.filter(item => item.AttributeName === PkName)[0].AttributeType;


    let SkName;
    let SkType;

    if(ks.length > 1) {
        SkName = ks[1].AttributeName;

        SkType = ads.filter(item => item.AttributeName === SkName)[0].AttributeType;

    }


    let item = {};
    let event = {
        Region:params.region,
        TableName:tableName,
        ActionName:'get',
        PkName: PkName,
        PkValue: params.pk,
        SkName: SkName,
        SkValue: params.sk,
        ReturnFormat:"both"
    };

    if(PkType === 'S') {
        event.PkValue = params.pk.toString();
    } else {

        if(!isNaN(params.pk)) {
            if(params.pk.indexOf(".") > -1) {
                event.PkValue = parseFloat(params.pk);
            } else {
                event.PkValue = parseInt(params.pk);
            }
        }
    }

    if(SkType === 'S' && SkName) {

        event.SkValue = params.sk.toString();
    } else {

        if(!isNaN(params.sk)) {
            if(params.sk.indexOf(".") > -1) {
                event.SkValue = parseFloat(params.sk);
            } else {
                event.SkValue = parseInt(params.sk);
            }
        }

    }


    item = await handler(event);


    return {
        params:params,
        metadata:metadata,
        item:item?.Item,
        capacity:item?.ConsumedCapacity?.CapacityUnits,
        error:item?.error
    };
};

export default function TableGetActionPkSk(params) {

    const data = useLoaderData();

    const stats = {rowCount: data?.item ? 1 : 0};
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
