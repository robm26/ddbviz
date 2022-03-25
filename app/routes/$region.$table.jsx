import {
    useLoaderData, useLocation,
    redirect
} from "remix";

import * as fs from 'fs';

import { Menu }     from "~/components/menu";

import { handler } from "../lambda/src/index";

export const loader = async ({ params }) => {

    let tableName = params.table;
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        tableName = tableName.substring(0, caretPosition);
    }

    let metadata;

    if(params.region === 'demo') {
        const fileContents = fs.readFileSync(
            './app/samples/' + tableName + '.json',
            {encoding: 'utf-8'},
        );
        metadata = JSON.parse(fileContents);


    } else {
        const requestBody = {
            'Region': params.region,
            'ActionName': 'describe',
            'TableName': tableName
        };

        metadata = await handler(requestBody);
    }

    return {
        params:params,
        metadata:metadata['Table']
    };
};

export const action = async ({request}) => {
    const body = await request.formData();
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

