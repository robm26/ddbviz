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

    let url = new URL(request.url);
    let sps = new URLSearchParams(url.searchParams);
    let sortAttr = sps.get('sortAttr');

    const tables = await listTables(params.region);

    let tableMetadatas = [];

    for(table of tables) {
        const metadata = await getTableMetadata(params.region, table);
        tableMetadatas.push(metadata);
    }

    return {
        region:params.region,
        tables:tableMetadatas,
        sortAttr: sortAttr
    };
};


export default function RegionIndex() {
    const data = useLoaderData();

    // let url = new URL(params.url);
    // let term = url.searchParams.get("term");
    // console.log('*** url ' + url);

    // const errors = useActionData();
    // const transition = useTransition();

    return (
        <div >
            <Menu region={data.region}/>


            <TableGrid metadatas={data.tables} sortAttr={data.sortAttr} sortForwards={true}/>


        </div>
    );
}

