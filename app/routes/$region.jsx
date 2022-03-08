import {
    useLoaderData,
} from "remix";

import {TableGrid} from "../components/TableGrid";

import {handler} from '~/lambda/src';

import { Menu } from "~/components/menu";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {


    // const tables = await listTables(params.region);
    const requestBody = {
        'Region': params.region,
        'ActionName': 'list'
    };
    const tables = await handler(requestBody);

    let tableMetadatas = [];

    for(table of tables.TableNames) {
        const requestBody = {
            'Region': params.region,
            'ActionName': 'describe',
            'TableName': table
        };

        const metadata = await handler(requestBody);

        tableMetadatas.push(metadata?.Table);
    }

    return {
        region:params.region,
        tables:tableMetadatas
    };
};

export default function RegionIndex() {
    const data = useLoaderData();

    return (
        <div >
            <Menu region={data.region} />


            <TableGrid metadatas={data.tables} />


        </div>
    );
}

