import {
    Form,
    Link, useLoaderData, useLocation
} from "remix";


import { ItemGrid } from "../components/ItemGrid";
import { Menu }     from "~/components/menu";
// import { TableSummary } from "../components/TableSummary";
import { getTableMetadata } from "../components/ddb";

import { handler } from "../lambda/src/index";


export const loader = async ({ params }) => {

    let tableName = params.table;
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        tableName = tableName.substring(0, caretPosition);
    }


    const metadata = await getTableMetadata(params.region, tableName);

    return {
        params:params,
        metadata:metadata
        // items:items
    };
};


export const action = async ({request}) => {

    const body = await request.formData();
    console.log('action body\n' + JSON.stringify(body));
    return null;

};

export default function TableDetails() {
    const location = useLocation();
    const data = useLoaderData();

    if(!data.metadata)  {
        return (<div className="errorPanel">Error getting table metadata for {data.params.table}</div>);
    }


    const requestBody = {
        'Region': data.params.region,
        'TableName': data.params.region,
        'ScanCount': 2,
        'ScanLimit': 3,
        'ReturnFormat': 'both'
    };



    return (
        <div className="TableDetails">
            <Menu region={data.params.region} table={data.params.table} />

        </div>
    );
}

