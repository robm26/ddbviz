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
    let requestBody = {
        'Region': params.region,
        'ActionName': 'pricing'
    };
    const prices = await handler(requestBody);


    requestBody = {
        'Region': params.region,
        'ActionName': 'list'
    };
    const tables = await handler(requestBody);

    let tableMetadatas = [];

    if(tables?.TableNames) {
        for(table of tables.TableNames) {
            const requestBody = {
                'Region': params.region,
                'ActionName': 'describe',
                'TableName': table
            };

            const metadata = await handler(requestBody);

            tableMetadatas.push(metadata?.Table);
        }
    }

    console.log('Prices in region ' + params.region);

    let plKeys = Object.keys(prices.PriceList).sort();

    plKeys.map((key) => {
        console.log((key + '                ').slice(0,31) + ' ' + prices.PriceList[key] );
    });

    return {
        region:params.region,
        tables:tableMetadatas,
        prices: prices.PriceList
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

