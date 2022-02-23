import {
    useLoaderData,
} from "remix";


import {TableGrid} from "../components/TableGrid";

import {listTables, getTableMetadata} from "../components/ddb";

import { Menu } from "~/components/menu";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {

    const tables = await listTables(params.region);

    let tableMetadatas = [];

    for(table of tables) {
        const metadata = await getTableMetadata(params.region, table);
        tableMetadatas.push(metadata);
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

