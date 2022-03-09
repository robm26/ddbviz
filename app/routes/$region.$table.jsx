import {
    useLoaderData, useLocation,
    redirect
} from "remix";

import { Menu }     from "~/components/menu";
// import { TableSummary } from "../components/TableSummary";

import { handler } from "../lambda/src/index";

export const loader = async ({ params }) => {

    let tableName = params.table;
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        tableName = tableName.substring(0, caretPosition);
    }

    const requestBody = {
        'Region': params.region,
        'ActionName': 'describe',
        'TableName': tableName
    };

    const metadata = await handler(requestBody);

    return {
        params:params,
        metadata:metadata['Table']
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


    return (
        <div className="TableDetails">
            <Menu region={data.params.region} table={data.params.table} />


        </div>
    );
}

